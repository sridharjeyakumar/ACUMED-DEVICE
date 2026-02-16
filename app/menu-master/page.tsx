'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Menu as MenuIcon } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { menuAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Menu {
    menu_id: string;
    menu_desc: string;
    active: boolean;
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date | string; // Date
}

// Helper function to format dates consistently (prevents hydration errors)
function formatDateTime(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

export default function MenuMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [menuToCancel, setMenuToCancel] = useState<Menu | null>(null);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: Menu } | null>(null);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [cancelledMenus, setCancelledMenus] = useState<Set<string>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        menu_id: "",
        menu_desc: "",
        active: true,
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ menu_id: "", menu_desc: "", active: true });
        }
    }, [isAddModalOpen]);

    const loadMenus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await menuAPI.getAll();
            setMenus(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load menus",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadMenus();
    }, [loadMenus]);

    const filteredMenus = menus.filter((menu) => {
        const matchesSearch = menu.menu_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            menu.menu_desc.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && menu.active === true) ||
            (filterActive === "inactive" && menu.active === false);
        
        return matchesSearch && matchesActive;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredMenus.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedMenus = filteredMenus.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await menuAPI.create(formData);
            toast({
                title: "Success",
                description: "Menu created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ menu_id: "", menu_desc: "", active: true });
            loadMenus();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create menu",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (menu: Menu) => {
        setSelectedMenu(menu);
        setFormData({
            menu_id: menu.menu_id,
            menu_desc: menu.menu_desc,
            active: menu.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedMenu) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedMenu };
        
        try {
            await menuAPI.update(selectedMenu.menu_id, {
                menu_desc: formData.menu_desc,
                active: formData.active,
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Menu updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedMenu(null);
            setFormData({ menu_id: "", menu_desc: "", active: true });
            loadMenus();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update menu",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    
    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            if (lastAction.type === 'edit') {
                // Restore previous data
                await menuAPI.update(lastAction.data.menu_id, {
                    menu_desc: lastAction.data.menu_desc,
                    active: lastAction.data.active,
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadMenus();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (menu: Menu) => {
        setMenuToCancel(menu);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!menuToCancel) return;
        
        const isCancelled = cancelledMenus.has(menuToCancel.menu_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await menuAPI.update(menuToCancel.menu_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledMenus(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(menuToCancel.menu_id);
                    toast({
                        title: "Restored",
                        description: `Menu ${menuToCancel.menu_desc} has been restored`,
                    });
                } else {
                    newSet.add(menuToCancel.menu_id);
                    toast({
                        title: "Cancelled",
                        description: `Menu ${menuToCancel.menu_desc} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadMenus(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setMenuToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} menu`,
                variant: "destructive",
            });
        }
    };

    const handleCancelClick = (modalType: 'add' | 'edit') => {
        setCancelModalType(modalType);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (cancelModalType === 'add') {
            setIsAddModalOpen(false);
            setFormData({ menu_id: "", menu_desc: "", active: true });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedMenu(null);
            setFormData({ menu_id: "", menu_desc: "", active: true });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Menu Master</h1>
                                <p className="text-muted-foreground">Manage application menu items and navigation</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Menu
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6"
                    >
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search menus by ID or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredMenus.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredMenus.length)} OF {filteredMenus.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="end">
                                        <div className="p-4 border-b border-border">
                                            <h3 className="font-semibold text-sm text-foreground">Filters</h3>
                                        </div>
                                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-foreground">Status</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="menu-active-all" 
                                                            name="menuActiveStatus"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="menu-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="menu-active-true" 
                                                            name="menuActiveStatus"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="menu-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="menu-active-false" 
                                                            name="menuActiveStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="menu-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">No. of rows per screen</Label>
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-border bg-muted/30">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => setFilterActive("all")}
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Menu Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Menu Desc</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Active</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>User Id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>Date & Time</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredMenus.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No menus found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedMenus.map((menu, index) => {
                                                const isCancelled = cancelledMenus.has(menu.menu_id);
                                                return (
                                            <motion.tr
                                                key={menu.menu_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                        {menu.menu_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {menu.menu_desc}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        menu.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {menu.active ? "TRUE" : "FALSE"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {menu.last_modified_user_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-mono text-foreground">{menu.last_modified_user_id}</span>
                                                            <span className="text-xs text-muted-foreground">{menu.last_modified_user_id}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {menu.last_modified_date_time 
                                                            ? formatDateTime(menu.last_modified_date_time)
                                                            : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(menu);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            disabled={isCancelled}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancel(menu);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore menu" : "Cancel menu"}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE {currentPage} OF {totalPages || 1}</span>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">ALL SYSTEMS OPERATIONAL</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time Data Sync • ACUMED DEVICES Manufacturing Cloud v4.2
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => handleCancelClick('add')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Menu</h2>
                                    <button
                                        onClick={() => handleCancelClick('add')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Menu ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_id"
                                            value={formData.menu_id}
                                            onChange={handleInputChange}
                                            placeholder="e.g., M00, T01, D00"
                                            required
                                            maxLength={3}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Menu Description <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_desc"
                                            value={formData.menu_desc}
                                            onChange={handleInputChange}
                                            placeholder="Enter menu description"
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Save Menu
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => handleCancelClick('edit')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Menu 1</h2>
                                    <button
                                        onClick={() => handleCancelClick('edit')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Menu ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_id"
                                            value={formData.menu_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Menu Description <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_desc"
                                            value={formData.menu_desc}
                                            onChange={handleInputChange}
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Update Menu
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel? Any unsaved changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelDialogOpen(false)}>
                            No, Continue Editing
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
                            Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Item Confirmation Dialog (for table actions) */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {menuToCancel && cancelledMenus.has(menuToCancel.menu_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {menuToCancel && cancelledMenus.has(menuToCancel.menu_id)
                                ? `Are you sure you want to restore menu "${menuToCancel.menu_desc}"?`
                                : `Are you sure you want to cancel menu "${menuToCancel?.menu_desc}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setMenuToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={menuToCancel && cancelledMenus.has(menuToCancel.menu_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {menuToCancel && cancelledMenus.has(menuToCancel.menu_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

