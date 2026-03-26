'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, LayoutList, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { cartonCapacityAPI, packingAPI, packSizeAPI, productMovementAPI, productStatusAPI, productStatusTransitionAPI, productStockAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";

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
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

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

export default function PackingEntryApprovalPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [packingToDelete, setPackingToDelete] = useState<Packing | null>(null);
    const [selectedPacking, setSelectedPacking] = useState<Packing | null>(null);
    const [packings, setPackings] = useState<Packing[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [approvalData, setApprovalData] = useState({
        approval_remarks: "",
        status: "A",
    });
    const [lastAction, setLastAction] = useState<{ type: 'approve' | 'reject'; data: Packing } | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [stockCache, setStockCache] = useState<Record<string, any>>({});
    const isSubmittingRef = useRef(false);
    const isSuperAdmin = getSessionUser()?.super_admin === true;

    const loadPackings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await packingAPI.getAll();
            // Only show pending records (status = 'E')
            setPackings(data.filter((item: Packing) => item.status === 'E'));
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

    const filteredPackings = packings.filter((item) =>
        item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packsize_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packing_id?.toString().includes(searchQuery)
    );

    const totalPages = Math.ceil(filteredPackings.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedPackings = filteredPackings.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleApproval = (packing: Packing) => {
        setSelectedPacking(packing);
        setApprovalData({ approval_remarks: "", status: "A" });
        setIsApprovalModalOpen(true);
    };

    const handleDelete = (packing: Packing) => {
        setPackingToDelete(packing);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!packingToDelete) return;
        try {
            await packingAPI.delete(packingToDelete.packing_id.toString());
            toast({ title: "Deleted", description: `Packing record #${packingToDelete.packing_id} permanently deleted` });
            setIsDeleteDialogOpen(false);
            setPackingToDelete(null);
            loadPackings();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete packing record", variant: "destructive" });
        }
    };

    const generateMovementId = async (): Promise<number> => {
        const currentYear = new Date().getFullYear();
        const yearSuffix = currentYear.toString().slice(-2);
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
        let movementId: number | null = null;

        try {
            if (newStatus === 'A') {
                const productStatusList = await productStatusAPI.getByMovementType('I');
                if (!productStatusList || productStatusList.length === 0) {
                    throw new Error('No product status found with movement type I');
                }
                const fromProductStatus = productStatusList[0];

                const transitions = await productStatusTransitionAPI.getByFromStatus(fromProductStatus.prod_status_id);
                if (!transitions || transitions.length === 0) {
                    throw new Error('No transition found for the product status');
                }
                const transition = transitions[0];

                const packSizes = await packSizeAPI.getAll();
                const packSize = packSizes.find((ps: any) => ps.pack_size_id === selectedPacking.packsize_id);
                if (!packSize) {
                    throw new Error('Pack size not found');
                }

                const cartonCapacities = await cartonCapacityAPI.getAll({
                    productId: selectedPacking.product_id,
                    packSizeId: selectedPacking.packsize_id,
                    cartonTypeId: fromProductStatus.carton_type_id,
                    active: true
                });
                const cartonCapacity = cartonCapacities.length > 0 ? cartonCapacities[0] : null;

                const noOfSachets = selectedPacking.no_of_packs * (packSize.qty_per_carton || 0);

                movementId = await generateMovementId();

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
                    status: 'A',
                };

                await productMovementAPI.create(movementData);

                const existingStock = await productStockAPI.getByBatchNo(selectedPacking.batch_no);

                let stockData;
                if (existingStock) {
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
                    await productStockAPI.update(selectedPacking.batch_no, stockData);
                    toast({
                        title: "Stock Updated",
                        description: `Added ${selectedPacking.no_of_packs} packs to existing stock. New total: ${stockData.total_no_of_packs}`,
                    });
                } else {
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
                    await productStockAPI.create(stockData);
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

            setIsApprovalModalOpen(false);
            setSelectedPacking(null);
            setApprovalData({ approval_remarks: "", status: "A" });
            loadPackings();

        } catch (error: any) {
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
            toast({ title: "Undone", description: "Changes have been reverted" });
            setLastAction(null);
            loadPackings();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to undo action", variant: "destructive" });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Packing Entry Approval</h1>
                                <p className="text-muted-foreground">Review and approve pending packing records</p>
                            </div>
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
                                        placeholder="Search by Batch No, Product ID, Packsize ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredPackings.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredPackings.length)} OF {filteredPackings.length}
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
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            <th className="px-3 py-3 w-8"></th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Packing ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Packing Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch No</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Product ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Packsize ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">No of Packs</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">No of Sachets</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Machine Time (min)</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Entered By</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Entry Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={12} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading pending packing records...
                                                </td>
                                            </tr>
                                        ) : filteredPackings.length === 0 ? (
                                            <tr>
                                                <td colSpan={12} className="px-6 py-4 text-center text-muted-foreground">
                                                    No pending packing records found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedPackings.map((item, index) => {
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
                                                            <td className="px-6 py-6 text-center align-middle">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleApproval(item); }}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        title="Approve/Reject Record"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </Button>
                                                                    {isSuperAdmin && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                                            className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                                            title="Permanently delete"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>

                                                        {/* Stock expanded row */}
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={12} className="p-0 border-b border-slate-100">
                                                                    <div className="px-6 py-4 bg-slate-50/60">
                                                                        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
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
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Packing ID</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.packing_id}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Packing Date</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{formatDateTime(selectedPacking.packing_date).split(' ')[0]}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Batch No</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.batch_no}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Product ID</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.product_id}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Packsize ID</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.packsize_id}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">No of Packs</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.no_of_packs.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">No of Sachets</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.no_of_sachets.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Machine Time (min)</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.total_machine_time_in_min}</div>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Remarks</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.remarks || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Entered By</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{selectedPacking.entered_by_user_id}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Entry Date & Time</label>
                                                <div className="text-sm font-medium text-foreground bg-white p-2 rounded border">{formatDateTime(selectedPacking.entered_date_time)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Section */}
                                    <div className="space-y-4">
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
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Approved By User ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input value="ADMIN" disabled className="bg-gray-100 cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Approved Date & Time <span className="text-red-500">*</span>
                                            </label>
                                            <Input value={formatDateTime(new Date())} disabled className="bg-gray-100 cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <Input
                                                        value={approvalData.status === 'A' ? 'APPROVED' : 'REJECTED'}
                                                        disabled
                                                        className={`bg-gray-100 cursor-not-allowed font-bold ${approvalData.status === 'A' ? 'text-green-600' : 'text-red-600'}`}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => setApprovalData(prev => ({ ...prev, status: 'A' }))}
                                                        className={`px-6 ${approvalData.status === 'A' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve (A)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => setApprovalData(prev => ({ ...prev, status: 'X' }))}
                                                        className={`px-6 ${approvalData.status === 'X' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        <X className="w-4 h-4 mr-2" />
                                                        Cancel (X)
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
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

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setIsDeleteDialogOpen(false); setPackingToDelete(null); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Packing Record</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    Are you sure you want to permanently delete Packing #{packingToDelete?.packing_id}? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setIsDeleteDialogOpen(false); setPackingToDelete(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                                    <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
