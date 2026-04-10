'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, ArrowRight, AlertCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { productStatusTransitionAPI, productStatusAPI } from "@/services/api";
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

interface ProductStatus {
    prod_status_id: string;
    product_status: string;
    active: boolean;
}

interface ProductStatusTransition {
    _id?: string;
    product_status_id: string;
    from_product_status_id: string;
    sterilization_required: string;
    lock_qty_change?: string;
    approval_required: string;
    seq_no: number;
    no_of_days_min?: number;
    no_of_days_max?: number;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active: boolean;
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

export default function ProductStatusTransitionMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
    const [transitionToDeactivate, setTransitionToDeactivate] = useState<ProductStatusTransition | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [transitionToDelete, setTransitionToDelete] = useState<ProductStatusTransition | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const [selectedTransition, setSelectedTransition] = useState<ProductStatusTransition | null>(null);
    const [filterActive, setFilterActive] = useState<string>("active");
    const [filterSterilization, setFilterSterilization] = useState<string>("all");
    const [filterApproval, setFilterApproval] = useState<string>("all");
    const isSubmittingRef = useRef(false);
    const [transitions, setTransitions] = useState<ProductStatusTransition[]>([]);
    const [statuses, setStatuses] = useState<ProductStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'deactivate'; data: ProductStatusTransition } | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        product_status_id: "",
        from_product_status_id: "",
        sterilization_required: "N",
        lock_qty_change: "N",
        approval_required: "N",
        seq_no: "",
        no_of_days_min: "",
        no_of_days_max: "",
        active: true,
    });

    const emptyForm = {
        product_status_id: "",
        from_product_status_id: "",
        sterilization_required: "N",
        lock_qty_change: "N",
        approval_required: "N",
        seq_no: "",
        no_of_days_min: "",
        no_of_days_max: "",
        active: true,
    };

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData(emptyForm);
        }
    }, [isAddModalOpen]);

    // Load transitions and statuses
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [transitionsData, statusesData] = await Promise.all([
                productStatusTransitionAPI.getAll(),
                productStatusAPI.getAll()
            ]);
            
            setTransitions([...transitionsData].sort((a, b) => a.seq_no - b.seq_no));
            setStatuses(statusesData);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Get status name by ID
    const getStatusName = (statusId: string) => {
        const status = statuses.find(s => s.prod_status_id === statusId);
        return status ? `${statusId} - ${status.product_status}` : statusId;
    };

    // Filter transitions
    const filteredTransitions = transitions.filter((transition) => {
        const fromStatus = getStatusName(transition.from_product_status_id).toLowerCase();
        const toStatus = getStatusName(transition.product_status_id).toLowerCase();
        const matchesSearch = fromStatus.includes(searchQuery.toLowerCase()) ||
            toStatus.includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && transition.active === true) ||
            (filterActive === "inactive" && transition.active === false);
        
        const matchesSterilization = filterSterilization === "all" || 
            transition.sterilization_required === filterSterilization;
        
        const matchesApproval = filterApproval === "all" || 
            transition.approval_required === filterApproval;
        
        return matchesSearch && matchesActive && matchesSterilization && matchesApproval;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredTransitions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTransitions = filteredTransitions.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, filterSterilization, filterApproval, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
// Helper function for Product Status
const getProductStatusDisplay = (statusId: string) => {
    if (!statusId) return "-";
    const status = statuses.find(s => s.prod_status_id === statusId);
    return status ? `${status.prod_status_id} - ${status.product_status}` : statusId;
};
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        
        try {
            await productStatusTransitionAPI.create({
                product_status_id: formData.product_status_id,
                from_product_status_id: formData.from_product_status_id,
                sterilization_required: formData.sterilization_required,
                lock_qty_change: formData.lock_qty_change,
                approval_required: formData.approval_required,
                seq_no: parseInt(formData.seq_no) || 0,
                no_of_days_min: formData.no_of_days_min !== "" ? parseInt(formData.no_of_days_min) : undefined,
                no_of_days_max: formData.no_of_days_max !== "" ? parseInt(formData.no_of_days_max) : undefined,
                active: true,
                last_modified_user_id: "ADMIN",
            });
            
            toast({
                title: "Success",
                description: "Product status transition created successfully",
            });
            setIsAddModalOpen(false);
            setFormData(emptyForm);
            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create transition",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (transition: ProductStatusTransition) => {
        setTransitionToDelete(transition);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!transitionToDelete) return;
        try {
            await productStatusTransitionAPI.delete(transitionToDelete._id!);
            toast({ title: "Deleted", description: "Transition permanently deleted" });
            setIsDeleteDialogOpen(false);
            setTransitionToDelete(null);
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete transition", variant: "destructive" });
        }
    };

    const handleEdit = (transition: ProductStatusTransition) => {
        if (!transition.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "Deactivated transitions cannot be edited",
                variant: "destructive",
            });
            return;
        }
        
        setSelectedTransition(transition);
        setFormData({
            product_status_id: transition.product_status_id,
            from_product_status_id: transition.from_product_status_id,
            sterilization_required: transition.sterilization_required,
            lock_qty_change: transition.lock_qty_change,
            approval_required: transition.approval_required,
            seq_no: transition.seq_no.toString(),
            no_of_days_min: transition.no_of_days_min?.toString() ?? "",
            no_of_days_max: transition.no_of_days_max?.toString() ?? "",
            active: transition.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedTransition) return;
        
        if (!selectedTransition.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "This transition has been deactivated and cannot be edited",
                variant: "destructive",
            });
            setIsEditModalOpen(false);
            return;
        }
        
        isSubmittingRef.current = true;
        
        const previousData = { ...selectedTransition };
        
        try {
            await productStatusTransitionAPI.update(selectedTransition._id!, {
                sterilization_required: formData.sterilization_required,
                lock_qty_change: formData.lock_qty_change,
                approval_required: formData.approval_required,
                seq_no: parseInt(formData.seq_no) || 0,
                no_of_days_min: formData.no_of_days_min !== "" ? parseInt(formData.no_of_days_min) : undefined,
                no_of_days_max: formData.no_of_days_max !== "" ? parseInt(formData.no_of_days_max) : undefined,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });
            
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Product status transition updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedTransition(null);
            setFormData(emptyForm);
            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update transition",
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
                await productStatusTransitionAPI.update(lastAction.data._id!, {
                    sterilization_required: lastAction.data.sterilization_required,
                    lock_qty_change: lastAction.data.lock_qty_change,
                    approval_required: lastAction.data.approval_required,
                    seq_no: lastAction.data.seq_no,
                    active: lastAction.data.active,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleDeactivate = (transition: ProductStatusTransition) => {
        if (!transition.active) {
            toast({
                title: "Already Deactivated",
                description: "This transition is already deactivated",
                variant: "destructive",
            });
            return;
        }
        
        setTransitionToDeactivate(transition);
        setIsDeactivateDialogOpen(true);
    };

    const confirmDeactivate = async () => {
        if (!transitionToDeactivate) return;
        
        try {
            await productStatusTransitionAPI.update(transitionToDeactivate._id!, {
                active: false,
                last_modified_user_id: "ADMIN",
            });
            
            await loadData();
            
            toast({
                title: "Deactivated",
                description: `Status transition has been deactivated`,
                variant: "default",
            });
            
            setIsDeactivateDialogOpen(false);
            setTransitionToDeactivate(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to deactivate transition",
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
            setFormData(emptyForm);
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedTransition(null);
            setFormData(emptyForm);
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product Status Transition Master</h1>
                                <p className="text-muted-foreground">Define valid transitions between product statuses and their requirements</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Transition
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
                                        placeholder="Search by From Status or To Status..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredTransitions.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredTransitions.length)} OF {filteredTransitions.length}
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
                                                            id="active-all" 
                                                            name="activeStatus"
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
                                                            name="activeStatus"
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
                                                            name="activeStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Sterilization Required</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="sterilization-all" 
                                                            name="sterilizationFilter"
                                                            checked={filterSterilization === "all"}
                                                            onChange={() => setFilterSterilization("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="sterilization-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="sterilization-y" 
                                                            name="sterilizationFilter"
                                                            checked={filterSterilization === "Y"}
                                                            onChange={() => setFilterSterilization("Y")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="sterilization-y" className="text-sm font-normal cursor-pointer text-foreground">Yes</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="sterilization-n" 
                                                            name="sterilizationFilter"
                                                            checked={filterSterilization === "N"}
                                                            onChange={() => setFilterSterilization("N")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="sterilization-n" className="text-sm font-normal cursor-pointer text-foreground">No</Label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Approval Required</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="approval-all" 
                                                            name="approvalFilter"
                                                            checked={filterApproval === "all"}
                                                            onChange={() => setFilterApproval("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="approval-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="approval-y" 
                                                            name="approvalFilter"
                                                            checked={filterApproval === "Y"}
                                                            onChange={() => setFilterApproval("Y")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="approval-y" className="text-sm font-normal cursor-pointer text-foreground">Yes</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="approval-n" 
                                                            name="approvalFilter"
                                                            checked={filterApproval === "N"}
                                                            onChange={() => setFilterApproval("N")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="approval-n" className="text-sm font-normal cursor-pointer text-foreground">No</Label>
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
                                                    setFilterSterilization("all");
                                                    setFilterApproval("all");
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">To Product Status ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">From Product Status ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Sterilization Required</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Approval Required</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Seq No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Lock Quantity Change</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">No. of Days Min</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">No. of Days Max</th>
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
                                                <td colSpan={10} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading transitions...
                                                </td>
                                            </tr>
                                        ) : filteredTransitions.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-4 text-center text-muted-foreground">
                                                    No transitions found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedTransitions.map((transition, index) => (
                                                <motion.tr
                                                    key={transition._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${!transition.active ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                        <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <span className="ftext-sm font-mono text-foreground">{getProductStatusDisplay(transition.product_status_id)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <span className="text-sm font-mono text-foreground">{getProductStatusDisplay(transition.from_product_status_id)}</span>
                                                        </div>
                                                    </td>
                                               
                                                
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                            transition.sterilization_required === 'Y'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : transition.sterilization_required === 'B'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {transition.sterilization_required === 'Y' ? 'Y' : transition.sterilization_required === 'B' ? 'Both' : 'N'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                            transition.approval_required === 'Y' 
                                                                ? 'bg-purple-100 text-purple-800' 
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {transition.approval_required === 'Y' ? 'Y' : 'N'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-foreground">{transition.seq_no}</span>
                                                    </td>
                                                     <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-foreground">{transition.lock_qty_change ?? "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-foreground">{transition.no_of_days_min ?? "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-foreground">{transition.no_of_days_max ?? "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            transition.active 
                                                                ? "bg-green-100 text-green-800" 
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                            {transition.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {transition.last_modified_user_id ? (
                                                            <span className="text-sm font-mono text-foreground">{transition.last_modified_user_id}</span>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {transition.last_modified_date_time 
                                                                ? formatDateTime(transition.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(transition)}
                                                                className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${
                                                                    !transition.active && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                                disabled={!transition.active && !isSuperAdmin}
                                                                title={!transition.active && !isSuperAdmin ? "Cannot edit inactive transitions" : "Edit transition"}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeactivate(transition)}
                                                                className={`${
                                                                    transition.active
                                                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        : 'opacity-50 cursor-not-allowed'
                                                                }`}
                                                                disabled={!transition.active}
                                                                title={transition.active ? "Deactivate transition" : "Already inactive"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(transition)}
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

            {/* Add Transition Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Status Transition</h2>
                                    <button
                                        onClick={() => handleCancelClick('add')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="space-y-6">
                                        {/* From Status Selection */}
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <label className="block text-sm font-semibold text-blue-800 mb-2">
                                                From Product Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="from_product_status_id"
                                                value={formData.from_product_status_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="">Select From Status...</option>
                                                {statuses.filter(s => s.active).map((status) => (
                                                    <option key={status.prod_status_id} value={status.prod_status_id}>
                                                        {status.prod_status_id} - {status.product_status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* To Status Selection */}
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <label className="block text-sm font-semibold text-green-800 mb-2">
                                                To Product Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="product_status_id"
                                                value={formData.product_status_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-green-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none"
                                                required
                                            >
                                                <option value="">Select To Status...</option>
                                                {statuses
                                                    .filter(s => s.active && s.prod_status_id !== formData.from_product_status_id)
                                                    .map((status) => (
                                                        <option key={status.prod_status_id} value={status.prod_status_id}>
                                                            {status.prod_status_id} - {status.product_status}
                                                        </option>
                                                    ))}
                                            </select>
                                            {formData.from_product_status_id && !formData.product_status_id && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                                    Select the target status for this transition
                                                </p>
                                            )}
                                        </div>

                                        {/* Requirements */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Sterilization Required <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="sterilization_required"
                                                    value={formData.sterilization_required}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                    <option value="B">Both</option>

                                                </select>
                                            </div>
                                              <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Lock Quantity Change <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="lock_qty_change"
                                                    value={formData.lock_qty_change}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Approval Required <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="approval_required"
                                                    value={formData.approval_required}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Sequence Number */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Sequence Number <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="seq_no"
                                                type="number"
                                                value={formData.seq_no}
                                                onChange={handleInputChange}
                                                placeholder="Enter sequence number (1-99)"
                                                required
                                                min={1}
                                                max={99}
                                                className="max-w-xs"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Order in which transitions should be considered</p>
                                        </div>

                                        {/* No. of Days */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    No. of Days Min
                                                </label>
                                                <Input
                                                    name="no_of_days_min"
                                                    type="number"
                                                    value={formData.no_of_days_min}
                                                    onChange={handleInputChange}
                                                    placeholder="0-99"
                                                    min={0}
                                                    max={99}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    No. of Days Max
                                                </label>
                                                <Input
                                                    name="no_of_days_max"
                                                    type="number"
                                                    value={formData.no_of_days_max}
                                                    onChange={handleInputChange}
                                                    placeholder="0-99"
                                                    min={0}
                                                    max={99}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                              <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Active
                                            </label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="active"
                                                        checked={formData.active}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                        disabled
                                                    />
                                                    <span className="text-sm">Active (default)</span>
                                                </label>
                                            </div>
                                        </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Save Transition
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Transition Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Status Transition</h2>
                                    <button
                                        onClick={() => handleCancelClick('edit')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="space-y-6">
                                        {/* From Status (Read-only) */}
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <label className="block text-sm font-semibold text-blue-800 mb-2">
                                                From Product Status
                                            </label>
                                            <div className="px-3 py-2 bg-white border border-blue-200 rounded-lg">
                                                <span className="font-mono font-semibold text-blue-600">{selectedTransition?.from_product_status_id}</span>
                                                <span className="text-muted-foreground ml-2">
                                                    {statuses.find(s => s.prod_status_id === selectedTransition?.from_product_status_id)?.product_status || ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* To Status (Read-only) */}
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <label className="block text-sm font-semibold text-green-800 mb-2">
                                                To Product Status
                                            </label>
                                            <div className="px-3 py-2 bg-white border border-green-200 rounded-lg">
                                                <span className="font-mono font-semibold text-green-600">{selectedTransition?.product_status_id}</span>
                                                <span className="text-muted-foreground ml-2">
                                                    {statuses.find(s => s.prod_status_id === selectedTransition?.product_status_id)?.product_status || ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Requirements */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Sterilization Required <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="sterilization_required"
                                                    value={formData.sterilization_required}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                    <option value="B">Both</option>
                                                </select>
                                            </div>
                                               <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Lock Quantity Change <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="lock_qty_change"
                                                    value={formData.lock_qty_change}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Approval Required <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="approval_required"
                                                    value={formData.approval_required}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                    required
                                                >
                                                    <option value="Y">Yes</option>
                                                    <option value="N">No</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Sequence Number */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Sequence Number <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="seq_no"
                                                type="number"
                                                value={formData.seq_no}
                                                onChange={handleInputChange}
                                                required
                                                min={1}
                                                max={99}
                                                className="max-w-xs"
                                            />
                                        </div>

                                        {/* No. of Days */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    No. of Days Min
                                                </label>
                                                <Input
                                                    name="no_of_days_min"
                                                    type="number"
                                                    value={formData.no_of_days_min}
                                                    onChange={handleInputChange}
                                                    placeholder="0-99"
                                                    min={0}
                                                    max={99}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    No. of Days Max
                                                </label>
                                                <Input
                                                    name="no_of_days_max"
                                                    type="number"
                                                    value={formData.no_of_days_max}
                                                    onChange={handleInputChange}
                                                    placeholder="0-99"
                                                    min={0}
                                                    max={99}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* Active Status */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="active"
                                                        checked={formData.active}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Update Transition
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transition</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete the transition from{" "}
                            <span className="font-mono font-semibold">{transitionToDelete?.from_product_status_id}</span>
                            {" → "}
                            <span className="font-mono font-semibold">{transitionToDelete?.product_status_id}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setTransitionToDelete(null); }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Deactivate Confirmation Dialog */}
            <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deactivation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to deactivate this status transition? 
                            This will make it inactive and it cannot be used for future product status changes.
                            {transitionToDeactivate && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium">Transition Details:</p>
                                    <p className="text-sm mt-1">
                                        From: <span className="font-mono">{transitionToDeactivate.from_product_status_id}</span> → 
                                        To: <span className="font-mono">{transitionToDeactivate.product_status_id}</span>
                                    </p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsDeactivateDialogOpen(false);
                            setTransitionToDeactivate(null);
                        }}>
                            No, Keep Active
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeactivate} 
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Yes, Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}