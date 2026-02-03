'use client';

import { useState, useEffect, useRef } from "react";
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

    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:52',message:'useEffect mounted, calling loadMenus',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        loadMenus();
    }, []);

    const loadMenus = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:56',message:'loadMenus called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4,H5'})}).catch(()=>{});
        // #endregion
        try {
            setLoading(true);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:59',message:'Before menuAPI.getAll',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2,H4'})}).catch(()=>{});
            // #endregion
            const data = await menuAPI.getAll();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:62',message:'After menuAPI.getAll',data:{dataType:Array.isArray(data)?'array':'other',dataLength:Array.isArray(data)?data.length:'N/A',firstItem:Array.isArray(data)&&data.length>0?data[0]:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H5'})}).catch(()=>{});
            // #endregion
            setMenus(data);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:65',message:'setMenus called',data:{menusCount:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
            // #endregion
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:67',message:'loadMenus error',data:{error:error.message,errorName:error.name,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Error",
                description: error.message || "Failed to load menus",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:82',message:'handleSubmit called',data:{formData,isSubmitting:isSubmittingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
        // #endregion
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:88',message:'Before menuAPI.create',data:{formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            await menuAPI.create(formData);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:90',message:'After menuAPI.create success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Success",
                description: "Menu created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ menu_id: "", menu_desc: "", active: true });
            loadMenus();
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:99',message:'handleSubmit error',data:{error:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:117',message:'handleEditSubmit called',data:{selectedMenuId:selectedMenu?.menu_id,formData,isSubmitting:isSubmittingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
        // #endregion
        if (isSubmittingRef.current) return;
        if (!selectedMenu) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedMenu };
        
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:124',message:'Before menuAPI.update',data:{id:selectedMenu.menu_id,updateData:{menu_desc:formData.menu_desc,active:formData.active}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            await menuAPI.update(selectedMenu.menu_id, {
                menu_desc: formData.menu_desc,
                active: formData.active,
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:130',message:'After menuAPI.update success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:140',message:'handleEditSubmit error',data:{error:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
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
        setCancelledMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menu.menu_id)) {
                newSet.delete(menu.menu_id);
                toast({
                    title: "Restored",
                    description: `Menu ${menu.menu_desc} has been restored`,
                });
            } else {
                newSet.add(menu.menu_id);
                toast({
                    title: "Cancelled",
                    description: `Menu ${menu.menu_desc} has been cancelled`,
                });
            }
            return newSet;
        });
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
                                <span className="text-sm text-muted-foreground">
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
                                                Clear Filter
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
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                MENU ID
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                MENU DESCRIPTION
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                STATUS
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                LAST MODIFIED USER ID / NAME
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">
                                                LAST MODIFIED DATE & TIME
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                ACTIONS
                                            </th>
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
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        menu.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {menu.active ? "Active" : "Inactive"}
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
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancel(menu);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore menu" : "Cancel menu"}
                                                        >
                                                            Cancel
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
                            onClick={() => setIsAddModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Menu</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
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
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="px-6"
                                        >
                                            Cancel
                                        </Button>
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
                            onClick={() => setIsEditModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Menu 1</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
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
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="px-6"
                                        >
                                            Cancel
                                        </Button>
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

        </div>
    );
}

