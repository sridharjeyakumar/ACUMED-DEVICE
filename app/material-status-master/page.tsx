'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { locationAPI, materialStatusAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";
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

interface MaterialStatus {
    matl_status_id: string; // Char(3) - PK
    material_status: string; // Char(30)
    stock_movement?: string; // Char(3) - dropdown (IN / OUT) - can be empty
    effect_in_stock?: string; // Char(1) - dropdown (+ / -) - can be empty
    seq_no: number; // N(2)
    active: boolean;
    goods_movement?: string; // Char(1)
    against_gr?: string; // Char(1)
    unit_split_allowed?: string; // Char(1)
    approval_required?: string; // Char(1)
    location_id?: string; // Char(2) - FK
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date; // Date
}
interface Location {
    location_id: string; // Char(2) - PK
    location_name: string; // Char(25)
    last_modified_user_id?: string; // Char(5)
    location_icon?: string; // image
    last_modified_date_time?: Date; // Date
    active: boolean;
}
// Helper function to format dates consistently (prevents hydration errors)
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

export default function MaterialStatusMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [statusToCancel, setStatusToCancel] = useState<MaterialStatus | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<MaterialStatus | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const [selectedStatus, setSelectedStatus] = useState<MaterialStatus | null>(null);
    const isSubmittingRef = useRef(false);
    const [filterActive, setFilterActive] = useState<string>("active");
    const [filterStockMovement, setFilterStockMovement] = useState<string>("all");
    const [statuses, setStatuses] = useState<MaterialStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: MaterialStatus } | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        matl_status_id: "",
        material_status: "",
        stock_movement: "",
        effect_in_stock: "",
        seq_no: "",
        active: true,
        goods_movement: "N",
        against_gr: "N",
        unit_split_allowed: "N",
        approval_required: "N",
        location_id: "",
    });
    const [locations, setLocations] = useState<Location[]>([]);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                matl_status_id: "",
                material_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
                goods_movement: "",
                against_gr: "",
                unit_split_allowed: "",
                approval_required: "",
                location_id: "",
            });
        }
    }, [isAddModalOpen]);
        useEffect(() => {
            const loadProducts = async () => {
                try {
                    const data = await locationAPI.getAll();
                    setLocations(data);
                } catch (error) {
                    console.error("Failed to load locations", error);
                }
            };
            loadProducts();
        }, []);
    const loadStatuses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await materialStatusAPI.getAll();
            // Ensure each status has the active field (default to true if not present)
            const statusesWithActive = data.map((status: any) => ({
                ...status,
                active: status.active !== undefined ? status.active : true
            }));
            setStatuses(statusesWithActive);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load material statuses",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadStatuses();
    }, [loadStatuses]);

    const filteredStatuses = statuses.filter((status) => {
        const matchesSearch = status.matl_status_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            status.material_status.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && status.active === true) ||
            (filterActive === "inactive" && status.active === false);
        
        const matchesStockMovement = filterStockMovement === "all" || 
            status.stock_movement === filterStockMovement ||
            (filterStockMovement === "empty" && !status.stock_movement);
        
        return matchesSearch && matchesActive && matchesStockMovement;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredStatuses.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedStatuses = filteredStatuses.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, filterStockMovement, rowsPerPage]);

    const uniqueStockMovements = Array.from(new Set(statuses.map(s => s.stock_movement).filter(s => s)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked ? 'Y' : 'N' });
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
            await materialStatusAPI.create({
                matl_status_id: formData.matl_status_id,
                material_status: formData.material_status,
                stock_movement: formData.stock_movement || '',
                effect_in_stock: formData.effect_in_stock || '',
                seq_no: parseInt(formData.seq_no) || 0,
                active: true, // Always set to true for new statuses
                goods_movement: formData.goods_movement || '',
                against_gr: formData.against_gr || '',
                unit_split_allowed: formData.unit_split_allowed || '',
                approval_required: formData.approval_required || '',
                last_modified_user_id: "ADMIN",
                location_id: formData.location_id || '',
            });
            toast({
                title: "Success",
                description: "Material status created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                matl_status_id: "",
                material_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
                goods_movement: "",
                against_gr: "",
                unit_split_allowed: "",
                approval_required: "",
                location_id: "",
            });
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create material status",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (status: MaterialStatus) => {
        setStatusToDelete(status);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!statusToDelete) return;
        try {
            await materialStatusAPI.delete(statusToDelete.matl_status_id);
            toast({ title: "Deleted", description: "Material status permanently deleted" });
            setIsDeleteDialogOpen(false);
            setStatusToDelete(null);
            loadStatuses();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete material status", variant: "destructive" });
        }
    };

    const handleEdit = (status: MaterialStatus) => {
        // Only allow editing if status is active
        if (!status.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "Cancelled statuses cannot be edited",
                variant: "destructive",
            });
            return;
        }
        
        setSelectedStatus(status);
        setFormData({
            matl_status_id: status.matl_status_id,
            material_status: status.material_status,
            stock_movement: status.stock_movement || "",
            effect_in_stock: status.effect_in_stock || "",
            seq_no: status.seq_no.toString(),
            active: status.active,
            goods_movement: status.goods_movement || "",
            against_gr: status.against_gr || "",
            unit_split_allowed: status.unit_split_allowed || "",
            approval_required: status.approval_required || "",
            location_id: status.location_id || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedStatus) return;
        
        // Double-check if status is still active
        if (!selectedStatus.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "This status has been cancelled and cannot be edited",
                variant: "destructive",
            });
            setIsEditModalOpen(false);
            return;
        }
        
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedStatus };
        
        try {
            await materialStatusAPI.update(selectedStatus.matl_status_id, {
                material_status: formData.material_status,
                stock_movement: formData.stock_movement || '',
                effect_in_stock: formData.effect_in_stock || '',
                seq_no: parseInt(formData.seq_no) || 0,
                active: formData.active,
                goods_movement: formData.goods_movement || '',
                against_gr: formData.against_gr || '',
                unit_split_allowed: formData.unit_split_allowed || '',
                approval_required: formData.approval_required || '',
                last_modified_user_id: "ADMIN",
                location_id: formData.location_id || '',
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Material status updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({
                matl_status_id: "",
                material_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
                goods_movement: "",
                against_gr: "",
                unit_split_allowed: "",
                approval_required: "",
                location_id: "",
            });
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update material status",
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
                await materialStatusAPI.update(lastAction.data.matl_status_id, {
                    material_status: lastAction.data.material_status,
                    stock_movement: lastAction.data.stock_movement || '',
                    effect_in_stock: lastAction.data.effect_in_stock || '',
                    seq_no: lastAction.data.seq_no,
                    active: lastAction.data.active,
                    goods_movement: lastAction.data.goods_movement || '',
                    against_gr: lastAction.data.against_gr || '',
                    unit_split_allowed: lastAction.data.unit_split_allowed || '',
                    approval_required: lastAction.data.approval_required || '',
                    last_modified_user_id: "ADMIN",
                    location_id: lastAction.data.location_id || '',
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (status: MaterialStatus) => {
        // Only allow cancelling if status is active
        if (!status.active) {
            toast({
                title: "Already Cancelled",
                description: "This status is already cancelled",
                variant: "destructive",
            });
            return;
        }
        
        setStatusToCancel(status);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!statusToCancel) return;
        
        try {
            await materialStatusAPI.update(statusToCancel.matl_status_id, {
                material_status: statusToCancel.material_status,
                stock_movement: statusToCancel.stock_movement || '',
                effect_in_stock: statusToCancel.effect_in_stock || '',
                seq_no: statusToCancel.seq_no,
                active: false, // Set to inactive
                goods_movement: statusToCancel.goods_movement || '',
                against_gr: statusToCancel.against_gr || '',
                unit_split_allowed: statusToCancel.unit_split_allowed || '',
                approval_required: statusToCancel.approval_required || '',
                last_modified_user_id: "ADMIN",
                location_id: statusToCancel.location_id || '',
            });
            
            // Update local state by reloading from API
            await loadStatuses();
            
            toast({
                title: "Cancelled",
                description: `Material status ${statusToCancel.material_status} has been cancelled`,
                variant: "default",
            });
            
            setIsCancelItemDialogOpen(false);
            setStatusToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel material status",
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
            setFormData({ matl_status_id: "", material_status: "", stock_movement: "", effect_in_stock: "", seq_no: "", active: true, goods_movement: "N", against_gr: "N", unit_split_allowed: "N", approval_required: "N", location_id: "" });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({ matl_status_id: "", material_status: "", stock_movement: "", effect_in_stock: "", seq_no: "", active: true, goods_movement: "N", against_gr: "N", unit_split_allowed: "N", approval_required: "N", location_id: "" });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };
const getLocationDisplay = (locationId: string) => {
    if (!locationId) return "-";
    const location = locations.find(l => l.location_id === locationId);
    return location ? `${location.location_id} - ${location.location_name}` : locationId;
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Material Status Master</h1>
                                <p className="text-muted-foreground">Define and manage various statuses for materials</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Material Status
                            </Button>
                        </div>
                    </motion.div>


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
                                        placeholder="Search by Status ID or Material Status..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredStatuses.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredStatuses.length)} OF {filteredStatuses.length}
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
                                                            id="ms-active-all" 
                                                            name="msActiveStatus"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ms-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ms-active-true" 
                                                            name="msActiveStatus"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ms-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ms-active-false" 
                                                            name="msActiveStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ms-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            {uniqueStockMovements.length > 0 && (
                                                <div className="space-y-3 pt-3 border-t border-border">
                                                    <Label className="text-sm font-semibold text-foreground">Stock Movement</Label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="ms-movement-all" 
                                                                name="msMovementFilter"
                                                                checked={filterStockMovement === "all"}
                                                                onChange={() => setFilterStockMovement("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="ms-movement-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueStockMovements.map((movement) => (
                                                            <div key={movement} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`ms-movement-${movement}`} 
                                                                    name="msMovementFilter"
                                                                    checked={filterStockMovement === movement}
                                                                    onChange={() => setFilterStockMovement(movement)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`ms-movement-${movement}`} className="text-sm font-normal cursor-pointer text-foreground">{movement}</Label>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="ms-movement-empty" 
                                                                name="msMovementFilter"
                                                                checked={filterStockMovement === "empty"}
                                                                onChange={() => setFilterStockMovement("empty")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="ms-movement-empty" className="text-sm font-normal cursor-pointer text-foreground">Empty</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
                                                    setFilterStockMovement("all");
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
                            <div className="overflow-auto max-h-[360px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Matl Status Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Material Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Stock Movement</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Effect In Stock</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Goods Movement</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Against GR</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Unit Split Allowed</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Approval Required</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Location Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Seq No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status</th>
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
                                                <td colSpan={14} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading material statuses...
                                                </td>
                                            </tr>
                                        ) : filteredStatuses.length === 0 ? (
                                            <tr>
                                                <td colSpan={14} className="px-6 py-4 text-center text-muted-foreground">
                                                    No material statuses found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedStatuses.map((status, index) => (
                                                <motion.tr
                                                    key={status.matl_status_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${!status.active ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground font-mono">{status.matl_status_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.material_status}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.stock_movement || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-semibold">{status.effect_in_stock || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm text-foreground font-mono">{status.goods_movement || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm text-foreground font-mono">{status.against_gr || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm text-foreground font-mono">{status.unit_split_allowed || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm text-foreground font-mono">{status.approval_required || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{getLocationDisplay(status.location_id)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.seq_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            status.active 
                                                                ? "bg-green-100 text-green-800" 
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                            {status.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {status.last_modified_user_id ? (
                                                            <span className="text-sm font-mono text-foreground">{status.last_modified_user_id}</span>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {status.last_modified_date_time 
                                                                ? formatDateTime(status.last_modified_date_time)
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
                                                                    handleEdit(status);
                                                                }}
                                                                className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${
                                                                    !status.active && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                                disabled={!status.active && !isSuperAdmin}
                                                                title={!status.active && !isSuperAdmin ? "Cannot edit cancelled statuses" : "Edit status"}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(status);
                                                                }}
                                                                className={`${
                                                                    status.active
                                                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        : 'opacity-50 cursor-not-allowed'
                                                                }`}
                                                                disabled={!status.active}
                                                                title={status.active ? "Cancel status" : "Already cancelled"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(status);
                                                                    }}
                                                                    className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                                    title="Permanently delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
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
                </div>
            </main>

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
                                    <h2 className="text-2xl font-bold">Add Material Status</h2>
                                    <button
                                        onClick={() => handleCancelClick('add')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Matl Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="matl_status_id"
                                                value={formData.matl_status_id}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={2}
                                                placeholder="e.g. RE"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Status <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_status"
                                                value={formData.material_status}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={30}
                                                placeholder="e.g. Receipt from Supplier"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Stock Movement
                                            </label>
                                            <select
                                                name="stock_movement"
                                                value={formData.stock_movement}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="IN">IN</option>
                                                <option value="OUT">OUT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Effect in Stock
                                            </label>
                                            <select
                                                name="effect_in_stock"
                                                value={formData.effect_in_stock}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="+">+</option>
                                                <option value="-">-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Goods Movement
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="goods_movement"
                                                    id="add_goods_movement"
                                                    checked={formData.goods_movement === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Against GR Only
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="against_gr"
                                                    id="add_against_gr"
                                                    checked={formData.against_gr === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Unit Split Allowed
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="unit_split_allowed"
                                                    id="add_unit_split_allowed"
                                                    checked={formData.unit_split_allowed === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Approval Required
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="approval_required"
                                                    id="add_approval_required"
                                                    checked={formData.approval_required === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                                                                                                  <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Location Id <span className="text-red-500">*</span>
    </label>
    <select
        name="location_id"
        value={formData.location_id}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
        required
    >
        <option value="">Select a location</option>
        {locations.filter(location => location.active).map(location => (
            <option key={location.location_id} value={location.location_id}>
                {location.location_id} - {location.location_name}
            </option>
        ))}
    </select>
</div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Seq No. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="seq_no"
                                                type="number"
                                                value={formData.seq_no}
                                                onChange={handleInputChange}
                                                required
                                                min={1}
                                                max={99}
                                                placeholder="e.g. 1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Active Status</label>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="active"
                                                        checked={formData.active === true}
                                                        onChange={() => setFormData({ ...formData, active: true })}
                                                        className="text-blue-600"
                                                        disabled // Disable in add modal since it will always be active
                                                    />
                                                    <span className="text-sm">Yes (default)</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Status</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                                    <h2 className="text-2xl font-bold">Edit Material Status</h2>
                                    <button
                                        onClick={() => handleCancelClick('edit')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Matl Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="matl_status_id"
                                                value={formData.matl_status_id}
                                                onChange={handleInputChange}
                                                maxLength={2}
                                                required
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Status <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_status"
                                                value={formData.material_status}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={30}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Stock Movement
                                            </label>
                                            <select
                                                name="stock_movement"
                                                value={formData.stock_movement}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="IN">IN</option>
                                                <option value="OUT">OUT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Effect in Stock
                                            </label>
                                            <select
                                                name="effect_in_stock"
                                                value={formData.effect_in_stock}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="+">+</option>
                                                <option value="-">-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Goods Movement
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="goods_movement"
                                                    id="edit_goods_movement"
                                                    checked={formData.goods_movement === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Against GR Only
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="against_gr"
                                                    id="edit_against_gr"
                                                    checked={formData.against_gr === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Unit Split Allowed
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="unit_split_allowed"
                                                    id="edit_unit_split_allowed"
                                                    checked={formData.unit_split_allowed === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Approval Required
                                            </label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    name="approval_required"
                                                    id="edit_approval_required"
                                                    checked={formData.approval_required === 'Y'}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                                                                                               <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Location Id <span className="text-red-500">*</span>
    </label>
    <select
        name="location_id"
        value={formData.location_id}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
        required
    >
        <option value="">Select a location</option>
        {locations.filter(location => location.active).map(location => (
            <option key={location.location_id} value={location.location_id}>
                {location.location_id} - {location.location_name}
            </option>
        ))}
    </select>
</div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Seq No. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="seq_no"
                                                type="number"
                                                value={formData.seq_no}
                                                onChange={handleInputChange}
                                                required
                                                min={1}
                                                max={99}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Active Status</label>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="active"
                                                        checked={formData.active === true}
                                                        onChange={() => setFormData({ ...formData, active: true })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="active"
                                                        checked={formData.active === false}
                                                        onChange={() => setFormData({ ...formData, active: false })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Status</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation Dialog (for modals) */}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Material Status</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete &quot;{statusToDelete?.material_status}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setStatusToDelete(null); }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Item Confirmation Dialog (for table actions) */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel material status {statusToCancel?.material_status}? 
                            This will make it inactive and it cannot be edited or used in the future.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setStatusToCancel(null);
                        }}>
                            No, Keep Active
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Yes, Cancel Status
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}