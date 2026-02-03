'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { packSizeAPI, userAPI } from "@/services/api";

interface PackSize {
    pack_size_id: string;
    pack_size_name: string;
    pack_size_short_name: string;
    qty_per_carton: number;
    uom: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}

// Helper function to format dates consistently
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

export default function PackSizeMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPackSize, setSelectedPackSize] = useState<PackSize | null>(null);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [packSizes, setPackSizes] = useState<PackSize[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
    const isSubmittingRef = useRef(false);

    const [formData, setFormData] = useState({
        pack_size_id: "",
        pack_size_name: "",
        pack_size_short_name: "",
        qty_per_carton: "",
        uom: "NOS",
        active: true,
    });

    // Load pack sizes from API
    const loadPackSizes = async () => {
        try {
            setLoading(true);
            const data = await packSizeAPI.getAll();
            setPackSizes(data);
            
            // Load users for displaying names
            try {
                const users = await userAPI.getAll();
                const userMapData = new Map<string, string>();
                users.forEach((user: any) => {
                    if (user.user_id && user.user_name) {
                        userMapData.set(user.user_id, user.user_name);
                    }
                });
                setUserMap(userMapData);
            } catch (error) {
                console.error('Error loading users:', error);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load pack sizes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPackSizes();
    }, []);

    const filteredPackSizes = packSizes.filter((packSize) => {
        const matchesSearch = packSize.pack_size_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            packSize.pack_size_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            packSize.pack_size_short_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "true" && packSize.active === true) ||
            (filterActive === "false" && packSize.active === false);
        
        return matchesSearch && matchesActive;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredPackSizes.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedPackSizes = filteredPackSizes.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await packSizeAPI.create(formData);
            toast({
                title: "Success",
                description: "Pack Size created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                pack_size_id: "",
                pack_size_name: "",
                pack_size_short_name: "",
                qty_per_carton: "",
                uom: "NOS",
                active: true,
            });
            loadPackSizes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create pack size",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (packSize: PackSize) => {
        setSelectedPackSize(packSize);
        setFormData({
            pack_size_id: packSize.pack_size_id,
            pack_size_name: packSize.pack_size_name,
            pack_size_short_name: packSize.pack_size_short_name,
            qty_per_carton: packSize.qty_per_carton.toString(),
            uom: packSize.uom,
            active: packSize.active !== undefined ? packSize.active : true,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await packSizeAPI.update(selectedPackSize!.pack_size_id, formData);
            toast({
                title: "Success",
                description: "Pack Size updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedPackSize(null);
            loadPackSizes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update pack size",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (packSize: PackSize) => {
        setSelectedPackSize(packSize);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await packSizeAPI.delete(selectedPackSize!.pack_size_id);
            toast({
                title: "Success",
                description: "Pack Size deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedPackSize(null);
            loadPackSizes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete pack size",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-auto lg:ml-64">
                    <div className="p-8 flex items-center justify-center">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 md:mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pack Size Master</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Define and manage packaging configurations and carton quantities</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add New Pack Size</span>
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
                                        placeholder="Search by Pack Size ID, Name, or Short Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredPackSizes.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredPackSizes.length)} OF {filteredPackSizes.length}
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
                                                <Label className="text-sm font-semibold text-foreground">Active Status</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pack-active-all" 
                                                            name="packActiveFilter"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="pack-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pack-active-true" 
                                                            name="packActiveFilter"
                                                            checked={filterActive === "true"}
                                                            onChange={() => setFilterActive("true")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="pack-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pack-active-false" 
                                                            name="packActiveFilter"
                                                            checked={filterActive === "false"}
                                                            onChange={() => setFilterActive("false")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="pack-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
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
                                                onClick={() => {
                                                    setFilterActive("all");
                                                }}
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
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">pack size_id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">pack size name</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">pack size short name</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">qty per carton</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">uom</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">last modified user id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">last modified date & time</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Active</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedPackSizes.map((packSize, index) => (
                                            <motion.tr
                                                key={packSize.pack_size_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{packSize.pack_size_id}</td>
                                                <td className="px-4 py-3 text-sm font-semibold">{packSize.pack_size_name}</td>
                                                <td className="px-4 py-3 text-sm">{packSize.pack_size_short_name}</td>
                                                <td className="px-4 py-3 text-sm">{packSize.qty_per_carton}</td>
                                                <td className="px-4 py-3 text-sm">{packSize.uom}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {packSize.last_modified_user_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-muted-foreground">{packSize.last_modified_user_id}</span>
                                                            {userMap.get(packSize.last_modified_user_id) && (
                                                                <span className="text-xs text-muted-foreground">{userMap.get(packSize.last_modified_user_id)}</span>
                                                            )}
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{formatDateTime(packSize.last_modified_date_time)}</td>
                                                <td className="px-4 py-3 text-sm font-semibold">{packSize.active ? "TRUE" : "FALSE"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(packSize);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(packSize);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    PAGE {currentPage} OF {totalPages || 1}
                                </span>
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
                </div>
            </main>

            {/* Add Pack Size Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Pack Size</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="pack_size_id"
                                                value={formData.pack_size_id}
                                                onChange={handleInputChange}
                                                placeholder="PK06"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="pack_size_name"
                                                value={formData.pack_size_name}
                                                onChange={handleInputChange}
                                                placeholder="6s pack"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="pack_size_short_name"
                                                value={formData.pack_size_short_name}
                                                onChange={handleInputChange}
                                                placeholder="6s pack"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Qty Per Carton <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                name="qty_per_carton"
                                                value={formData.qty_per_carton}
                                                onChange={handleInputChange}
                                                placeholder="6"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                UOM <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="NOS">NOS</option>
                                                <option value="KG">KG</option>
                                                <option value="GMS">GMS</option>
                                            </select>
                                        </div>
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
                                        >
                                            Save Pack Size
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Pack Size Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Pack Size</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="pack_size_id"
                                                value={formData.pack_size_id}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="pack_size_name"
                                                value={formData.pack_size_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="pack_size_short_name"
                                                value={formData.pack_size_short_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Qty Per Carton <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                name="qty_per_carton"
                                                value={formData.qty_per_carton}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                UOM <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="NOS">NOS</option>
                                                <option value="KG">KG</option>
                                                <option value="GMS">GMS</option>
                                            </select>
                                        </div>
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
                                        >
                                            Update Pack Size
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Confirm Delete</h2>
                                    <button
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        className="text-white hover:bg-red-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to delete <strong>{selectedPackSize?.pack_size_name}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        This action cannot be undone.
                                    </p>
                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDeleteDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmDelete}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

