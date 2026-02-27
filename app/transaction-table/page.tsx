
'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Search, Plus, Filter, Pencil, ChevronLeft, ChevronRight, X, Play, Pause, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { productAPI, transactionAPI } from "@/services/api";

interface Transaction {
    _id?: string;
    batch_no: string;
    product_id: string;
    month_year: string;
    planned_start_date?: Date;
    planned_end_date?: Date;
    actual_start_date?: Date;
    actual_end_date?: Date;
    total_sachets?: number;
    total_sterilization_cartons?: number;
    total_shipper_cartons?: number;
    total_rejected_qty_kg?: number;
    remarks?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    current_batch_event_type_id?: string;
    current_batch_status_id: 'P' | 'R' | 'W' | 'C';
    createdAt?: string;
    updatedAt?: string;
}

interface Product {
    product_id: string;
    product_name: string;
    product_shortname: string;
    uom: string;
    product_category_id?: string;
    product_spec?: string;
    weight_per_piece?: number;
    weight_uom?: string;
    wipes_per_kg?: number;
    shelf_life_in_months?: number;
    storage_condition?: string;
    safety_stock_qty?: number;
    default_pack_size_id?: string;
    batch_prefix?: string;
    running_batch_sno?: number;
    product_image?: string;
    product_image_icon?: string;
    qc_required?: boolean;
    coa_checklist_id?: string;
    sterilization_required?: boolean;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}

const statusConfig = {
    'P': { label: 'Planned', color: 'bg-blue-50 text-blue-600', icon: Play },
    'R': { label: 'Running', color: 'bg-green-50 text-green-600', icon: Play },
    'W': { label: 'Waiting', color: 'bg-yellow-50 text-yellow-600', icon: Pause },
    'C': { label: 'Completed', color: 'bg-gray-50 text-gray-600', icon: CheckCircle },
};

function formatDateTime(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function formatMonthYear(monthYear: string): string {
    if (!monthYear || monthYear.length !== 6) return monthYear;
    const year = monthYear.substring(0, 4);
    const month = monthYear.substring(4, 6);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export default function TransactionTablePage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        batch_no: "",
        product_id: "",
        month_year: "",
        planned_start_date: "",
        planned_end_date: "",
        actual_start_date: "",
        actual_end_date: "",
        total_sachets: "",
        total_sterilization_cartons: "",
        total_shipper_cartons: "",
        total_rejected_qty_kg: "",
        remarks: "",
        current_batch_event_type_id: "NB",
        current_batch_status_id: "P" as 'P' | 'R' | 'W' | 'C',
    });
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: Transaction } | null>(null);
    const [isDuplicateBatch, setIsDuplicateBatch] = useState(false);
    const [duplicateMessage, setDuplicateMessage] = useState("");

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                batch_no: "",
                product_id: "",
                month_year: "",
                planned_start_date: "",
                planned_end_date: "",
                actual_start_date: "",
                actual_end_date: "",
                total_sachets: "",
                total_sterilization_cartons: "",
                total_shipper_cartons: "",
                total_rejected_qty_kg: "",
                remarks: "",
                current_batch_event_type_id: "NB",
                current_batch_status_id: "P",
            });
            setIsDuplicateBatch(false);
            setDuplicateMessage("");
            setSelectedProduct(null);
        }
    }, [isAddModalOpen]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await productAPI.getAll();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products", error);
            }
        };
        loadProducts();
    }, []);

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await transactionAPI.getAll();
            setTransactions(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load transactions",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const filteredTransactions = transactions.filter((item) => {
        const matchesSearch = 
            item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || item.current_batch_status_id === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, rowsPerPage]);

    // Check for duplicate batch in the SAME month only
    useEffect(() => {
        if (formData.batch_no && formData.month_year) {
            // Check if this exact batch number AND month-year combination exists
            const exists = transactions.some(t => 
                t.batch_no?.toLowerCase() === formData.batch_no.toLowerCase() && 
                t.month_year === formData.month_year &&
                // In edit mode, exclude the current transaction being edited
                (selectedTransaction ? t._id !== selectedTransaction._id : true)
            );
            
            setIsDuplicateBatch(exists);
            if (exists) {
                setDuplicateMessage(`Batch ${formData.batch_no} already exists for ${formatMonthYear(formData.month_year)}`);
            } else {
                setDuplicateMessage("");
            }
        } else {
            setIsDuplicateBatch(false);
            setDuplicateMessage("");
        }
    }, [formData.batch_no, formData.month_year, transactions, selectedTransaction]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        if (name === 'batch_no') {
            return; // Prevent manual changes
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Function to generate only current month and next two months
const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generate for current month and next 2 months (total 3 months)
    for (let i = 0; i < 3; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-based
        
        // Format: YYYYMM for value, MMM-YYYY for display (e.g., Feb-2026)
        const value = `${year}${month.toString().padStart(2, '0')}`;
        
        // Format month name
        const monthName = date.toLocaleString('default', { month: 'short' });
        const label = `${monthName}-${year}`;
        
        options.push({ value, label });
    }
    
    return options;
};

// In your form, the Month-Year dropdown remains the same:
<div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Month-Year <span className="text-red-500">*</span>
    </label>
    <select
        name="month_year"
        value={formData.month_year}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
    >
        <option value="">Select Month-Year</option>
        {generateMonthYearOptions().map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
</div>

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        const product = products.find(p => p.product_id === productId);
        setSelectedProduct(product || null);
        
        if (product && product.batch_prefix && product.running_batch_sno !== undefined) {
            const nextSno = String(product.running_batch_sno + 1).padStart(3, '0');
            const nextBatchNo = `${product.batch_prefix}${nextSno}`;
            
            setFormData(prev => ({
                ...prev,
                batch_no: nextBatchNo,
                product_id: productId,
            }));

            // Don't check for duplicate here - the useEffect will handle it
            // when both batch_no and month_year are set
        } else {
            setFormData(prev => ({
                ...prev,
                product_id: productId,
            }));
        }
    };

    const handleBatchNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        return;
    };

    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayDate = getTodayDateString();

    const getMinDateForEndDate = (startDate: string) => {
        if (!startDate) return todayDate;
        return startDate > todayDate ? startDate : todayDate;
    };

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final duplicate check before submission
    if (formData.batch_no && formData.month_year) {
        const exists = transactions.some(t => 
            t.batch_no?.toLowerCase() === formData.batch_no.toLowerCase() && 
            t.month_year === formData.month_year
        );
        
        if (exists) {
            toast({
                title: "Duplicate Batch",
                description: `Batch ${formData.batch_no} already exists for ${formatMonthYear(formData.month_year)}.`,
                variant: "destructive",
            });
            return;
        }
    }
    
    e.stopPropagation();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    try {
        // First, create the batch
        const newBatch = await transactionAPI.create({
            batch_no: formData.batch_no.toUpperCase(),
            product_id: formData.product_id.toUpperCase(),
            month_year: formData.month_year,
            planned_start_date: formData.planned_start_date ? new Date(formData.planned_start_date) : undefined,
            planned_end_date: formData.planned_end_date ? new Date(formData.planned_end_date) : undefined,
            actual_start_date: formData.actual_start_date ? new Date(formData.actual_start_date) : undefined,
            actual_end_date: formData.actual_end_date ? new Date(formData.actual_end_date) : undefined,
            total_sachets: formData.total_sachets ? parseInt(formData.total_sachets) : undefined,
            total_sterilization_cartons: formData.total_sterilization_cartons ? parseInt(formData.total_sterilization_cartons) : undefined,
            total_shipper_cartons: formData.total_shipper_cartons ? parseInt(formData.total_shipper_cartons) : undefined,
            total_rejected_qty_kg: formData.total_rejected_qty_kg ? parseFloat(formData.total_rejected_qty_kg) : undefined,
            remarks: formData.remarks,
            current_batch_event_type_id: formData.current_batch_event_type_id,
            current_batch_status_id: formData.current_batch_status_id,
            last_modified_user_id: "ADMIN",
            last_modified_date_time: new Date(),
        });
        
        // After successful batch creation, update the product's running_batch_sno
        if (selectedProduct) {
            const newSno = (selectedProduct.running_batch_sno || 0) + 1;
            
            // Use your existing productAPI.update method
            await productAPI.update(selectedProduct.product_id, {
                running_batch_sno: newSno,
                last_modified_user_id: "ADMIN"
                // last_modified_date_time will be handled by your API
            });
            
            // Update the local products state to reflect the change
            setProducts(prevProducts => 
                prevProducts.map(p => 
                    p.product_id === selectedProduct.product_id 
                        ? { ...p, running_batch_sno: newSno } 
                        : p
                )
            );
            
            // Update the selected product state
            setSelectedProduct(prev => prev ? { ...prev, running_batch_sno: newSno } : null);
            
            console.log(`✅ Updated running_batch_sno for product ${selectedProduct.product_id} from ${selectedProduct.running_batch_sno} to ${newSno}`);
        }
        
        toast({
            title: "Success",
            description: "Batch created successfully",
        });
        
        setIsAddModalOpen(false);
        loadTransactions(); // Reload transactions to show the new batch
        
    } catch (error: any) {
        console.error('❌ Error in handleSubmit:', error);
        
        // Check if the error is from batch creation or product update
        if (error.message?.includes('batch')) {
            toast({
                title: "Error",
                description: error.message || "Failed to create batch",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Partial Success",
                description: "Batch was created but failed to update product counter. Please contact support.",
            });
        }
    } finally {
        isSubmittingRef.current = false;
    }
};

    const handleEdit = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setFormData({
            batch_no: transaction.batch_no,
            product_id: transaction.product_id,
            month_year: transaction.month_year,
            planned_start_date: transaction.planned_start_date ? new Date(transaction.planned_start_date).toISOString().split('T')[0] : "",
            planned_end_date: transaction.planned_end_date ? new Date(transaction.planned_end_date).toISOString().split('T')[0] : "",
            actual_start_date: transaction.actual_start_date ? new Date(transaction.actual_start_date).toISOString().split('T')[0] : "",
            actual_end_date: transaction.actual_end_date ? new Date(transaction.actual_end_date).toISOString().split('T')[0] : "",
            total_sachets: transaction.total_sachets?.toString() || "",
            total_sterilization_cartons: transaction.total_sterilization_cartons?.toString() || "",
            total_shipper_cartons: transaction.total_shipper_cartons?.toString() || "",
            total_rejected_qty_kg: transaction.total_rejected_qty_kg?.toString() || "",
            remarks: transaction.remarks || "",
            // current_batch_event_type_id: transaction.current_batch_event_type_id || "",
            current_batch_event_type_id: "NB", 
            current_batch_status_id: transaction.current_batch_status_id,
        });
        
        // Find and set the selected product
        const product = products.find(p => p.product_id === transaction.product_id);
        setSelectedProduct(product || null);
        
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedTransaction) return;
        isSubmittingRef.current = true;
        
        // Check for duplicate when editing (excluding current transaction)
        if (formData.batch_no && formData.month_year) {
            const exists = transactions.some(t => 
                t.batch_no?.toLowerCase() === formData.batch_no.toLowerCase() && 
                t.month_year === formData.month_year &&
                t._id !== selectedTransaction._id
            );
            
            if (exists) {
                toast({
                    title: "Duplicate Batch",
                    description: `Batch ${formData.batch_no} already exists for ${formatMonthYear(formData.month_year)}.`,
                    variant: "destructive",
                });
                isSubmittingRef.current = false;
                return;
            }
        }
        
        const previousData = { ...selectedTransaction };
        
        try {
            await transactionAPI.update(selectedTransaction.batch_no, {
                product_id: formData.product_id.toUpperCase(),
                month_year: formData.month_year,
                planned_start_date: formData.planned_start_date ? new Date(formData.planned_start_date) : undefined,
                planned_end_date: formData.planned_end_date ? new Date(formData.planned_end_date) : undefined,
                actual_start_date: formData.actual_start_date ? new Date(formData.actual_start_date) : undefined,
                actual_end_date: formData.actual_end_date ? new Date(formData.actual_end_date) : undefined,
                total_sachets: formData.total_sachets ? parseInt(formData.total_sachets) : undefined,
                total_sterilization_cartons: formData.total_sterilization_cartons ? parseInt(formData.total_sterilization_cartons) : undefined,
                total_shipper_cartons: formData.total_shipper_cartons ? parseInt(formData.total_shipper_cartons) : undefined,
                total_rejected_qty_kg: formData.total_rejected_qty_kg ? parseFloat(formData.total_rejected_qty_kg) : undefined,
                remarks: formData.remarks,
                current_batch_event_type_id: formData.current_batch_event_type_id,
                current_batch_status_id: formData.current_batch_status_id,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Batch updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
            loadTransactions();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update batch",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            await transactionAPI.update(lastAction.data.batch_no, {
                product_id: lastAction.data.product_id,
                month_year: lastAction.data.month_year,
                planned_start_date: lastAction.data.planned_start_date,
                planned_end_date: lastAction.data.planned_end_date,
                actual_start_date: lastAction.data.actual_start_date,
                actual_end_date: lastAction.data.actual_end_date,
                total_sachets: lastAction.data.total_sachets,
                total_sterilization_cartons: lastAction.data.total_sterilization_cartons,
                total_shipper_cartons: lastAction.data.total_shipper_cartons,
                total_rejected_qty_kg: lastAction.data.total_rejected_qty_kg,
                remarks: lastAction.data.remarks,
                current_batch_event_type_id: lastAction.data.current_batch_event_type_id,
                current_batch_status_id: lastAction.data.current_batch_status_id,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            toast({
                title: "Undone",
                description: "Changes have been reverted",
            });
            setLastAction(null);
            loadTransactions();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleStatusChange = async (transaction: Transaction, newStatus: 'P' | 'R' | 'W' | 'C') => {
        try {
            await transactionAPI.update(transaction.batch_no, {
                current_batch_status_id: newStatus,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
                ...(newStatus === 'R' && { actual_start_date: new Date() }),
                ...(newStatus === 'C' && { actual_end_date: new Date() }),
            });
            
            toast({
                title: "Status Updated",
                description: `Batch ${transaction.batch_no} status changed to ${statusConfig[newStatus].label}`,
            });
            loadTransactions();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Batch Transaction Table</h1>
                                <p className="text-muted-foreground">Monitor and manage manufacturing batches</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Transaction
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
                                        placeholder="Search by Batch No, Product ID, or Remarks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredTransactions.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredTransactions.length)} OF {filteredTransactions.length}
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
                                                            id="status-all" 
                                                            name="statusFilter"
                                                            checked={filterStatus === "all"}
                                                            onChange={() => setFilterStatus("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="status-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {Object.entries(statusConfig).map(([key, config]) => (
                                                        <div key={key} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`status-${key}`}
                                                                name="statusFilter"
                                                                checked={filterStatus === key}
                                                                onChange={() => setFilterStatus(key)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`status-${key}`} className="text-sm font-normal cursor-pointer text-foreground">
                                                                {config.label}
                                                            </Label>
                                                        </div>
                                                    ))}
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
                                                    setFilterStatus("all");
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
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Batch No
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Product ID
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Month-Year
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned Start Date
                                            </th>
                                               <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned End Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual Start Date
                                            </th>
                                             <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual End Date
                                            </th>
                                              <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Total No Of Sachets
                                            </th>
                                             <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Total No Of Sterilization Cartons
                                            </th>
                                               <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Total No Of Shipper Cartons
                                            </th>
                                            
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Total Rejected Qty (KG)
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Remarks
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Last modified  user id
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Last Modified Date & Time
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Current Batch Event Type Id
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                Current Batch Status Id
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading batches...
                                                </td>
                                            </tr>
                                        ) : filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    No batches found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedTransactions.map((item, index) => {
                                                const StatusIcon = statusConfig[item.current_batch_status_id].icon;
                                                
                                                return (
                                                    <motion.tr
                                                        key={item._id || item.batch_no}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                    >
                                                        <td className="px-6 py-4 align-middle">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                {item.batch_no}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 align-middle">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs">
                                                                {item.product_id}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-foreground align-middle">
                                                            {formatMonthYear(item.month_year)}
                                                        </td>
                                                        <td className="px-6 py-4 align-middle">
                                                            <div className="text-xs">
                                                                <div>{formatDateTime(item.planned_start_date)}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-middle">
                                                            <div className="text-xs">
                                                                <div>{formatDateTime(item.planned_end_date)}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-middle">
                                                            <div className="text-xs">
                                                                <div>{formatDateTime(item.actual_start_date)}</div>
                                                            </div>
                                                        </td>
                                                          <td className="px-6 py-4 align-middle">
                                                            <div className="text-xs">
                                                                <div>{formatDateTime(item.actual_end_date)}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.total_sachets}                                               
                                                            </div>
                                                        </td>
                                                          <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.total_sterilization_cartons}                                               
                                                            </div>
                                                        </td>
                                                             <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.total_shipper_cartons}                                               
                                                            </div>
                                                        </td>
                                                                 <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.total_rejected_qty_kg}                                               
                                                            </div>
                                                        </td>
                                                                   <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.remarks}                                               
                                                            </div>
                                                        </td>
                                                                        <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.last_modified_user_id}                                               
                                                            </div>
                                                        </td>
                                                                            <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.last_modified_date_time ? formatDateTime(item.last_modified_date_time) : "N/A"}                                               
                                                            </div>
                                                        </td>
                                                                         <td className="px-6 py-4 align-middle">
                                                            <div className="inline-flex px-2 py-1 font-mono text-xs">
                                                             {item.current_batch_event_type_id}                                               
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 align-middle">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig[item.current_batch_status_id].color}`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {statusConfig[item.current_batch_status_id].label}
                                                            </span>
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
                            Real-time Data Sync • ACUMED Manufacturing Cloud v4.2
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* Add Batch Modal */}
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
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Create New Transaction</h2>
                    <button
                        onClick={() => setIsAddModalOpen(false)}
                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Product Details */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Product <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="product_name"
                                value={formData.product_id}
                                onChange={handleProductChange}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select a product</option>
                                {products.map((product) => (
                                    <option key={product.product_id} value={product.product_id}>
                                        {product.product_name} ({product.product_id})
                                    </option>
                                ))}
                            </select>
                        </div>


                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Batch No. <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="batch_no"
                                value={formData.batch_no}
                                onChange={handleBatchNoChange}
                                readOnly
                                disabled
                                placeholder="Auto-generated from product"
                                className={`w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-sm ${!formData.batch_no ? 'text-gray-400' : 'text-gray-700'}`}
                            />
                            {isDuplicateBatch && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <X className="w-3 h-3" /> {duplicateMessage}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Month-Year and Status */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Month-Year <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="month_year"
                                value={formData.month_year}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select Month-Year</option>
                                {generateMonthYearOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Current batch event type id
                            </label>
                            <input
                                name="current_batch_event_type_id"
                                value="NB"
                                readOnly
                                disabled
                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Current batch status id <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="current_batch_status_id"
                                value="P"
                                readOnly
                                disabled
                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Planned Section */}
                    <div className="mb-8">
                        <h3 className="text-md font-semibold text-foreground mb-3 pb-1 border-b border-border">Planned</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Planned Start Date
                                </label>
                                <input
                                    type="date"
                                    name="planned_start_date"
                                    value={formData.planned_start_date}
                                    onChange={handleInputChange}
                                    min={todayDate}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Planned End Date
                                </label>
                                <input
                                    type="date"
                                    name="planned_end_date"
                                    value={formData.planned_end_date}
                                    onChange={handleInputChange}
                                    min={getMinDateForEndDate(formData.planned_start_date)}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actuals Section - All Display Only */}
                    <div className="mb-8">
                        <h3 className="text-md font-semibold text-foreground mb-3 pb-1 border-b border-border">
                            Actuals <span className="text-sm font-normal text-gray-400 ml-2">(Display only)</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Actual Start Date
                                </label>
                                <input
                                    type="date"
                                    name="actual_start_date"
                                    value={formData.actual_start_date}
                                    readOnly
                                    className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-600 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Actual End Date
                                </label>
                                <input
                                    type="date"
                                    name="actual_end_date"
                                    value={formData.actual_end_date}
                                    readOnly
                                    className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-600 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Total no. of sachets
                                </label>
                                <input
                                    type="number"
                                    name="total_sachets_display"
                                    value={formData.total_sachets || ''}
                                    readOnly
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-600 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Total no. of sterilization cartons
                                </label>
                                <input
                                    type="number"
                                    name="total_sterilization_cartons_display"
                                    value={formData.total_sterilization_cartons || ''}
                                    readOnly
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-600 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Total no. of shipper cartons
                                </label>
                                <input
                                    type="number"
                                    name="total_shipper_cartons_display"
                                    value={formData.total_shipper_cartons || ''}
                                    readOnly
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-600 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Total rejected qty in KGs
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="total_rejected_qty_kg_display"
                                    value={formData.total_rejected_qty_kg || ''}
                                    readOnly
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-600 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Remarks
                        </label>
                        <input
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleInputChange}
                            placeholder="Accept Remarks"
                            maxLength={100}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmittingRef.current || isDuplicateBatch}
                        >
                            {isSubmittingRef.current ? 'Creating...' : 'Create Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    </>
)}
            </AnimatePresence>

            {/* Edit Batch Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Batch</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch No <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="batch_no"
                                                value={formData.batch_no}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="product_id"
                                                value={formData.product_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select a product</option>
                                                {products.map((product) => (
                                                    <option key={product.product_id} value={product.product_id}>
                                                        {product.product_name} ({product.product_id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Month-Year <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="month_year"
                                                value={formData.month_year}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select Month-Year</option>
                                                {generateMonthYearOptions().map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {isDuplicateBatch && (
                                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                                    <X className="w-3 h-3" /> {duplicateMessage}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="planned_start_date"
                                                value={formData.planned_start_date}
                                                onChange={handleInputChange}
                                                min={todayDate}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned End Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="planned_end_date"
                                                value={formData.planned_end_date}
                                                onChange={handleInputChange}
                                                min={getMinDateForEndDate(formData.planned_start_date)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="actual_start_date"
                                                value={formData.actual_start_date}
                                                onChange={handleInputChange}
                                                min={todayDate}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual End Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="actual_end_date"
                                                value={formData.actual_end_date}
                                                onChange={handleInputChange}
                                                min={getMinDateForEndDate(formData.actual_start_date)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Total Sachets
                                            </label>
                                            <Input
                                                type="number"
                                                name="total_sachets"
                                                value={formData.total_sachets}
                                                onChange={handleInputChange}
                                                max={99999999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Sterilization Cartons
                                            </label>
                                            <Input
                                                type="number"
                                                name="total_sterilization_cartons"
                                                value={formData.total_sterilization_cartons}
                                                onChange={handleInputChange}
                                                max={99999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Shipper Cartons
                                            </label>
                                            <Input
                                                type="number"
                                                name="total_shipper_cartons"
                                                value={formData.total_shipper_cartons}
                                                onChange={handleInputChange}
                                                max={99999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Rejected Qty (KG)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                name="total_rejected_qty_kg"
                                                value={formData.total_rejected_qty_kg}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Event Type ID
                                            </label>
                                            <Input
                                                name="current_batch_event_type_id"
                                                value={formData.current_batch_event_type_id}
                                                onChange={handleInputChange}
                                                maxLength={2}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="current_batch_status_id"
                                                value={formData.current_batch_status_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="P">Planned</option>
                                                <option value="R">Running</option>
                                                <option value="W">Waiting</option>
                                                <option value="C">Completed</option>
                                            </select>
                                        </div>

                                        <div className="col-span-3">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <Input
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                maxLength={100}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button 
                                            type="submit" 
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6" 
                                            disabled={isSubmittingRef.current || isDuplicateBatch}
                                        >
                                            Update Batch
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