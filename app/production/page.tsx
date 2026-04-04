'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, AlertCircle, Bot, ChevronDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { productionAPI } from "@/services/api";
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

interface Production {
    _id?: string;
    production_id: number;
    production_date: string;
    machine_id: string;
    batch_no: string;
    product_id: string;
    collection_bin_no: number;
    tare_weight_kgs?: number;
    gross_weight_kgs?: number;
    net_weight_kgs?: number;
    calculated_total_qty?: number;
    // machine_count_qty?: number;
    remarks?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: string;
    status?: string;
}

interface MachineStatus {
    machine_id: string;
    batch_no: string;
    product_id: string;
    last_machine_event_type_id: string;
}

interface CollectionBin {
    bin_id: string;
    bin_name: string;
    bin_short_name: string;
    tare_weight_kg?: number;
    gross_capacity_kg?: number;
    active: boolean;
}

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

function formatDate(date: string | undefined): string {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function toInputDate(date: string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

export default function ProductionPage() {
    const { toast } = useToast();

    // ── List state ──
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [productions, setProductions] = useState<Production[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: Production } | null>(null);

    // ── Modal state ──
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [itemToCancel, setItemToCancel] = useState<Production | null>(null);
    const [selectedItem, setSelectedItem] = useState<Production | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Production | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const isSubmittingRef = useRef(false);

    // ── Reference data ──
    const [machineStatuses, setMachineStatuses] = useState<MachineStatus[]>([]);
    const [activeBins, setActiveBins] = useState<CollectionBin[]>([]);

    // ── Add form state ──
    const [addProductionId, setAddProductionId] = useState<number>(0);
    const [addProductionDate] = useState<string>(todayISO());
    const [addMachineId, setAddMachineId] = useState<string>("");
    const [addBatchNo, setAddBatchNo] = useState<string>("");
    const [addProductId, setAddProductId] = useState<string>("");
    const [addMachineError, setAddMachineError] = useState<string>("");
    const [addSelectedBin, setAddSelectedBin] = useState<CollectionBin | null>(null);
    const [addTareWeight, setAddTareWeight] = useState<number>(0);
    const [addGrossWeight, setAddGrossWeight] = useState<string>("");
    const [addGrossError, setAddGrossError] = useState<string>("");
    const [addMachineCountQty, setAddMachineCountQty] = useState<string>("");
    const [addRemarks, setAddRemarks] = useState<string>("");
    const [addStatus, setAddStatus] = useState<string>("W");
    const [addWeightPerPiece, setAddWeightPerPiece] = useState<number>(0);

    // ── Derived add values ──
    const addNetWeight = addGrossWeight !== "" && addTareWeight > 0
        ? parseFloat(addGrossWeight) - addTareWeight
        : null;
    const addCalcQty = addNetWeight !== null && addNetWeight > 0 && addWeightPerPiece > 0
        ? Math.round((addNetWeight * 1000) / addWeightPerPiece)
        : null;

    // ── Edit form state (simple string form) ──
    const emptyEditForm = {
        production_id: "", production_date: "", machine_id: "", batch_no: "",
        product_id: "", collection_bin_no: "", tare_weight_kgs: "", gross_weight_kgs: "",
        net_weight_kgs: "", calculated_total_qty: "", // machine_count_qty: "",
        remarks: "", status: "W",
    };
    const [editFormData, setEditFormData] = useState({ ...emptyEditForm });

    // ── Load list ──
    const loadProductions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await productionAPI.getAll();
            setProductions(Array.isArray(data) ? data : []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load production records", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadProductions(); }, [loadProductions]);

    // ── Load reference data once ──
    useEffect(() => {
        fetch('/api/machine-statuses').then(r => r.json()).then(d => setMachineStatuses(Array.isArray(d) ? d : [])).catch(() => {});
        fetch('/api/collection-bins').then(r => r.json()).then(d => {
            setActiveBins(Array.isArray(d) ? d.filter((b: CollectionBin) => b.active) : []);
        }).catch(() => {});
    }, []);

    // ── Generate production ID when add modal opens ──
    useEffect(() => {
        if (!isAddModalOpen) return;
        fetch('/api/productions/next-id')
            .then(r => r.json())
            .then(d => setAddProductionId(d.production_id || 0))
            .catch(() => {});
        // Reset all add form fields
        setAddMachineId(""); setAddBatchNo(""); setAddProductId("");
        setAddMachineError(""); setAddSelectedBin(null); setAddTareWeight(0);
        setAddGrossWeight(""); setAddGrossError(""); 
        setAddRemarks(""); setAddStatus("W"); setAddWeightPerPiece(0);
    }, [isAddModalOpen]);

    // ── Machine button selection ──
    const handleMachineSelect = async (machine: MachineStatus) => {
        setAddMachineId(machine.machine_id);
        setAddBatchNo(machine.batch_no);
        setAddProductId(machine.product_id);
        setAddMachineError("");

        // Check transaction status for this batch
        try {
            const res = await fetch(`/api/transactions/${machine.batch_no}`);
            const txn = await res.json();
            if (txn && txn.current_batch_status_id !== 'W') {
                setAddMachineError(`{T401} Machine ${machine.machine_id}: Batch ${machine.batch_no} is not in WIP status (Current: ${txn.current_batch_status_id}). Cannot record production.`);
                setAddBatchNo(""); setAddProductId(""); setAddMachineId("");
                return;
            }
        } catch {
            setAddMachineError("{T401} Unable to verify batch status. Please try again.");
            setAddMachineId(""); setAddBatchNo(""); setAddProductId("");
            return;
        }

        // Fetch product weight_per_piece
        try {
            const pRes = await fetch(`/api/products/${machine.product_id}`);
            const product = await pRes.json();
            setAddWeightPerPiece(product?.weight_per_piece || 0);
        } catch {
            setAddWeightPerPiece(0);
        }
    };

    // ── Bin selection ──
    const handleBinSelect = (binId: string) => {
        const bin = activeBins.find(b => b.bin_id === binId) || null;
        setAddSelectedBin(bin);
        setAddTareWeight(bin?.tare_weight_kg || 0);
        setAddGrossWeight("");
        setAddGrossError("");
    };

    // ── Gross weight validation ──
    const handleGrossWeightChange = (val: string) => {
        setAddGrossWeight(val);
        if (val && addSelectedBin?.gross_capacity_kg !== undefined) {
            if (parseFloat(val) > addSelectedBin.gross_capacity_kg) {
                setAddGrossError(`Gross weight cannot exceed bin capacity (${addSelectedBin.gross_capacity_kg} kg)`);
            } else {
                setAddGrossError("");
            }
        } else {
            setAddGrossError("");
        }
    };

    // ── Submit Add ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!addMachineId) { toast({ title: "Error", description: "Please select a machine", variant: "destructive" }); return; }
        if (!addSelectedBin) { toast({ title: "Error", description: "Please select a collection bin", variant: "destructive" }); return; }
        if (addGrossError) { toast({ title: "Error", description: addGrossError, variant: "destructive" }); return; }
        if (addNetWeight !== null && addNetWeight <= 0) { toast({ title: "Error", description: "Net weight must be > 0", variant: "destructive" }); return; }

        isSubmittingRef.current = true;
        try {
            await productionAPI.create({
                production_id: addProductionId,
                production_date: addProductionDate,
                machine_id: addMachineId,
                batch_no: addBatchNo,
                product_id: addProductId,
                collection_bin_no: parseInt(addSelectedBin.bin_id) || 0,
                tare_weight_kgs: addTareWeight,
                gross_weight_kgs: parseFloat(addGrossWeight) || undefined,
                net_weight_kgs: addNetWeight || undefined,
                calculated_total_qty: addCalcQty || undefined,
                // machine_count_qty: addMachineCountQty ? Number(addMachineCountQty) : undefined,
                remarks: addRemarks || '',
                status: addStatus,
                last_modified_user_id: "ADMIN",
            });
            toast({ title: "Success", description: "Production record created successfully" });
            setIsAddModalOpen(false);
            loadProductions();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create production record", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    // ── Edit handlers ──
    const handleDelete = (item: Production) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete?._id) return;
        try {
            await productionAPI.delete(itemToDelete._id);
            toast({ title: "Deleted", description: `Production #${itemToDelete.production_id} permanently deleted` });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
            loadProductions();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete production", variant: "destructive" });
        }
    };

    const handleEdit = (item: Production) => {
        if (item.status === 'C' && !isSuperAdmin) {
            toast({ title: "Cannot Edit", description: "Closed records cannot be edited", variant: "destructive" });
            return;
        }
        setSelectedItem(item);
        setEditFormData({
            production_id: String(item.production_id),
            production_date: toInputDate(item.production_date),
            machine_id: item.machine_id,
            batch_no: item.batch_no,
            product_id: item.product_id,
            collection_bin_no: String(item.collection_bin_no),
            tare_weight_kgs: item.tare_weight_kgs !== undefined ? String(item.tare_weight_kgs) : "",
            gross_weight_kgs: item.gross_weight_kgs !== undefined ? String(item.gross_weight_kgs) : "",
            net_weight_kgs: item.net_weight_kgs !== undefined ? String(item.net_weight_kgs) : "",
            calculated_total_qty: item.calculated_total_qty !== undefined ? String(item.calculated_total_qty) : "",
            // machine_count_qty: item.machine_count_qty !== undefined ? String(item.machine_count_qty) : "",
            remarks: item.remarks || '',
            status: item.status || 'W',
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current || !selectedItem?._id) return;
        isSubmittingRef.current = true;
        const previousData = { ...selectedItem };
        try {
            await productionAPI.update(selectedItem._id, {
                // machine_count_qty: editFormData.machine_count_qty ? Number(editFormData.machine_count_qty) : undefined,
                gross_weight_kgs: editFormData.gross_weight_kgs ? Number(editFormData.gross_weight_kgs) : undefined,
                net_weight_kgs: editFormData.net_weight_kgs ? Number(editFormData.net_weight_kgs) : undefined,
                calculated_total_qty: editFormData.calculated_total_qty ? Number(editFormData.calculated_total_qty) : undefined,
                remarks: editFormData.remarks || '',
                status: editFormData.status,
                last_modified_user_id: "ADMIN",
            });
            setLastAction({ type: 'edit', data: previousData });
            toast({
                title: "Success",
                description: "Production record updated successfully",
                action: <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>,
            });
            setIsEditModalOpen(false);
            setSelectedItem(null);
            setEditFormData({ ...emptyEditForm });
            loadProductions();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update production record", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction?.data._id) return;
        try {
            await productionAPI.update(lastAction.data._id, {
                // machine_count_qty: lastAction.data.machine_count_qty,
                gross_weight_kgs: lastAction.data.gross_weight_kgs,
                net_weight_kgs: lastAction.data.net_weight_kgs,
                calculated_total_qty: lastAction.data.calculated_total_qty,
                remarks: lastAction.data.remarks || '',
                status: lastAction.data.status,
                last_modified_user_id: "ADMIN",
            });
            toast({ title: "Undone", description: "Changes have been reverted" });
            setLastAction(null);
            loadProductions();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to undo action", variant: "destructive" });
        }
    };

    const handleCancelItem = (item: Production) => {
        if (item.status === 'C') { toast({ title: "Already Closed", description: "This record is already closed", variant: "destructive" }); return; }
        setItemToCancel(item);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!itemToCancel?._id) return;
        try {
            await productionAPI.update(itemToCancel._id, { status: 'C', last_modified_user_id: "ADMIN" });
            await loadProductions();
            toast({ title: "Closed", description: `Production #${itemToCancel.production_id} has been closed` });
            setIsCancelItemDialogOpen(false);
            setItemToCancel(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to close record", variant: "destructive" });
        }
    };

    const handleCancelClick = (modalType: 'add' | 'edit') => {
        setCancelModalType(modalType);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (cancelModalType === 'add') { setIsAddModalOpen(false); }
        else if (cancelModalType === 'edit') { setIsEditModalOpen(false); setSelectedItem(null); setEditFormData({ ...emptyEditForm }); }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    // ── Filtered / paginated list ──
    const filteredProductions = productions.filter((item) => {
        const matchesSearch =
            String(item.production_id).includes(searchQuery) ||
            item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.machine_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && item.status === "W") ||
            (filterStatus === "inactive" && item.status === "C");
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredProductions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedProductions = filteredProductions.slice(startIndex, endIndex);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, rowsPerPage]);

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Production</h1>
                                <p className="text-muted-foreground">Manage production records</p>
                            </div>
                            <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                                <Plus className="w-5 h-5" />
                                Add New Record
                            </Button>
                        </div>
                    </motion.div>


                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search by Production ID, Batch No, Product ID, Machine ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredProductions.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProductions.length)} OF {filteredProductions.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-0" align="end">
                                        <div className="p-4 border-b border-border">
                                            <h3 className="font-semibold text-sm text-foreground">Filters</h3>
                                        </div>
                                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-foreground">Status</Label>
                                                <div className="space-y-2">
                                                    {[{ value: "all", label: "All" }, { value: "active", label: "WIP" }, { value: "inactive", label: "Closed" }].map(({ value, label }) => (
                                                        <div key={value} className="flex items-center space-x-2">
                                                            <input type="radio" id={`prod-status-${value}`} name="prodStatus" checked={filterStatus === value} onChange={() => setFilterStatus(value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                                                            <Label htmlFor={`prod-status-${value}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">No. of rows per screen</Label>
                                                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value))} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-border bg-muted/30">
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => setFilterStatus("all")}>Clear Filters</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Prod ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Prod Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Machine</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch No</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Product ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Bin No</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Tare Wt (kg)</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Gross Wt (kg)</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Net Wt (kg)</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Calc Qty</th>
                                            {/* <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Machine Qty</th> */}
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>Last Modified</span><span>User Id</span></div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>Last Modified</span><span>Date &amp; Time</span></div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={16} className="px-6 py-4 text-center text-muted-foreground">Loading production records...</td></tr>
                                        ) : filteredProductions.length === 0 ? (
                                            <tr><td colSpan={16} className="px-6 py-4 text-center text-muted-foreground">No production records found</td></tr>
                                        ) : (
                                            paginatedProductions.map((item, index) => (
                                                <motion.tr
                                                    key={item._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${item.status === 'C' ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                    <td className="px-6 py-4"><span className="text-sm font-mono text-foreground">{item.production_id}</span></td>
                                                    <td className="px-6 py-4"><span className="text-sm text-foreground">{formatDate(item.production_date)}</span></td>
                                                    <td className="px-6 py-4"><span className="text-sm font-mono text-foreground">{item.machine_id}</span></td>
                                                    <td className="px-6 py-4"><span className="text-sm font-mono text-foreground">{item.batch_no}</span></td>
                                                    <td className="px-6 py-4"><span className="text-sm font-mono text-foreground">{item.product_id}</span></td>
                                                    <td className="px-6 py-4"><span className="text-sm text-foreground">{item.collection_bin_no}</span></td>
                                                    <td className="px-6 py-4 text-right"><span className="text-sm text-foreground">{item.tare_weight_kgs !== undefined ? item.tare_weight_kgs.toFixed(3) : "-"}</span></td>
                                                    <td className="px-6 py-4 text-right"><span className="text-sm text-foreground">{item.gross_weight_kgs !== undefined ? item.gross_weight_kgs.toFixed(3) : "-"}</span></td>
                                                    <td className="px-6 py-4 text-right"><span className="text-sm text-foreground">{item.net_weight_kgs !== undefined ? item.net_weight_kgs.toFixed(3) : "-"}</span></td>
                                                    <td className="px-6 py-4 text-right"><span className="text-sm text-foreground">{item.calculated_total_qty ?? "-"}</span></td>
                                                    {/* <td className="px-6 py-4 text-right"><span className="text-sm text-foreground">{item.machine_count_qty ?? "-"}</span></td> */}
                                                    <td className="px-6 py-4"><span className="text-sm text-foreground">{item.remarks || "-"}</span></td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${item.status === 'W' ? "bg-yellow-100 text-yellow-800" : item.status === 'C' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                            {item.status === 'W' ? "WIP" : item.status === 'C' ? "Closed" : item.status || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4"><span className="text-sm font-mono text-foreground">{item.last_modified_user_id || "-"}</span></td>
                                                    <td className="px-6 py-4"><span className="text-sm text-foreground">{item.last_modified_date_time ? formatDateTime(item.last_modified_date_time) : "-"}</span></td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${item.status === 'C' && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={item.status === 'C' && !isSuperAdmin} title={item.status === 'C' && !isSuperAdmin ? "Cannot edit closed records" : "Edit record"}>
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCancelItem(item); }} className={`${item.status !== 'C' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`} disabled={item.status === 'C'} title={item.status !== 'C' ? "Close record" : "Already closed"}>
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="text-red-700 hover:text-red-800 hover:bg-red-50" title="Permanently delete">
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
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4 mr-1" />Previous
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages}>
                                        Next<ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* ══════════════════════════════════
                ADD MODAL
            ══════════════════════════════════ */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => handleCancelClick('add')} />
                        <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-[#f4f6f8] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">

                                {/* ── Modal title bar ── */}
                                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-800 tracking-wide">Add Production Record</h2>
                                    <button type="button" onClick={() => handleCancelClick('add')} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                                    {/* ── Card 1: Production ID + Entry Date ── */}
                                    <div className="bg-white rounded-xl shadow-sm px-6 py-5 flex items-center">
                                        <div className="flex-1 pr-4 border-r border-gray-200">
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Production ID</p>
                                            <p className="text-lg font-bold text-orange-500 tracking-wide">
                                                {addProductionId ? String(addProductionId) : "Generating..."}
                                            </p>
                                        </div>
                                        <div className="flex-1 pl-4 text-right">
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Entry Date</p>
                                            <p className="text-lg font-bold text-gray-800">
                                                {new Date(addProductionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Card 2: Select Machine ── */}
                                    <div className="bg-white rounded-xl shadow-sm px-6 py-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Bot className="w-5 h-5 text-orange-500" />
                                            <p className="text-sm font-bold text-gray-700">Select Machine ID</p>
                                        </div>
                                        {machineStatuses.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No machines available</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {machineStatuses.map(m => (
                                                    <button
                                                        key={m.machine_id}
                                                        type="button"
                                                        onClick={() => handleMachineSelect(m)}
                                                        className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                                                            addMachineId === m.machine_id
                                                                ? 'border-orange-500 text-orange-500 bg-orange-50'
                                                                : 'border-gray-200 text-gray-600 bg-white hover:border-orange-300 hover:text-orange-400'
                                                        }`}
                                                    >
                                                        {m.machine_id}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {addMachineError && (
                                            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-red-700 leading-relaxed">{addMachineError}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Card 3: Main form fields ── */}
                                    <div className="bg-white rounded-xl shadow-sm px-6 py-5 space-y-5">

                                        {/* Batch No + Product ID */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Batch Number</p>
                                                <input
                                                    value={addBatchNo}
                                                    disabled
                                                    placeholder="—"
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Product ID</p>
                                                <input
                                                    value={addProductId}
                                                    disabled
                                                    placeholder="—"
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Collection Bin */}
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Collection Bin No.</p>
                                            <div className="relative">
                                                <select
                                                    value={addSelectedBin?.bin_id || ""}
                                                    onChange={(e) => handleBinSelect(e.target.value)}
                                                    required
                                                    className="w-full appearance-none px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 pr-10"
                                                >
                                                    <option value="">Select collection bin...</option>
                                                    {activeBins.map(bin => (
                                                        <option key={bin.bin_id} value={bin.bin_id}>
                                                            {bin.bin_id} ({bin.bin_short_name})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Tare + Gross Weight */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Tare Weight (KG)</p>
                                                <input
                                                    value={addSelectedBin ? addTareWeight.toFixed(2) : ""}
                                                    disabled
                                                    placeholder="—"
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${addGrossError ? 'text-red-500' : 'text-orange-500'}`}>
                                                    Gross Weight (KG) *
                                                    {addSelectedBin?.gross_capacity_kg && !addGrossError && (
                                                        <span className="text-[9px] text-gray-400 font-normal normal-case ml-1">max {addSelectedBin.gross_capacity_kg}</span>
                                                    )}
                                                </p>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={addGrossWeight}
                                                    onChange={(e) => handleGrossWeightChange(e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                    className={`w-full px-3 py-3 rounded-lg border text-sm font-medium text-gray-700 outline-none focus:ring-2 ${addGrossError ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-200 bg-white focus:ring-orange-400 focus:border-orange-400'}`}
                                                />
                                                {addGrossError && <p className="text-[10px] text-red-500 mt-1">{addGrossError}</p>}
                                            </div>
                                        </div>

                                        {/* Net Weight + Machine Count */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Net Weight (KG)</p>
                                                <input
                                                    value={addNetWeight !== null ? addNetWeight.toFixed(2) : "0.00"}
                                                    disabled
                                                    className={`w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium outline-none ${addNetWeight !== null && addNetWeight <= 0 ? 'text-red-500' : 'text-gray-700'}`}
                                                />
                                                {addNetWeight !== null && addNetWeight <= 0 && (
                                                    <p className="text-[10px] text-red-500 mt-1">Must be &gt; 0</p>
                                                )}
                                            </div>
                                            {/* <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Machine Count Qty</p>
                                                <input
                                                    type="number"
                                                    value={addMachineCountQty}
                                                    onChange={(e) => setAddMachineCountQty(e.target.value)}
                                                    placeholder="Enter count"
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                                />
                                            </div> */}
                                        </div>

                                        {/* Calc Qty (hidden row — auto value shown inline) */}
                                        {addCalcQty !== null && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                                                <span className="text-[10px] font-bold text-orange-400 tracking-widest uppercase">Calculated Total Qty:</span>
                                                <span className="text-sm font-bold text-orange-600">{addCalcQty}</span>
                                            </div>
                                        )}

                                        {/* Remarks */}
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Remarks / Observations</p>
                                            <textarea
                                                value={addRemarks}
                                                onChange={(e) => setAddRemarks(e.target.value.slice(0, 100))}
                                                maxLength={100}
                                                rows={3}
                                                placeholder="Note any abnormalities or variations..."
                                                className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                                            />
                                        </div>

                                        {/* Production Status toggle */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Production Status</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Mark as &apos;Closed&apos; when batch finishes</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold tracking-wide ${addStatus === 'W' ? 'text-orange-500' : 'text-gray-400'}`}>WIP</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAddStatus(addStatus === 'W' ? 'C' : 'W')}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${addStatus === 'W' ? 'bg-orange-500' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${addStatus === 'W' ? 'translate-x-1' : 'translate-x-6'}`} />
                                                </button>
                                                <span className={`text-xs font-bold tracking-wide ${addStatus === 'C' ? 'text-gray-700' : 'text-gray-400'}`}>CLOSED</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Save button ── */}
                                    <div className="pb-2">
                                        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm tracking-wide shadow-md">
                                            Save Production Record
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════
                EDIT MODAL
            ══════════════════════════════════ */}
            <AnimatePresence>
                {isEditModalOpen && selectedItem && (selectedItem.status !== 'C' || isSuperAdmin) && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => handleCancelClick('edit')} />
                        <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-[#f4f6f8] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">

                                {/* ── Modal title bar ── */}
                                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-800 tracking-wide">Edit Production Record</h2>
                                    <button type="button" onClick={() => handleCancelClick('edit')} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                                    {/* ── Card 1: Production ID + Entry Date ── */}
                                    <div className="bg-white rounded-xl shadow-sm px-6 py-5 flex items-center">
                                        <div className="flex-1 pr-4 border-r border-gray-200">
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Production ID</p>
                                            <p className="text-lg font-bold text-orange-500 tracking-wide">{editFormData.production_id}</p>
                                        </div>
                                        <div className="flex-1 pl-4 text-right">
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Entry Date</p>
                                            <p className="text-lg font-bold text-gray-800">{formatDate(editFormData.production_date)}</p>
                                        </div>
                                    </div>

                                    {/* ── Card 2: Machine info ── */}
                                    <div className="bg-white rounded-xl shadow-sm px-6 py-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Bot className="w-5 h-5 text-orange-500" />
                                            <p className="text-sm font-bold text-gray-700">Machine Details</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-4 py-2 rounded-lg border-2 border-orange-500 text-orange-500 bg-orange-50 text-sm font-semibold">
                                                {editFormData.machine_id}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── Card 3: Main form fields ── */}
                                    <div className="bg-white rounded-xl shadow-sm px-6 py-5 space-y-5">

                                        {/* Batch No + Product ID */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Batch Number</p>
                                                <input
                                                    value={editFormData.batch_no}
                                                    disabled
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Product ID</p>
                                                <input
                                                    value={editFormData.product_id}
                                                    disabled
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Collection Bin + Tare Weight */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Collection Bin No.</p>
                                                <input
                                                    value={editFormData.collection_bin_no}
                                                    disabled
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Tare Weight (KG)</p>
                                                <input
                                                    value={editFormData.tare_weight_kgs}
                                                    disabled
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Gross Weight + Machine Count */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-orange-500 tracking-widest uppercase mb-1.5">Gross Weight (KG) *</p>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={editFormData.gross_weight_kgs}
                                                    onChange={(e) => setEditFormData(f => ({ ...f, gross_weight_kgs: e.target.value }))}
                                                    placeholder="0.00"
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                                />
                                            </div>
                                            {/* <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Machine Count Qty</p>
                                                <input
                                                    type="number"
                                                    value={editFormData.machine_count_qty}
                                                    onChange={(e) => setEditFormData(f => ({ ...f, machine_count_qty: e.target.value }))}
                                                    placeholder="Enter count"
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                                                />
                                            </div> */}
                                        </div>

                                        {/* Net Weight + Calc Qty */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Net Weight (KG)</p>
                                                <input
                                                    value={editFormData.net_weight_kgs}
                                                    disabled
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Calculated Total Qty</p>
                                                <input
                                                    value={editFormData.calculated_total_qty}
                                                    disabled
                                                    className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">Remarks / Observations</p>
                                            <textarea
                                                value={editFormData.remarks}
                                                onChange={(e) => setEditFormData(f => ({ ...f, remarks: e.target.value.slice(0, 100) }))}
                                                maxLength={100}
                                                rows={3}
                                                placeholder="Note any abnormalities or variations..."
                                                className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                                            />
                                        </div>

                                        {/* Production Status toggle */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Production Status</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Mark as &apos;Closed&apos; when batch finishes</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold tracking-wide ${editFormData.status === 'W' ? 'text-orange-500' : 'text-gray-400'}`}>WIP</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditFormData(f => ({ ...f, status: f.status === 'W' ? 'C' : 'W' }))}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editFormData.status === 'W' ? 'bg-orange-500' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${editFormData.status === 'W' ? 'translate-x-1' : 'translate-x-6'}`} />
                                                </button>
                                                <span className={`text-xs font-bold tracking-wide ${editFormData.status === 'C' ? 'text-gray-700' : 'text-gray-400'}`}>CLOSED</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Update button ── */}
                                    <div className="pb-2">
                                        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm tracking-wide shadow-md">
                                            Update Production Record
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel modal confirmation */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to cancel? Any unsaved changes will be lost.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelDialogOpen(false)}>No, Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">Yes, Cancel</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Close record confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Production Record</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete Production #{itemToDelete?.production_id}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setItemToDelete(null); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Close</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to close Production #{itemToCancel?.production_id}? It will be marked as Closed and cannot be edited.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsCancelItemDialogOpen(false); setItemToCancel(null); }}>No, Keep WIP</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-red-600 hover:bg-red-700">Yes, Close Record</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
