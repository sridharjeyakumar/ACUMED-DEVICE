'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, ChevronLeft, ChevronRight, X, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { productionRejectedAPI, machineStatusAPI, collectionBinAPI, productAPI } from "@/services/api";
import { transactionAPI } from "@/services/api";

interface ProductionRejected {
    _id?: string;
    product_rejection_id: number;
    entry_date: Date;
    machine_id: string;
    batch_no: string;
    product_id: string;
    collection_bin_no: string; // bin_id is string
    tare_weight_kgs?: number;
    gross_weight_kgs?: number;
    net_weight_kgs?: number;
    calculated_total_qty?: number;
    remarks?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    status: 'E' | 'C';
    createdAt?: string;
    updatedAt?: string;
}

interface MachineStatus {
    machine_id: string;
    batch_no: string;
    product_id: string;
}

interface CollectionBin {
    bin_type: string;
    bin_id: string;
    bin_name: string;
    bin_short_name: string;
    tare_weight_kg?: number;
    gross_capacity_kg?: number;
    active: boolean;
}

interface Product {
    product_id: string;
    product_name: string;
    weight_per_piece?: number;
}

const statusConfig = {
    'E': { label: 'Entry', color: 'bg-yellow-50 text-yellow-600', icon: Clock },
    'C': { label: 'Closed', color: 'bg-green-50 text-green-600', icon: CheckCircle },
};

function formatDateTime(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const emptyForm = () => ({
    product_rejection_id: 0,
    entry_date: new Date().toISOString().split('T')[0],
    machine_id: "",
    batch_no: "",
    product_id: "",
    collection_bin_no: "",
    tare_weight_kgs: "",
    gross_weight_kgs: "",
    net_weight_kgs: "",
    calculated_total_qty: "",
    remarks: "",
    status: "E" as 'E' | 'C',
});

export default function ProductionRejectedPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRejection, setSelectedRejection] = useState<ProductionRejected | null>(null);
    const [rejections, setRejections] = useState<ProductionRejected[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [formData, setFormData] = useState(emptyForm());
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: ProductionRejected } | null>(null);
    const [isGeneratingId, setIsGeneratingId] = useState(false);

    // Master data
    const [machineStatuses, setMachineStatuses] = useState<MachineStatus[]>([]);
    const [collectionBins, setCollectionBins] = useState<CollectionBin[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Derived from machine selection
    const [selectedBin, setSelectedBin] = useState<CollectionBin | null>(null);
    const [weightPerPiece, setWeightPerPiece] = useState<number>(0);

    // ── Load master data ────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const [ms, bins, prods] = await Promise.all([
                    machineStatusAPI.getAll(),
                    collectionBinAPI.getAll(),
                    productAPI.getAll(),
                ]);
                setMachineStatuses(ms);
                setCollectionBins(bins.filter((b: CollectionBin) => b.active));
                setProducts(prods);
            } catch (e) {
                console.error("Failed to load master data", e);
            }
        };
        load();
    }, []);

    // ── Load rejections ─────────────────────────────────────────────────────────
    const loadRejections = useCallback(async () => {
        try {
            setLoading(true);
            const data = await productionRejectedAPI.getAll();
            setRejections(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load rejections", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadRejections(); }, [loadRejections]);

    // ── Generate rejection ID (YY + 5-digit seq) ───────────────────────────────
    const generateNewRejectionId = async () => {
        setIsGeneratingId(true);
        try {
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const last = await productionRejectedAPI.getLastByYear(parseInt(currentYear));
            let seq = 1;
            if (last?.product_rejection_id) {
                seq = parseInt(last.product_rejection_id.toString().slice(-5)) + 1;
            }
            const newId = parseInt(`${currentYear}${String(seq).padStart(5, '0')}`);
            setFormData(prev => ({ ...prev, product_rejection_id: newId }));
        } catch {
            const yr = new Date().getFullYear().toString().slice(-2);
            setFormData(prev => ({ ...prev, product_rejection_id: parseInt(`${yr}00001`) }));
        } finally {
            setIsGeneratingId(false);
        }
    };

    // ── Reset when Add modal opens ──────────────────────────────────────────────
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData(emptyForm());
            setSelectedBin(null);
            setWeightPerPiece(0);
            generateNewRejectionId();
        }
    }, [isAddModalOpen]);

    // ── When machine_id changes: look up batch_no, product_id, validate status ──
    const handleMachineChange = async (machineId: string) => {
        setFormData(prev => ({ ...prev, machine_id: machineId, batch_no: "", product_id: "", collection_bin_no: "", tare_weight_kgs: "", gross_weight_kgs: "", net_weight_kgs: "", calculated_total_qty: "" }));
        setSelectedBin(null);
        setWeightPerPiece(0);

        if (!machineId) return;

        const ms = machineStatuses.find(m => m.machine_id === machineId.toUpperCase());
        if (!ms) {
            toast({ title: "Error", description: `Machine ${machineId} not found`, variant: "destructive" });
            return;
        }

        // Validate batch status must be 'W' (Waiting)
        try {
            const txns: any[] = await transactionAPI.getAll();
            const batch = txns.find((t: any) => t.batch_no === ms.batch_no);
            if (batch && batch.current_batch_status_id !== 'W') {
                toast({
                    title: "T401 — Invalid Batch Status",
                    description: `Batch ${ms.batch_no} status is '${batch.current_batch_status_id}'. Only batches with status 'W' (Waiting) are allowed.`,
                    variant: "destructive",
                });
                setFormData(prev => ({ ...prev, machine_id: "" }));
                return;
            }
        } catch { /* allow if transactions can't be fetched */ }

        const prod = products.find(p => p.product_id === ms.product_id);
        setWeightPerPiece(prod?.weight_per_piece || 0);
        setFormData(prev => ({ ...prev, machine_id: machineId.toUpperCase(), batch_no: ms.batch_no, product_id: ms.product_id }));
    };

    // ── When collection bin changes: fill tare, recalc ──────────────────────────
    const handleBinChange = (binId: string) => {
        const bin = collectionBins.find(b => b.bin_id === binId) || null;
        setSelectedBin(bin);
        setFormData(prev => ({
            ...prev,
            collection_bin_no: binId,
            tare_weight_kgs: bin?.tare_weight_kg?.toString() || "",
        }));
    };

    // ── Auto-calc net weight and total qty ─────────────────────────────────────
    useEffect(() => {
        const tare = parseFloat(formData.tare_weight_kgs) || 0;
        const gross = parseFloat(formData.gross_weight_kgs) || 0;

        if (gross > 0 && tare > 0) {
            const net = gross - tare;
            const totalQty = weightPerPiece > 0 ? Math.floor((net * 1000) / weightPerPiece) : 0;
            setFormData(prev => ({
                ...prev,
                net_weight_kgs: net.toFixed(3),
                calculated_total_qty: totalQty > 0 ? totalQty.toString() : "",
            }));
        } else {
            setFormData(prev => ({ ...prev, net_weight_kgs: "", calculated_total_qty: "" }));
        }
    }, [formData.tare_weight_kgs, formData.gross_weight_kgs, weightPerPiece]);

    // ── Gross weight validation ────────────────────────────────────────────────
    const validateGrossWeight = (val: string): string | null => {
        const gross = parseFloat(val);
        const tare = parseFloat(formData.tare_weight_kgs) || 0;
        if (gross <= tare) return `Gross weight must be > tare weight (${tare} kg)`;
        if (selectedBin?.gross_capacity_kg && gross > selectedBin.gross_capacity_kg)
            return `Gross weight exceeds bin capacity (${selectedBin.gross_capacity_kg} kg)`;
        return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ── Save new record ────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;

        // Validate remarks
        if (!formData.remarks?.trim()) {
            toast({ title: "Validation Error", description: "Remarks is required", variant: "destructive" });
            return;
        }

        // Validate gross weight
        if (formData.gross_weight_kgs) {
            const err = validateGrossWeight(formData.gross_weight_kgs);
            if (err) { toast({ title: "Validation Error", description: err, variant: "destructive" }); return; }
        }

        isSubmittingRef.current = true;
        try {
            await productionRejectedAPI.create({
                product_rejection_id: formData.product_rejection_id,
                entry_date: new Date(formData.entry_date),
                machine_id: formData.machine_id || null,
                batch_no: formData.batch_no,
                product_id: formData.product_id,
                collection_bin_no: formData.collection_bin_no,
                tare_weight_kgs: formData.tare_weight_kgs ? parseFloat(formData.tare_weight_kgs) : undefined,
                gross_weight_kgs: formData.gross_weight_kgs ? parseFloat(formData.gross_weight_kgs) : undefined,
                net_weight_kgs: formData.net_weight_kgs ? parseFloat(formData.net_weight_kgs) : undefined,
                calculated_total_qty: formData.calculated_total_qty ? parseInt(formData.calculated_total_qty) : undefined,
                remarks: formData.remarks,
                status: "E",
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            if (formData.net_weight_kgs && formData.batch_no) {
                const newNet = parseFloat(formData.net_weight_kgs) || 0;
                const txn = await transactionAPI.getById(formData.batch_no);
                const newTotal = (txn?.total_rejected_qty_kg || 0) + newNet;
                await transactionAPI.patch(formData.batch_no, { total_rejected_qty_kg: newTotal });
            }
            toast({ title: "Success", description: "Production rejection recorded successfully" });
            setIsAddModalOpen(false);
            loadRejections();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create rejection record", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const handleEdit = (rejection: ProductionRejected) => {
        setSelectedRejection(rejection);
        const prod = products.find(p => p.product_id === rejection.product_id);
        setWeightPerPiece(prod?.weight_per_piece || 0);
        const bin = collectionBins.find(b => b.bin_id === rejection.collection_bin_no) || null;
        setSelectedBin(bin);
        setFormData({
            product_rejection_id: rejection.product_rejection_id,
            entry_date: formatDate(rejection.entry_date),
            machine_id: rejection.machine_id,
            batch_no: rejection.batch_no,
            product_id: rejection.product_id,
            collection_bin_no: rejection.collection_bin_no,
            tare_weight_kgs: rejection.tare_weight_kgs?.toString() || "",
            gross_weight_kgs: rejection.gross_weight_kgs?.toString() || "",
            net_weight_kgs: rejection.net_weight_kgs?.toString() || "",
            calculated_total_qty: rejection.calculated_total_qty?.toString() || "",
            remarks: rejection.remarks || "",
            status: rejection.status,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current || !selectedRejection) return;

        if (!formData.remarks?.trim()) {
            toast({ title: "Validation Error", description: "Remarks is required", variant: "destructive" });
            return;
        }

        if (formData.gross_weight_kgs) {
            const err = validateGrossWeight(formData.gross_weight_kgs);
            if (err) { toast({ title: "Validation Error", description: err, variant: "destructive" }); return; }
        }

        isSubmittingRef.current = true;
        const previousData = { ...selectedRejection };
        try {
            await productionRejectedAPI.update(selectedRejection._id!, {
                entry_date: new Date(formData.entry_date),
                machine_id: formData.machine_id || null,
                batch_no: formData.batch_no,
                product_id: formData.product_id,
                collection_bin_no: formData.collection_bin_no,
                tare_weight_kgs: formData.tare_weight_kgs ? parseFloat(formData.tare_weight_kgs) : undefined,
                gross_weight_kgs: formData.gross_weight_kgs ? parseFloat(formData.gross_weight_kgs) : undefined,
                net_weight_kgs: formData.net_weight_kgs ? parseFloat(formData.net_weight_kgs) : undefined,
                calculated_total_qty: formData.calculated_total_qty ? parseInt(formData.calculated_total_qty) : undefined,
                remarks: formData.remarks,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            if (formData.batch_no) {
                const oldNet = selectedRejection.net_weight_kgs || 0;
                const newNet = formData.net_weight_kgs ? parseFloat(formData.net_weight_kgs) || 0 : 0;
                const delta = newNet - oldNet;
                if (delta !== 0) {
                    const txn = await transactionAPI.getById(formData.batch_no);
                    const newTotal = (txn?.total_rejected_qty_kg || 0) + delta;
                    await transactionAPI.patch(formData.batch_no, { total_rejected_qty_kg: newTotal });
                }
            }
            setLastAction({ type: 'edit', data: previousData });
            toast({
                title: "Success", description: "Rejection record updated successfully",
                action: <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>,
            });
            setIsEditModalOpen(false);
            setSelectedRejection(null);
            loadRejections();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update rejection record", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        try {
            await productionRejectedAPI.update(lastAction.data._id!, lastAction.data);
            toast({ title: "Undone", description: "Changes have been reverted" });
            setLastAction(null);
            loadRejections();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to undo", variant: "destructive" });
        }
    };

    const handleView = (rejection: ProductionRejected) => {
        setSelectedRejection(rejection);
        setIsViewModalOpen(true);
    };

    // ── Pagination / filter ────────────────────────────────────────────────────
    const filteredRejections = rejections.filter(item => {
        const matchesSearch =
            item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.machine_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_rejection_id?.toString().includes(searchQuery);
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredRejections.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedRejections = filteredRejections.slice(startIndex, startIndex + rowsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, rowsPerPage]);

    // ── Reusable form fields (shared between Add and Edit modals) ──────────────
    const renderFormFields = (isEdit = false) => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Card 1: Entry Info */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">i</span>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Entry Information</h2>
                </div>

                {/* Rejection ID */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Rejection ID</label>
                    <div className="relative">
                        <input type="text" value={isGeneratingId ? "Generating..." : formData.product_rejection_id || ""} readOnly
                            className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed" />
                    </div>
                </div>

                {/* Entry Date */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Entry Date</label>
                    <input type="text" value={formData.entry_date} readOnly
                        className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                </div>

                {/* Status */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Status</label>
                    <div className="bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500">
                        E — Entry
                    </div>
                </div>

                {/* Remarks */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Remarks <span className="text-red-500">*</span></label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange}
                        placeholder="Enter remarks..." maxLength={100} required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm min-h-[72px] resize-none outline-none focus:ring-2 focus:ring-blue-100" />
                    {!formData.remarks?.trim() && <p className="text-red-500 text-xs mt-1">Remarks is required</p>}
                </div>
            </div>

            {/* Card 2: Machine & Batch */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-500">⚙️</span>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Machine & Batch</h2>
                </div>

                {/* Machine ID — button selection */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Machine ID <span className="text-slate-300">(optional)</span></label>
                    <select value={formData.machine_id} onChange={e => handleMachineChange(e.target.value)}
                        disabled={isEdit}
                        className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${isEdit ? 'bg-[#f1f5f9] text-slate-400 cursor-not-allowed' : 'bg-white'}`}>
                        <option value="">— No Machine —</option>
                        {machineStatuses.map(m => (
                            <option key={m.machine_id} value={m.machine_id}>{m.machine_id}</option>
                        ))}
                    </select>
                </div>

                {/* Batch No — display only from machine */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Batch No</label>
                    <input type="text" value={formData.batch_no} readOnly
                        className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                        placeholder="From machine" />
                </div>

                {/* Product ID — display only from machine */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Product ID</label>
                    <input type="text" value={formData.product_id} readOnly
                        className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                        placeholder="From machine" />
                </div>
            </div>

            {/* Card 3: Weight & Qty */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-500">⚖️</span>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Weight & Collection</h2>
                </div>

                {/* Collection Bin */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Collection Bin <span className="text-red-500">*</span></label>
                    <select value={formData.collection_bin_no} onChange={e => handleBinChange(e.target.value)} required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="">Select Bin</option>
                        {collectionBins.filter(b => b.bin_type === 'N' && b.active).map(b => (
                            <option key={b.bin_id} value={b.bin_id}>{b.bin_short_name} ({b.bin_id})</option>
                        ))}
                    </select>
                </div>

                {/* Tare Weight — display only from bin */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Tare Weight (KG)</label>
                    <input type="text" value={formData.tare_weight_kgs || ""} readOnly
                        className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                        placeholder="From bin" />
                </div>

                {/* Gross Weight — entry */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Gross Weight (KG) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.001" name="gross_weight_kgs" value={formData.gross_weight_kgs}
                        onChange={handleInputChange} placeholder="0.000" required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                    {formData.gross_weight_kgs && (() => {
                        const err = validateGrossWeight(formData.gross_weight_kgs);
                        return err ? <p className="text-red-500 text-xs mt-1">{err}</p> : null;
                    })()}
                </div>

                {/* Net Weight — auto calc */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Net Weight (KG)</label>
                    <input type="text" value={formData.net_weight_kgs || ""} readOnly
                        className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                        placeholder="Auto-calculated" />
                </div>

                {/* Calculated Total Qty — auto calc */}
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Calculated Total Qty</label>
                    <input type="text" value={formData.calculated_total_qty || ""} readOnly
                        className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                        placeholder="Auto-calculated" />
                    {weightPerPiece === 0 && formData.product_id && (
                        <p className="text-amber-500 text-xs mt-1">weight_per_piece not set for this product — qty will be 0</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Production Rejection</h1>
                                <p className="text-muted-foreground">Track and manage rejected production items</p>
                            </div>
                            <Button onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                                <Plus className="w-5 h-5" /> Add Rejection Record
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search / Filter */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input type="text" placeholder="Search by Rejection ID, Batch No, Product ID, or Machine ID..."
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full" />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredRejections.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + rowsPerPage, filteredRejections.length)} OF {filteredRejections.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="end">
                                        <div className="p-4 border-b"><h3 className="font-semibold text-sm">Filters</h3></div>
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Status</Label>
                                                {[["all", "All"], ["E", "Entry"], ["C", "Closed"]].map(([val, lbl]) => (
                                                    <div key={val} className="flex items-center space-x-2">
                                                        <input type="radio" id={`s-${val}`} name="sf" checked={filterStatus === val}
                                                            onChange={() => setFilterStatus(val)} className="h-4 w-4 text-blue-600" />
                                                        <Label htmlFor={`s-${val}`} className="text-sm font-normal cursor-pointer">{lbl}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-2 pt-3 border-t">
                                                <Label className="text-sm font-semibold">Rows per page</Label>
                                                <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-md text-sm">
                                                    {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t">
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => setFilterStatus("all")}>Clear Filters</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            {["Rejection ID", "Entry Date", "Machine ID", "Batch No", "Product", "Gross Wt (KG)", "Tare Wt (KG)", "Net Wt (KG)", "Total Qty", "Remarks", "Status", "Last Modified", "Last Modified By", "Actions"].map(h => (
                                                <th key={h} className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={14} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
                                        ) : paginatedRejections.length === 0 ? (
                                            <tr><td colSpan={14} className="px-6 py-8 text-center text-muted-foreground">No rejection records found</td></tr>
                                        ) : paginatedRejections.map((item, index) => {
                                            const StatusIcon = statusConfig[item.status].icon;
                                            const prod = products.find(p => p.product_id === item.product_id);
                                            return (
                                                <motion.tr key={item._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleView(item)}>
                                                    <td className="px-6 py-4 align-middle">
                                                        <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{item.product_rejection_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm align-middle">{formatDate(item.entry_date)}</td>
                                                    <td className="px-6 py-4 text-sm align-middle">
                                                        <span className="inline-flex px-2 py-1 rounded-md bg-purple-50 text-purple-700 font-mono text-xs">{item.machine_id || "—"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-mono align-middle">{item.batch_no}</td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <p className="text-sm font-medium text-foreground">{prod?.product_name || "—"}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{item.product_id}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right align-middle">{item.gross_weight_kgs?.toFixed(3) || "—"}</td>
                                                    <td className="px-6 py-4 text-sm text-right align-middle">{item.tare_weight_kgs?.toFixed(3) || "—"}</td>
                                                    <td className="px-6 py-4 text-sm text-right align-middle">{item.net_weight_kgs?.toFixed(3) || "—"}</td>
                                                    <td className="px-6 py-4 text-sm text-right align-middle">{item.calculated_total_qty?.toLocaleString() || "—"}</td>
                                                    <td className="px-6 py-4 text-sm align-middle max-w-[160px] truncate" title={item.remarks || ""}>{item.remarks || "—"}</td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig[item.status].color}`}>
                                                            <StatusIcon className="w-3 h-3" />{statusConfig[item.status].label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm align-middle">{formatDateTime(item.last_modified_date_time)}</td>
                                                    <td className="px-6 py-4 text-sm align-middle">{item.last_modified_user_id || "—"}</td>
                                                    <td className="px-6 py-4 text-center align-middle" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-2">
                                                            {item.status === 'E' && (
                                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}
                                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Edit">
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE {currentPage} OF {totalPages || 1}</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* ── Add Modal ── */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                            <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
                                {/* Header */}
                                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#3b82f6] p-2 rounded-lg text-white shadow-lg">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-[#1e293b]">Add Rejection Record</h1>
                                            <p className="text-sm text-slate-400 font-medium">Manufacturing Execution System</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => setIsAddModalOpen(false)}
                                            className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2">Cancel</button>
                                        <button type="button" onClick={handleSubmit} disabled={isSubmittingRef.current}
                                            className="bg-[#3b82f6] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all disabled:opacity-50">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            {isSubmittingRef.current ? 'Saving...' : 'Save Record'}
                                        </button>
                                    </div>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderFormFields(false)}
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Edit Modal ── */}
            <AnimatePresence>
                {isEditModalOpen && selectedRejection && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                            <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
                                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#3b82f6] p-2 rounded-lg text-white shadow-lg">
                                            <Pencil className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-[#1e293b]">Edit Rejection Record</h1>
                                            <p className="text-sm text-slate-400 font-medium">#{selectedRejection.product_rejection_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)}
                                            className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2">Cancel</button>
                                        <button type="button" onClick={handleEditSubmit} disabled={isSubmittingRef.current}
                                            className="bg-[#3b82f6] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all disabled:opacity-50">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            {isSubmittingRef.current ? 'Saving...' : 'Update Record'}
                                        </button>
                                    </div>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderFormFields(true)}
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── View Modal ── */}
            <AnimatePresence>
                {isViewModalOpen && selectedRejection && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsViewModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className={`${selectedRejection.status === 'C' ? 'bg-green-600' : 'bg-blue-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">Rejection Details — #{selectedRejection.product_rejection_id}</h2>
                                    <button onClick={() => setIsViewModalOpen(false)} className="hover:opacity-80 p-1">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            ["Rejection ID", selectedRejection.product_rejection_id],
                                            ["Entry Date", formatDate(selectedRejection.entry_date)],
                                            ["Machine ID", selectedRejection.machine_id || "—"],
                                            ["Batch No", selectedRejection.batch_no],
                                            ["Product ID", selectedRejection.product_id],
                                            ["Collection Bin", selectedRejection.collection_bin_no],
                                            ["Tare Weight (KG)", selectedRejection.tare_weight_kgs?.toFixed(3) || "—"],
                                            ["Gross Weight (KG)", selectedRejection.gross_weight_kgs?.toFixed(3) || "—"],
                                            ["Net Weight (KG)", selectedRejection.net_weight_kgs?.toFixed(3) || "—"],
                                            ["Calculated Total Qty", selectedRejection.calculated_total_qty?.toLocaleString() || "—"],
                                        ].map(([label, val]) => (
                                            <div key={String(label)} className="bg-gray-50 p-3 rounded-lg">
                                                <label className="text-xs text-muted-foreground">{label}</label>
                                                <p className="text-sm font-semibold mt-0.5">{String(val)}</p>
                                            </div>
                                        ))}
                                        <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                                            <label className="text-xs text-muted-foreground">Remarks</label>
                                            <p className="text-sm mt-0.5">{selectedRejection.remarks || "—"}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <label className="text-xs text-muted-foreground">Status</label>
                                            <div className="mt-1">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig[selectedRejection.status].color}`}>
                                                    {statusConfig[selectedRejection.status].label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <label className="text-xs text-muted-foreground">Last Modified</label>
                                            <p className="text-sm mt-0.5">{formatDateTime(selectedRejection.last_modified_date_time)}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                                        {selectedRejection.status === 'E' && (
                                            <Button onClick={() => { setIsViewModalOpen(false); handleEdit(selectedRejection); }}
                                                className="bg-blue-600 hover:bg-blue-700">
                                                <Pencil className="w-4 h-4 mr-2" /> Edit
                                            </Button>
                                        )}
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
