'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { productStatusAPI } from "@/services/api";
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
    prod_status_id: string; // Char(3) - PK
    product_status: string; // Char(30)
    stock_movement?: string; // Char(3) - dropdown (IN / OUT) - can be empty
    effect_in_stock?: string; // Char(1) - dropdown (+ / -) - can be empty
    seq_no: number; // N(2)
    active: boolean;
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date; // Date
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

export default function ProductStatusMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [statusToCancel, setStatusToCancel] = useState<ProductStatus | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<ProductStatus | null>(null);
    const [cancelledStatuses, setCancelledStatuses] = useState<Set<string>>(new Set());
    const [filterActive, setFilterActive] = useState<string>("all");
    const [filterStockMovement, setFilterStockMovement] = useState<string>("all");
    const isSubmittingRef = useRef(false);
    const [statuses, setStatuses] = useState<ProductStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: ProductStatus } | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        loadStatuses();
    }, []);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                prod_status_id: "",
                product_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const loadStatuses = async () => {
        try {
            setLoading(true);
            const data = await productStatusAPI.getAll();
            setStatuses(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load product statuses",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    const [formData, setFormData] = useState({
        prod_status_id: "",
        product_status: "",
        stock_movement: "",
        effect_in_stock: "",
        seq_no: "",
        active: true,
    });

    const filteredStatuses = statuses.filter((status) => {
        const matchesSearch = status.prod_status_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            status.product_status.toLowerCase().includes(searchQuery.toLowerCase());
        
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
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
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
            await productStatusAPI.create({
                prod_status_id: formData.prod_status_id,
                product_status: formData.product_status,
                stock_movement: formData.stock_movement || '',
                effect_in_stock: formData.effect_in_stock || '',
                seq_no: parseInt(formData.seq_no) || 0,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Product status created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                prod_status_id: "",
                product_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
            });
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create product status",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (status: ProductStatus) => {
        setSelectedStatus(status);
        setFormData({
            prod_status_id: status.prod_status_id,
            product_status: status.product_status,
            stock_movement: status.stock_movement || "",
            effect_in_stock: status.effect_in_stock || "",
            seq_no: status.seq_no.toString(),
            active: status.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedStatus) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedStatus };
        
        try {
            await productStatusAPI.update(selectedStatus.prod_status_id, {
                product_status: formData.product_status,
                stock_movement: formData.stock_movement || '',
                effect_in_stock: formData.effect_in_stock || '',
                seq_no: parseInt(formData.seq_no) || 0,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Product status updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({
                prod_status_id: "",
                product_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
            });
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update product status",
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
                await productStatusAPI.update(lastAction.data.prod_status_id, {
                    product_status: lastAction.data.product_status,
                    stock_movement: lastAction.data.stock_movement || '',
                    effect_in_stock: lastAction.data.effect_in_stock || '',
                    seq_no: lastAction.data.seq_no,
                    active: lastAction.data.active,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            } else if (lastAction.type === 'delete') {
                // Restore deleted status
                await productStatusAPI.create({
                    prod_status_id: lastAction.data.prod_status_id,
                    product_status: lastAction.data.product_status,
                    stock_movement: lastAction.data.stock_movement || '',
                    effect_in_stock: lastAction.data.effect_in_stock || '',
                    seq_no: lastAction.data.seq_no,
                    active: lastAction.data.active,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Product status has been restored",
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

    const handleCancel = (status: ProductStatus) => {
        setStatusToCancel(status);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = () => {
        if (!statusToCancel) return;
        
        const isCancelled = cancelledStatuses.has(statusToCancel.prod_status_id);
        setCancelledStatuses(prev => {
            const newSet = new Set(prev);
            if (isCancelled) {
                newSet.delete(statusToCancel.prod_status_id);
                toast({
                    title: "Restored",
                    description: `Product status ${statusToCancel.product_status} has been restored`,
                });
            } else {
                newSet.add(statusToCancel.prod_status_id);
                toast({
                    title: "Cancelled",
                    description: `Product status ${statusToCancel.product_status} has been cancelled`,
                });
            }
            return newSet;
        });
        setIsCancelItemDialogOpen(false);
        setStatusToCancel(null);
    };

    const handleCancelClick = (modalType: 'add' | 'edit') => {
        setCancelModalType(modalType);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (cancelModalType === 'add') {
            setIsAddModalOpen(false);
            setFormData({ prod_status_id: "", product_status: "", stock_movement: "", effect_in_stock: "", seq_no: 0, active: true });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({ prod_status_id: "", product_status: "", stock_movement: "", effect_in_stock: "", seq_no: 0, active: true });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product Status Master</h1>
                                <p className="text-muted-foreground">Define and manage various statuses for manufactured products</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Product Status
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
                                        placeholder="Search by Status ID or Product Status..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
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
                                                            id="ps-active-all" 
                                                            name="psActiveStatus"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ps-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ps-active-true" 
                                                            name="psActiveStatus"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ps-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ps-active-false" 
                                                            name="psActiveStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ps-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
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
                                                                id="ps-movement-all" 
                                                                name="psMovementFilter"
                                                                checked={filterStockMovement === "all"}
                                                                onChange={() => setFilterStockMovement("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="ps-movement-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueStockMovements.map((movement) => (
                                                            <div key={movement} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`ps-movement-${movement}`} 
                                                                    name="psMovementFilter"
                                                                    checked={filterStockMovement === movement}
                                                                    onChange={() => setFilterStockMovement(movement)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`ps-movement-${movement}`} className="text-sm font-normal cursor-pointer text-foreground">{movement}</Label>
                                                            </div>
                                                        ))}
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">PROD STATUS ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[200px]">PRODUCT STATUS</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">STOCK MOVEMENT</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">EFFECT IN STOCK</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">SEQ NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">LAST MODIFIED USER ID / NAME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">LAST MODIFIED DATE & TIME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">ACTIVE</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading product statuses...
                                                </td>
                                            </tr>
                                        ) : filteredStatuses.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-4 text-center text-muted-foreground">
                                                    No product statuses found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedStatuses.map((status, index) => {
                                                const isCancelled = cancelledStatuses.has(status.prod_status_id);
                                                return (
                                                <motion.tr
                                                    key={status.prod_status_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground font-mono">{status.prod_status_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.product_status}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.stock_movement || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-semibold">{status.effect_in_stock || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.seq_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {status.last_modified_user_id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-mono text-foreground">{status.last_modified_user_id}</span>
                                                                <span className="text-xs text-muted-foreground">{status.last_modified_user_id}</span>
                                                            </div>
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
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            status.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {status.active ? "TRUE" : "FALSE"}
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
                                                                handleCancel(status);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore status" : "Cancel status"}
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
                </div>
            </main>

            {/* Add Status Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Product Status</h2>
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
                                                Prod Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="prod_status_id"
                                                value={formData.prod_status_id}
                                                onChange={handleInputChange}
                                                placeholder="e.g., MFD, IQC"
                                                required
                                                maxLength={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Status <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_status"
                                                value={formData.product_status}
                                                onChange={handleInputChange}
                                                placeholder="Enter product status"
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
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
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
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                <option value="+">+</option>
                                                <option value="-">-</option>
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
                                                placeholder="Enter sequence number"
                                                required
                                                min={1}
                                                max={99}
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
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCancelClick('add')}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Save Status
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Status Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Product Status</h2>
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
                                                Prod Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="prod_status_id"
                                                value={formData.prod_status_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Status <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_status"
                                                value={formData.product_status}
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
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
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
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                <option value="+">+</option>
                                                <option value="-">-</option>
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
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCancelClick('edit')}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Update Status
                                        </Button>
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

            {/* Cancel Item Confirmation Dialog (for table actions) */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {statusToCancel && cancelledStatuses.has(statusToCancel.prod_status_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {statusToCancel && cancelledStatuses.has(statusToCancel.prod_status_id)
                                ? `Are you sure you want to restore product status "${statusToCancel.product_status}"?`
                                : `Are you sure you want to cancel product status "${statusToCancel?.product_status}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setStatusToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={statusToCancel && cancelledStatuses.has(statusToCancel.prod_status_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {statusToCancel && cancelledStatuses.has(statusToCancel.prod_status_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
