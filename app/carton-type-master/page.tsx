'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Search, Plus, Filter, Pencil, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { cartonTypeAPI } from "@/services/api";

interface CartonType {
    carton_type_id: string; // Char(2) - PK
    carton_type_name: string; // Char(100)
    carton_type_shortname: string; // Char(50)
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date; // Date
    active: boolean; // Boolean
}

// Helper function to format dates consistently
function formatDateTime(date: Date | string): string {
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

export default function CartonTypeMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCartonType, setSelectedCartonType] = useState<CartonType | null>(null);
    const [cartonTypes, setCartonTypes] = useState<CartonType[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [formData, setFormData] = useState({
        carton_type_id: "",
        carton_type_name: "",
        carton_type_shortname: "",
        active: true,
    });
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: CartonType } | null>(null);

    useEffect(() => {
        loadCartonTypes();
    }, []);

    const loadCartonTypes = async () => {
        try {
            setLoading(true);
            const data = await cartonTypeAPI.getAll();
            setCartonTypes(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load carton types",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredCartonTypes = cartonTypes.filter((item) => {
        const matchesSearch = item.carton_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.carton_type_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.carton_type_shortname.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && item.active) ||
            (filterActive === "inactive" && !item.active);
        
        return matchesSearch && matchesActive;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredCartonTypes.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedCartonTypes = filteredCartonTypes.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await cartonTypeAPI.create({
                carton_type_id: formData.carton_type_id.toUpperCase(),
                carton_type_name: formData.carton_type_name,
                carton_type_shortname: formData.carton_type_shortname,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Carton type created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                carton_type_id: "",
                carton_type_name: "",
                carton_type_shortname: "",
                active: true,
            });
            loadCartonTypes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create carton type",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (cartonType: CartonType) => {
        setSelectedCartonType(cartonType);
        setFormData({
            carton_type_id: cartonType.carton_type_id,
            carton_type_name: cartonType.carton_type_name,
            carton_type_shortname: cartonType.carton_type_shortname,
            active: cartonType.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedCartonType) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedCartonType };
        
        try {
            await cartonTypeAPI.update(selectedCartonType.carton_type_id, {
                carton_type_name: formData.carton_type_name,
                carton_type_shortname: formData.carton_type_shortname,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Carton type updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedCartonType(null);
            setFormData({
                carton_type_id: "",
                carton_type_name: "",
                carton_type_shortname: "",
                active: true,
            });
            loadCartonTypes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update carton type",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };
    
    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            // Restore previous data
            await cartonTypeAPI.update(lastAction.data.carton_type_id, {
                carton_type_name: lastAction.data.carton_type_name,
                carton_type_shortname: lastAction.data.carton_type_shortname,
                active: lastAction.data.active,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Undone",
                description: "Changes have been reverted",
            });
            setLastAction(null);
            loadCartonTypes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleDelete = (cartonType: CartonType) => {
        setSelectedCartonType(cartonType);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCartonType) return;
        
        // Store previous state for undo
        const previousData = { ...selectedCartonType };
        
        try {
            await cartonTypeAPI.delete(selectedCartonType.carton_type_id);
            
            // Store last action for undo
            setLastAction({ type: 'delete', data: previousData });
            
            toast({
                title: "Success",
                description: "Carton type deleted successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndoDelete}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsDeleteDialogOpen(false);
            setSelectedCartonType(null);
            loadCartonTypes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete carton type",
                variant: "destructive",
            });
        }
    };
    
    const handleUndoDelete = async () => {
        if (!lastAction || lastAction.type !== 'delete') return;
        
        try {
            // Restore deleted data
            await cartonTypeAPI.create({
                carton_type_id: lastAction.data.carton_type_id,
                carton_type_name: lastAction.data.carton_type_name,
                carton_type_shortname: lastAction.data.carton_type_shortname,
                active: lastAction.data.active,
                last_modified_user_id: lastAction.data.last_modified_user_id || "ADMIN",
            });
            toast({
                title: "Restored",
                description: "Carton type has been restored",
            });
            setLastAction(null);
            loadCartonTypes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to restore carton type",
                variant: "destructive",
            });
        }
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Carton Type Master</h1>
                                <p className="text-muted-foreground">Manage carton types and configurations</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Carton Type
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
                                <div className="flex-1 relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Carton Type ID, Name, or Shortname..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

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
                                                            id="active-all" 
                                                            name="activeFilter"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="active-true" 
                                                            name="activeFilter"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="active-false" 
                                                            name="activeFilter"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
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

                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredCartonTypes.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredCartonTypes.length)} OF {filteredCartonTypes.length}
                                </span>
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">carton type_id</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">carton type name</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">carton type shortname</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">last modified user id</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">last modified date & time</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading carton types...
                                                </td>
                                            </tr>
                                        ) : filteredCartonTypes.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                                                    No carton types found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedCartonTypes.map((item, index) => (
                                                <motion.tr
                                                    key={item.carton_type_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-6 text-sm font-semibold text-blue-600 align-middle">
                                                        {item.carton_type_id}
                                                    </td>
                                                    <td className="px-6 py-6 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.carton_type_name}</span>
                                                    </td>
                                                    <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                        {item.carton_type_shortname}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                        {item.last_modified_user_id ? (
                                                            <span className="text-sm font-mono text-foreground">{item.last_modified_user_id}</span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                        {item.last_modified_date_time 
                                                            ? formatDateTime(item.last_modified_date_time)
                                                            : "-"}
                                                    </td>
                                                    <td className="px-6 py-6 text-center align-middle">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                                            item.active 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {item.active ? 'TRUE' : 'FALSE'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 text-center align-middle">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(item);
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
                                                                    handleDelete(item);
                                                                }}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
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
                            Real-time Data Sync • ACUMED Manufacturing Cloud v4.2
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* Add Carton Type Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Carton Type</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Carton Type ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input 
                                            name="carton_type_id" 
                                            value={formData.carton_type_id} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g., PK, ST, SH" 
                                            required 
                                            maxLength={2}
                                            className="uppercase"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Maximum 2 characters</p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Carton Type Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input 
                                            name="carton_type_name" 
                                            value={formData.carton_type_name} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g., Packing Carton" 
                                            required 
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Carton Type Shortname <span className="text-red-500">*</span>
                                        </label>
                                        <Input 
                                            name="carton_type_shortname" 
                                            value={formData.carton_type_shortname} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g., Packing" 
                                            required 
                                            maxLength={50}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="active"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="active" className="text-sm font-semibold text-foreground cursor-pointer">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={isSubmittingRef.current}>
                                            Save
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Carton Type Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Carton Type</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Carton Type ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input 
                                            name="carton_type_id" 
                                            value={formData.carton_type_id} 
                                            onChange={handleInputChange} 
                                            required 
                                            disabled
                                            className="uppercase"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Carton Type Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input 
                                            name="carton_type_name" 
                                            value={formData.carton_type_name} 
                                            onChange={handleInputChange} 
                                            required 
                                            maxLength={100}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Carton Type Shortname <span className="text-red-500">*</span>
                                        </label>
                                        <Input 
                                            name="carton_type_shortname" 
                                            value={formData.carton_type_shortname} 
                                            onChange={handleInputChange} 
                                            required 
                                            maxLength={50}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="edit-active"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="edit-active" className="text-sm font-semibold text-foreground cursor-pointer">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={isSubmittingRef.current}>
                                            Update
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
                                        Are you sure you want to delete <strong>{selectedCartonType?.carton_type_name}</strong>?
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

