'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Search, Plus, Filter, Pencil, ChevronLeft, ChevronRight, X, CheckCircle, XCircle, ChevronDown, ChevronUp, LayoutList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { cartonCapacityAPI, packingAPI, packSizeAPI, productionPlanDetailAPI, productMovementAPI, productStatusAPI, productStatusTransitionAPI, productStockAPI, transactionAPI } from "@/services/api";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Packing {
    _id?: string;
    packing_id: number;
    packing_date: string | Date;
    batch_no: string;
    product_id: string;
    packsize_id: string;
    no_of_packs: number;
    no_of_sachets: number;
    total_machine_time_in_min: number;
    remarks: string;
    entered_by_user_id: string;
    entered_date_time: string | Date;
    approval_remarks: string;
    approved_by_user_id: string;
    approved_date_time: string | Date;
    status: string; // 'P' for Pending, 'A' for Approved, 'X' for Rejected
    createdAt?: string;
    updatedAt?: string;
}
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
    actual_total_sachets?: number;
    actual_total_sterilization_cartons?: number;
    actual_total_shipper_cartons?: number;
    total_rejected_qty_kg?: number;
    remarks?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    current_batch_event_type_id?: string;
    current_batch_status_id: 'P' | 'X' | 'W' | 'C';
    createdAt?: string;
    updatedAt?: string;
}
interface ProductDetail {
    last_modified_date_time: any;
    last_modified_user_id: string;
    no_of_shipper_cartons: number;
    no_of_sterilization_cartons: number;
    sno?: number;
    packsize_id: string;
    no_of_packs: number;
    remarks: string;
    no_of_sachets: number;
    packs_per_steri_carton: number;
    sterilization_cartons: number;
    packs_per_shipper_carton: number;
    shipper_cartons: number;
    product_id?: string;
    batch_no?: string;
}
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
function formatDateTime(date: string | Date): string {
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

// Helper function to get status badge
function getStatusBadge(status: string) {
    switch(status) {
        case 'A':
            return { label: 'Approved', className: 'bg-green-50 text-green-600' };
        case 'X':
            return { label: 'Rejected', className: 'bg-red-50 text-red-600' };
        case 'E':
        default:
            return { label: 'Pending', className: 'bg-yellow-50 text-yellow-600' };
    }
}

export default function PackingMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPacking, setSelectedPacking] = useState<Packing | null>(null);
    const [packings, setPackings] = useState<Packing[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [formData, setFormData] = useState({
        // packing_id: "",
        packing_date: new Date().toISOString().split('T')[0],
        batch_no: "",
        product_id: "",
        packsize_id: "",
        no_of_packs: "",
        no_of_sachets: "",
        total_machine_time_in_min: "",
        remarks: "",
        entered_by_user_id: "ADMIN",
        approval_remarks: "",
        status: "E",
    });
    const [approvalData, setApprovalData] = useState({
        approval_remarks: "",
        status: "A",
    });
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'approve' | 'reject'; data: Packing } | null>(null);
    const [isDuplicateId, setIsDuplicateId] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [batchDetails, setBatchDetails] = useState<Map<string, ProductDetail[]>>(new Map());
    const [packSizes, setPackSizes] = useState<PackSize[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [stockCache, setStockCache] = useState<Record<string, any>>({});
    
     const today = new Date().toISOString().split('T')[0];
     
        useEffect(() => {
             const loadPackSizes = async () => {
                 try {
                     const data = await transactionAPI.getAll();
                     setTransactions(data);
                 } catch (error) {
                     console.error("Failed to load transaction records", error);
                 }
             };
             loadPackSizes();
         }, []);
        // Fix the useEffect for batchDetails
useEffect(() => {
    const loadPackSizes = async () => {
        try {
            const data = await productionPlanDetailAPI.getAll();
            // Convert array to Map keyed by batch_no
            const detailsMap = new Map();
            data.forEach((item: ProductDetail) => {
                if (item.batch_no) {
                    if (!detailsMap.has(item.batch_no)) {
                        detailsMap.set(item.batch_no, []);
                    }
                    detailsMap.get(item.batch_no).push(item);
                }
            });
            setBatchDetails(detailsMap);
        } catch (error) {
            console.error("Failed to load production plan details", error);
        }
    };
    loadPackSizes();
}, []);
useEffect(() => {
    const loadProducts = async () => {
        try {
            const data = await packSizeAPI.getAll();
            setPackSizes(data);
        } catch (error) {
            console.error("Failed to load pack sizes", error);
        }
    };
    loadProducts();
}, []);
    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                // packing_id: "",
                packing_date: new Date().toISOString().split('T')[0],
                batch_no: "",
                product_id: "",
                packsize_id: "",
                no_of_packs: "",
                no_of_sachets: "",
                total_machine_time_in_min: "",
                remarks: "",
                entered_by_user_id: "ADMIN",
                approval_remarks: "",
                status: "E",
            });
        }
    }, [isAddModalOpen]);

    const loadPackings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await packingAPI.getAll();
            setPackings(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load Packing records",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadPackings();
    }, [loadPackings]);
// Function to calculate sachets based on packs and packsize
const calculateSachets = (packSizeId: string, noOfPacks: number): number => {
    if (!packSizeId || !noOfPacks) return 0;
    
    const packSize = packSizes.find(ps => ps.pack_size_id === packSizeId);
    if (!packSize) return 0;
    
    return noOfPacks * packSize.qty_per_carton;
};
    const toggleExpandRow = async (item: Packing) => {
        const key = item.batch_no;
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(key)) { next.delete(key); } else { next.add(key); }
            return next;
        });
        if (!stockCache[key]) {
            try {
                const stock = await productStockAPI.getByBatchNo(item.batch_no);
                setStockCache(prev => ({ ...prev, [key]: stock }));
            } catch {
                setStockCache(prev => ({ ...prev, [key]: null }));
            }
        }
    };

    const filteredPackings = packings.filter((item) => {
        const matchesSearch = 
            item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.packsize_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.packing_id?.toString().includes(searchQuery);
        
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredPackings.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedPackings = filteredPackings.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, rowsPerPage]);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }

    let processedValue = value;
    if (['batch_no', 'product_id', 'packsize_id'].includes(name)) {
        processedValue = value.toUpperCase();
    }

    setFormData(prev => {
        const newData = { ...prev, [name]: processedValue };
        
        // Auto-calculate sachets when packsize_id or no_of_packs changes
        if (name === 'packsize_id' || name === 'no_of_packs') {
            const packSizeId = name === 'packsize_id' ? processedValue : prev.packsize_id;
            const noOfPacks = name === 'no_of_packs' ? parseInt(processedValue) || 0 : parseInt(prev.no_of_packs) || 0;
            
            if (packSizeId && noOfPacks > 0) {
                const sachets = calculateSachets(packSizeId, noOfPacks);
                newData.no_of_sachets = sachets.toString();
            } else {
                newData.no_of_sachets = '';
            }
        }
        
        return newData;
    });
};
// 1. Filter the transactions to get only those with status 'W'
const activeBatches = transactions.filter(
    (t) => t.current_batch_status_id === 'W'
);


const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBatchNo = e.target.value;
    const selectedBatchData = activeBatches.find(b => b.batch_no === selectedBatchNo);

    const batchPackDetails = batchDetails.get(selectedBatchNo);
    
    let packsizeId = '';
    if (batchPackDetails && batchPackDetails.length > 0) {
        packsizeId = batchPackDetails[0].packsize_id;
        
        if (batchPackDetails.length > 1) {
            toast({
                title: "Multiple Pack Sizes",
                description: `This batch has ${batchPackDetails.length} pack sizes. Please verify.`,
                duration: 3000,
            });
        }
    }

    setFormData(prev => {
        const newData = {
            ...prev,
            batch_no: selectedBatchNo,
            product_id: selectedBatchData ? selectedBatchData.product_id : '',
            packsize_id: packsizeId
        };
        
        // Calculate sachets if we have both packsize_id and no_of_packs
        if (packsizeId && parseInt(prev.no_of_packs) > 0) {
            const sachets = calculateSachets(packsizeId, parseInt(prev.no_of_packs) || 0);
            newData.no_of_sachets = sachets.toString();
        }
        
        return newData;
    });
};
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isDuplicateId) {
            toast({
                title: "ID Conflict",
                description: "Please enter a unique Packing ID before submitting.",
                variant: "destructive",
            });
            return;
        }
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        
        try {
            await packingAPI.create({
                // packing_id: parseInt(formData.packing_id),
                packing_date: new Date(formData.packing_date),
                batch_no: formData.batch_no,
                product_id: formData.product_id,
                packsize_id: formData.packsize_id,
                no_of_packs: parseInt(formData.no_of_packs) || 0,
                no_of_sachets: parseInt(formData.no_of_sachets) || 0,
                total_machine_time_in_min: parseInt(formData.total_machine_time_in_min) || 0,
                remarks: formData.remarks,
                entered_by_user_id: formData.entered_by_user_id,
                entered_date_time: new Date(),
                approval_remarks: "",
                status: "E",
            });
            
            toast({
                title: "Success",
                description: "Packing record created successfully",
            });
            setIsAddModalOpen(false);
            loadPackings();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create Packing record",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (packing: Packing) => {
        if (packing.status !== 'E') {
            toast({
                title: "Cannot Edit",
                description: "Only pending records can be edited",
                variant: "destructive",
            });
            return;
        }
        
        setSelectedPacking(packing);
        setFormData({
            // packing_id: packing.packing_id.toString(),
            packing_date: new Date(packing.packing_date).toISOString().split('T')[0],
            batch_no: packing.batch_no,
            product_id: packing.product_id,
            packsize_id: packing.packsize_id,
            no_of_packs: packing.no_of_packs.toString(),
            no_of_sachets: packing.no_of_sachets.toString(),
            total_machine_time_in_min: packing.total_machine_time_in_min.toString(),
            remarks: packing.remarks || "",
            entered_by_user_id: packing.entered_by_user_id,
            approval_remarks: packing.approval_remarks || "",
            status: packing.status,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedPacking) return;
        isSubmittingRef.current = true;
        
        const previousData = { ...selectedPacking };
        
        try {
         await packingAPI.update(selectedPacking.packing_id.toString(), {
    packing_date: new Date(formData.packing_date),
    batch_no: formData.batch_no,
    product_id: formData.product_id,
    packsize_id: formData.packsize_id,
    no_of_packs: parseInt(formData.no_of_packs) || 0,
    no_of_sachets: parseInt(formData.no_of_sachets) || 0,
    total_machine_time_in_min: parseInt(formData.total_machine_time_in_min) || 0,
    remarks: formData.remarks,
});
            
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Packing record updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedPacking(null);
            loadPackings();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update Packing record",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleApproval = (packing: Packing) => {
        if (packing.status !== 'E') {
            toast({
                title: "Already Processed",
                description: "This record has already been approved or rejected",
                variant: "destructive",
            });
            return;
        }
        
        setSelectedPacking(packing);
        setApprovalData({
            approval_remarks: "",
            status: "A",
        });
        setIsApprovalModalOpen(true);
    };

const generateMovementId = async (): Promise<number> => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    
    // Get all movements for current year
    const movements = await productMovementAPI.getAll({ year: currentYear.toString() });
    
    let maxSeq = 0;
    movements.forEach((m: any) => {
        const idStr = m.prod_movement_id.toString();
        if (idStr.length >= 7) {
            const seq = parseInt(idStr.slice(-5));
            if (seq > maxSeq) maxSeq = seq;
        }
    });
    
    const nextSeq = maxSeq + 1;
    return parseInt(`${yearSuffix}${nextSeq.toString().padStart(5, '0')}`);
};
const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmittingRef.current) return;
    if (!selectedPacking) return;
    
    // Validate remarks
    if (!approvalData.approval_remarks.trim()) {
        toast({
            title: "Validation Error",
            description: "Please enter approval remarks",
            variant: "destructive",
        });
        return;
    }
    
    isSubmittingRef.current = true;
    
    const previousData = { ...selectedPacking };
    const newStatus = approvalData.status;
    
    // Declare movementId outside the if block
    let movementId: number | null = null;
    
    try {
        // Only process if approving (status 'A')
        if (newStatus === 'A') {
            // Step 1: Get product status with movement_type = 'I'
            console.log('Fetching product status with movement_type = I...');
            const productStatusList = await productStatusAPI.getByMovementType('I');
            
            if (!productStatusList || productStatusList.length === 0) {
                throw new Error('No product status found with movement type I');
            }
            
            const fromProductStatus = productStatusList[0];
            console.log('Found product status:', fromProductStatus);
            
            // Step 2: Get transition where from_product_status_id matches
            console.log('Fetching transitions for from status:', fromProductStatus.prod_status_id);
            const transitions = await productStatusTransitionAPI.getByFromStatus(fromProductStatus.prod_status_id);
            
            if (!transitions || transitions.length === 0) {
                throw new Error('No transition found for the product status');
            }
            
            const transition = transitions[0];
            console.log('Found transition:', transition);
            
            // Step 3: Get pack size details for qty_per_carton
            console.log('Fetching pack size details for:', selectedPacking.packsize_id);
            const packSizes = await packSizeAPI.getAll();
            const packSize = packSizes.find((ps: any) => ps.pack_size_id === selectedPacking.packsize_id);
            
            if (!packSize) {
                throw new Error('Pack size not found');
            }
            
            // Step 4: Get carton capacity ID
            console.log('Fetching carton capacity for product:', selectedPacking.product_id, 
                       'pack size:', selectedPacking.packsize_id, 
                       'carton type:', fromProductStatus.carton_type_id);
            
            const cartonCapacities = await cartonCapacityAPI.getAll({
                productId: selectedPacking.product_id,
                packSizeId: selectedPacking.packsize_id,
                cartonTypeId: fromProductStatus.carton_type_id,
                active: true
            });
            
            const cartonCapacity = cartonCapacities.length > 0 ? cartonCapacities[0] : null;
            
            // Step 5: Calculate no_of_sachets
            const noOfSachets = selectedPacking.no_of_packs * (packSize.qty_per_carton || 0);
            
            // Step 6: Generate movement ID
            console.log('Generating movement ID...');
            movementId = await generateMovementId();
            console.log('Generated movement ID:', movementId);
            
            // Step 7: Create product movement record
            console.log('Creating product movement record...');
            const movementData = {
                prod_movement_id: movementId,
                movement_date: selectedPacking.packing_date,
                batch_no: selectedPacking.batch_no,
                product_id: selectedPacking.product_id,
                pack_size_id: selectedPacking.packsize_id,
                to_prod_status_id: transition.product_status_id,
                from_prod_status_id: fromProductStatus.prod_status_id,
                carton_type_id: fromProductStatus.carton_type_id || '',
                carton_capacity_id: cartonCapacity?.carton_capacity_id || '',
                no_of_cartons: selectedPacking.no_of_packs,
                no_of_packs: selectedPacking.no_of_packs,
                no_of_sachets: noOfSachets,
                remarks: selectedPacking.remarks || '',
                entered_by_user_id: selectedPacking.entered_by_user_id,
                entered_date_time: selectedPacking.entered_date_time,
                approval_remarks: approvalData.approval_remarks,
                approved_by_user_id: "ADMIN",
                approved_date_time: new Date(),
                status: 'A', // Approved
            };
            
            console.log('Movement data:', movementData);
            await productMovementAPI.create(movementData);
            console.log('Product movement created successfully');
            
            // Step 8: Check if stock exists for this batch
            console.log('Checking existing stock for batch:', selectedPacking.batch_no);
            const existingStock = await productStockAPI.getByBatchNo(selectedPacking.batch_no);
            console.log('Existing stock:', existingStock ? 'found' : 'not found');
            
            // Step 9: Prepare stock data
            let stockData;
            if (existingStock) {
                // UPDATE case
                stockData = {
                    batch_no: selectedPacking.batch_no,
                    product_id: selectedPacking.product_id,
                    pack_size_id: selectedPacking.packsize_id,
                    product_status_id: transition.product_status_id,
                    total_no_of_packs: existingStock.total_no_of_packs + selectedPacking.no_of_packs,
                    total_no_of_sachets: existingStock.total_no_of_sachets + noOfSachets,
                    carton_type_id: fromProductStatus.carton_type_id || existingStock.carton_type_id,
                    total_no_of_cartons: existingStock.total_no_of_cartons + selectedPacking.no_of_packs,
                    last_modified_user_id: "ADMIN",
                    last_modified_date_time: new Date(),
                };
            } else {
                // CREATE case
                stockData = {
                    batch_no: selectedPacking.batch_no,
                    product_id: selectedPacking.product_id,
                    pack_size_id: selectedPacking.packsize_id,
                    product_status_id: transition.product_status_id,
                    total_no_of_packs: selectedPacking.no_of_packs,
                    total_no_of_sachets: noOfSachets,
                    carton_type_id: fromProductStatus.carton_type_id || '',
                    total_no_of_cartons: selectedPacking.no_of_packs,
                    last_modified_user_id: "ADMIN",
                    last_modified_date_time: new Date(),
                };
            }
            
            // Step 10: Create or update stock
            if (existingStock) {
                console.log('Updating existing stock for batch:', selectedPacking.batch_no);
                await productStockAPI.update(selectedPacking.batch_no, stockData);
                console.log('Stock updated successfully');
                toast({
                    title: "Stock Updated",
                    description: `Added ${selectedPacking.no_of_packs} packs to existing stock. New total: ${stockData.total_no_of_packs}`,
                });
            } else {
                console.log('Creating new stock record for batch:', selectedPacking.batch_no);
                await productStockAPI.create(stockData);
                console.log('New stock created successfully');
                toast({
                    title: "Stock Created",
                    description: `New stock record created with ${selectedPacking.no_of_packs} packs`,
                });
            }
            
            toast({
                title: "Movement Created",
                description: `Product movement ID: ${movementId} created successfully`,
            });
        }
        
        // Step 11: Update packing record status
        console.log('Updating packing record status to:', newStatus);
        await packingAPI.update(selectedPacking.packing_id.toString(), {
            packing_date: selectedPacking.packing_date,
            batch_no: selectedPacking.batch_no,
            product_id: selectedPacking.product_id,
            packsize_id: selectedPacking.packsize_id,
            no_of_packs: selectedPacking.no_of_packs,
            no_of_sachets: selectedPacking.no_of_sachets,
            total_machine_time_in_min: selectedPacking.total_machine_time_in_min,
            remarks: selectedPacking.remarks,
            entered_by_user_id: selectedPacking.entered_by_user_id,
            entered_date_time: selectedPacking.entered_date_time,
            approval_remarks: approvalData.approval_remarks,
            status: newStatus,
            approved_by_user_id: "ADMIN",
            approved_date_time: new Date(),
        });
        
        setLastAction({ type: newStatus === 'A' ? 'approve' : 'reject', data: previousData });
        
        // Success toast with movement ID if available
        toast({
            title: "Success",
            description: movementId 
                ? `Packing record approved successfully. Movement ID: ${movementId}`
                : `Packing record ${newStatus === 'A' ? 'approved' : 'rejected'} successfully`,
            action: (
                <ToastAction altText="Undo" onClick={handleUndo}>
                    Undo
                </ToastAction>
            ),
        });
        
        // Close modal and reset
        setIsApprovalModalOpen(false);
        setSelectedPacking(null);
        setApprovalData({
            approval_remarks: "",
            status: "A",
        });
        
        // Reload data
        loadPackings();
        
    } catch (error: any) {
        console.error('Approval failed:', error);
        toast({
            title: "Error",
            description: error.message || "Failed to process approval",
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
            await packingAPI.update(lastAction.data.packing_id.toString(), {
                packing_date: new Date(lastAction.data.packing_date),
                batch_no: lastAction.data.batch_no,
                product_id: lastAction.data.product_id,
                packsize_id: lastAction.data.packsize_id,
                no_of_packs: lastAction.data.no_of_packs,
                no_of_sachets: lastAction.data.no_of_sachets,
                total_machine_time_in_min: lastAction.data.total_machine_time_in_min,
                remarks: lastAction.data.remarks,
            });
        } else {
            // For approve/reject actions, restore the previous state
            await packingAPI.update(lastAction.data.packing_id.toString(), {
                packing_date: lastAction.data.packing_date,
                batch_no: lastAction.data.batch_no,
                product_id: lastAction.data.product_id,
                packsize_id: lastAction.data.packsize_id,
                no_of_packs: lastAction.data.no_of_packs,
                no_of_sachets: lastAction.data.no_of_sachets,
                total_machine_time_in_min: lastAction.data.total_machine_time_in_min,
                remarks: lastAction.data.remarks,
                entered_by_user_id: lastAction.data.entered_by_user_id,
                entered_date_time: lastAction.data.entered_date_time,
                approval_remarks: lastAction.data.approval_remarks,
                status: lastAction.data.status,
                approved_by_user_id: lastAction.data.approved_by_user_id,
                approved_date_time: lastAction.data.approved_date_time ? new Date(lastAction.data.approved_date_time) : undefined,
            });
        }
        
        toast({
            title: "Undone",
            description: "Changes have been reverted",
        });
        setLastAction(null);
        loadPackings();
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to undo action",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Packing Master</h1>
                                <p className="text-muted-foreground">Manage packing records and approvals</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Packing Record
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
                                        placeholder="Search by Batch No, Product ID, Packsize ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredPackings.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredPackings.length)} OF {filteredPackings.length}
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
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="status-pending" 
                                                            name="statusFilter"
                                                            checked={filterStatus === "E"}
                                                            onChange={() => setFilterStatus("E")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="status-pending" className="text-sm font-normal cursor-pointer text-foreground">Pending</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="status-approved" 
                                                            name="statusFilter"
                                                            checked={filterStatus === "A"}
                                                            onChange={() => setFilterStatus("A")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="status-approved" className="text-sm font-normal cursor-pointer text-foreground">Approved</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="status-rejected" 
                                                            name="statusFilter"
                                                            checked={filterStatus === "X"}
                                                            onChange={() => setFilterStatus("X")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="status-rejected" className="text-sm font-normal cursor-pointer text-foreground">Rejected</Label>
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
                                            <th className="px-3 py-3 w-8"></th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Packing ID
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Packing Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Batch No
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Product ID
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Packsize ID
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                No of Packs
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                No of Sachets
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Machine Time (min)
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Entered By
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Entry Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={13} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading Packing records...
                                                </td>
                                            </tr>
                                        ) : filteredPackings.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="px-6 py-4 text-center text-muted-foreground">
                                                    No Packing records found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPackings.map((item, index) => {
                                                const statusBadge = getStatusBadge(item.status);
                                                const rowKey = String(item._id || item.packing_id);
                                                const isExpanded = expandedRows.has(item.batch_no);
                                                const stock = stockCache[item.batch_no];

                                                return (
                                                    <React.Fragment key={rowKey}>
                                                    <motion.tr
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? "bg-blue-50/40" : ""}`}
                                                    >
                                                        <td className="px-3 py-4 text-center align-middle">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); toggleExpandRow(item); }}
                                                                className={`p-1.5 rounded-md transition-colors ${isExpanded ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}
                                                                title="Show Stock Info"
                                                            >
                                                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-6 text-sm align-middle">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                {item.packing_id}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                            {formatDateTime(item.packing_date).split(' ')[0]}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle font-mono">
                                                            {item.batch_no}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                            {item.product_id}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                            {item.packsize_id}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle text-right">
                                                            {item.no_of_packs.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle text-right">
                                                            {item.no_of_sachets.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle text-right">
                                                            {item.total_machine_time_in_min}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                            {item.entered_by_user_id}
                                                        </td>
                                                        <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                            {formatDateTime(item.entered_date_time)}
                                                        </td>
                                                        <td className="px-6 py-6 text-left align-middle">
                                                            <span
                                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusBadge.className}`}
                                                            >
                                                                {statusBadge.label}
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
                                                                    className={`${
                                                                        item.status === 'E' 
                                                                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                                                                            : "text-gray-400 cursor-not-allowed"
                                                                    }`}
                                                                    title={item.status === 'E' ? "Edit Record" : "Only pending records can be edited"}
                                                                    disabled={item.status !== 'E'}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                {item.status === 'E' && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleApproval(item);
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                            title="Approve/Reject Record"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>

                                                    {/* ── Stock expanded row ── */}
{isExpanded && (
    <tr>
        <td colSpan={13} className="p-0 border-b border-slate-100">
            <div className="px-6 py-4 bg-slate-50/60">
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                    {/* Header bar */}
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
                        <LayoutList size={13} className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                            Product Stock — {item.batch_no}
                        </span>
                    </div>

                    {!stock ? (
                        <div className="px-4 py-5 text-sm text-slate-400 italic text-center">No stock record found for this batch.</div>
                    ) : (
                        <div className="w-full overflow-hidden">
                            {/* Header Row */}
                            <div className="flex items-center bg-slate-50 border-b border-slate-100 px-4 py-2">
                                <div className="flex-[1.5] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Batch No</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Product ID</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pack Size</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Total Packs</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Total Sachets</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Carton Type</div>
                                <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Total Cartons</div>
                                <div className="flex-[1.5] text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Last Modified</div>
                            </div>

                            {/* Data Row */}
                            <div className="flex items-center px-4 py-3 hover:bg-slate-50/80 transition-colors">
                                <div className="flex-[1.5] text-xs font-mono text-slate-700 truncate">{stock.batch_no}</div>
                                <div className="flex-1 text-xs text-slate-700">{stock.product_id}</div>
                                <div className="flex-1 text-xs text-slate-700">{stock.pack_size_id}</div>
                                <div className="flex-1 text-xs text-slate-700 uppercase">{stock.product_status_id}</div>
                                <div className="flex-1 text-sm font-bold text-blue-600 text-right">{stock.total_no_of_packs?.toLocaleString() || 0}</div>
                                <div className="flex-1 text-sm font-bold text-blue-600 text-right">{stock.total_no_of_sachets?.toLocaleString() || 0}</div>
                                <div className="flex-1 text-xs text-slate-700 text-center">{stock.carton_type_id}</div>
                                <div className="flex-1 text-sm font-bold text-blue-600 text-right">{stock.total_no_of_cartons?.toLocaleString() || 0}</div>
                                <div className="flex-[1.5] text-[11px] text-slate-500 text-right whitespace-nowrap">
                                    {stock.last_modified_date_time ? formatDateTime(stock.last_modified_date_time) : "-"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </td>
    </tr>
)}
                                                    </React.Fragment>
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

            {/* Add Packing Modal */}
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
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Packing Record</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-3 gap-6">
                                        {/* Packing ID */}
                                       

                                        {/* Packing Date */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packing Date <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="packing_date"
                                                type="date"
                                                value={formData.packing_date}
                                                onChange={handleInputChange}
                                                min={today}
                                                required
                                            />
                                        </div>

                                        {/* Batch No */}
                                       <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Batch No <span className="text-red-500">*</span>
    </label>
    <select
        name="batch_no"
        value={formData.batch_no}
        onChange={handleBatchChange}
        required
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
        <option value="">-- Select Active Batch (W) --</option>
        {activeBatches.length > 0 ? (
            activeBatches.map((t) => (
                <option key={`${t.batch_no}-${t.month_year}`} value={t.batch_no}>
                    {t.batch_no} (Product: {t.product_id})
                </option>
            ))
        ) : (
            <option disabled>No batches in W status</option>
        )}
    </select>

    {/* Optional: Helpful hint if no batches are found */}
    {activeBatches.length === 0 && (
        <p className="text-xs text-amber-500 mt-1">
            Note: Only batches with Work in Progress status are shown.
        </p>
    )}
</div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_id"
                                                value={formData.product_id}
                                                // onChange={handleInputChange}
                                                readOnly
                                                placeholder="Enter Product ID"
                                                maxLength={5}
                                                required
                                                className="uppercase"
                                            />
                                        </div>

                                        {/* Packsize ID */}
 <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Packsize ID <span className="text-red-500">*</span>
    </label>
    <Input
        name="packsize_id"
        value={formData.packsize_id}
        onChange={handleInputChange}
        placeholder={formData.batch_no ? "Auto-filled from batch" : "Select a batch first"}
        maxLength={4}
        required
        className="uppercase"
        readOnly={!!formData.batch_no} // Makes it read-only once batch is selected
    />
    {formData.batch_no && !formData.packsize_id && (
        <p className="text-xs text-amber-500 mt-1">
            No packsize found for this batch. Please enter manually.
        </p>
    )}
</div>

                                        {/* No of Packs */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No of Packs
                                            </label>
                                            <Input
                                                name="no_of_packs"
                                                type="number"
                                                value={formData.no_of_packs}
                                                onChange={handleInputChange}
                                                placeholder="Enter No of Packs"
                                                max="999999"
                                            />
                                        </div>

                                      {/* No of Sachets - Display Only */}
<div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        No of Sachets
    </label>
    <div className="relative">
        <Input
            name="no_of_sachets"
            type="number"
            value={formData.no_of_sachets}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
            placeholder="Auto-calculated"
        />
    </div>
</div>

                                        {/* Total Machine Time */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine Time (min)
                                            </label>
                                            <Input
                                                name="total_machine_time_in_min"
                                                type="number"
                                                value={formData.total_machine_time_in_min}
                                                onChange={handleInputChange}
                                                placeholder="Enter Machine Time"
                                                max="9999"
                                            />
                                        </div>

                                        {/* Remarks */}
                                        <div className="col-span-3">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <Textarea
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                placeholder="Enter remarks (max 100 characters)"
                                                maxLength={100}
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={isSubmittingRef.current}>
                                            Save Packing Record
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Packing Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Packing Record</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-3 gap-6">
                                        {/* Packing ID - Disabled in edit */}
                                    

                                        {/* Packing Date */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packing Date <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="packing_date"
                                                type="date"
                                                value={formData.packing_date}
                                                onChange={handleInputChange}
                                                min={today}
                                                required
                                            />
                                        </div>

                                       {/* Batch No - Read-only in Edit Mode */}
<div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Batch No <span className="text-red-500">*</span>
    </label>
    <Input
        name="batch_no"
        value={formData.batch_no}
        disabled 
        className="bg-gray-100 cursor-not-allowed uppercase" // Visual feedback that it's disabled
    />
</div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_id"
                                                value={formData.product_id}
                                                onChange={handleInputChange}
                                                maxLength={5}
                                                required
                                                className="uppercase"
                                            />
                                        </div>

                                        {/* Packsize ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packsize ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="packsize_id"
                                                value={formData.packsize_id}
                                                onChange={handleInputChange}
                                                maxLength={4}
                                                required
                                                className="uppercase"
                                            />
                                        </div>

                                        {/* No of Packs */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No of Packs
                                            </label>
                                            <Input
                                                name="no_of_packs"
                                                type="number"
                                                value={formData.no_of_packs}
                                                onChange={handleInputChange}
                                                max="999999"
                                            />
                                        </div>

                                        {/* No of Sachets */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No of Sachets
                                            </label>
                                            <Input
                                                name="no_of_sachets"
                                                type="number"
                                                value={formData.no_of_sachets}
                                                onChange={handleInputChange}
                                                max="99999999"
                                            />
                                        </div>

                                        {/* Total Machine Time */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine Time (min)
                                            </label>
                                            <Input
                                                name="total_machine_time_in_min"
                                                type="number"
                                                value={formData.total_machine_time_in_min}
                                                onChange={handleInputChange}
                                                max="9999"
                                            />
                                        </div>

                                        {/* Remarks */}
                                        <div className="col-span-3">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <Textarea
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                maxLength={100}
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6" disabled={isSubmittingRef.current}>
                                            Update Packing Record
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Approval Modal */}
           {/* Approval Modal */}
<AnimatePresence>
    {isApprovalModalOpen && selectedPacking && (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setIsApprovalModalOpen(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Approve/Reject Packing Record</h2>
                        <button
                            onClick={() => setIsApprovalModalOpen(false)}
                            className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleApprovalSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Record Details - Display Only */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Packing Record Details</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Packing ID */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Packing ID
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.packing_id}
                                    </div>
                                </div>

                                {/* Packing Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Packing Date
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {formatDateTime(selectedPacking.packing_date).split(' ')[0]}
                                    </div>
                                </div>

                                {/* Batch No */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Batch No
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.batch_no}
                                    </div>
                                </div>

                                {/* Product ID */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Product ID
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.product_id}
                                    </div>
                                </div>

                                {/* Packsize ID */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Packsize ID
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.packsize_id}
                                    </div>
                                </div>

                                {/* No of Packs */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        No of Packs
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.no_of_packs.toLocaleString()}
                                    </div>
                                </div>

                                {/* No of Sachets */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        No of Sachets
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.no_of_sachets.toLocaleString()}
                                    </div>
                                </div>

                                {/* Machine Time */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Machine Time (min)
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.total_machine_time_in_min}
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div className="col-span-3">
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Remarks
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.remarks || '-'}
                                    </div>
                                </div>

                                {/* Entered By */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Entered By
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {selectedPacking.entered_by_user_id}
                                    </div>
                                </div>

                                {/* Entry Date */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                        Entry Date & Time
                                    </label>
                                    <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">
                                        {formatDateTime(selectedPacking.entered_date_time)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Approval Section */}
                        <div className="space-y-4">
                            {/* Approval Remarks - Entry */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Approval Remarks <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    value={approvalData.approval_remarks}
                                    onChange={(e) => setApprovalData(prev => ({ ...prev, approval_remarks: e.target.value }))}
                                    placeholder="Enter approval/rejection remarks (max 100 characters)"
                                    maxLength={100}
                                    rows={3}
                                    required
                                    className="w-full"
                                />
                            </div>

                            {/* Approved By - Display Only */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Approved By User ID <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value="ADMIN"
                                    disabled
                                    className="bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            {/* Approved Date - Display Only */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Approved Date & Time <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formatDateTime(new Date())}
                                    disabled
                                    className="bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            {/* Status - Display Only with Buttons */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Input
                                            value={approvalData.status === 'A' ? 'APPROVED' : 'REJECTED'}
                                            disabled
                                            className={`bg-gray-100 cursor-not-allowed font-bold ${
                                                approvalData.status === 'A' ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={() => setApprovalData(prev => ({ ...prev, status: 'A' }))}
                                            className={`px-6 ${
                                                approvalData.status === 'A' 
                                                    ? 'bg-green-600 hover:bg-green-700' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve (A)
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setApprovalData(prev => ({ ...prev, status: 'X' }))}
                                            className={`px-6 ${
                                                approvalData.status === 'X' 
                                                    ? 'bg-red-600 hover:bg-red-700' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel (X)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsApprovalModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className={approvalData.status === 'A' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                disabled={isSubmittingRef.current || !approvalData.approval_remarks.trim()}
                            >
                                {approvalData.status === 'A' ? 'Approve Record' : 'Reject Record'}
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