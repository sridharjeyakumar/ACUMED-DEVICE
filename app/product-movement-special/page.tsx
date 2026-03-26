'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pencil, ChevronLeft, ChevronRight, X, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    productMovementAPI,
    productStockAPI,
    productStatusAPI,
    cartonCapacityAPI,
    packSizeAPI,
    transactionAPI,
    productStatusTransitionAPI,
} from "@/services/api";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ProductMovementRecord {
    _id: string;
    prod_movement_id: number;
    movement_date: string;
    batch_no: string;
    product_id: string;
    pack_size_id: string;
    to_prod_status_id: string;
    from_prod_status_id: string;
    carton_type_id: string;
    carton_capacity_id: string;
    no_of_cartons: number;
    no_of_packs: number;
    no_of_sachets: number;
    remarks: string;
    entered_by_user_id: string;
    entered_date_time: string;
    approval_remarks: string;
    approved_by_user_id: string;
    approved_date_time: string;
    status: 'E' | 'A' | 'X';
    movement_type?: 'NORMAL' | 'SPECIAL_A' | 'SPECIAL_R';
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    E: { label: "Entered (Pending Approval)", color: "bg-yellow-100 text-yellow-800" },
    A: { label: "Active (No Approval Required)", color: "bg-green-100 text-green-800" },
    X: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm2 = {
    movement_date:       today(),
    adjustment_type:     "A" as "A" | "R",
    batch_no:            "",
    product_id:          "",
    pack_size_id:        "",
    to_prod_status_id:   "",
    from_prod_status_id: "",
    carton_type_id:      "",
    carton_capacity_id:  "",
    no_of_cartons:       "",
    no_of_packs:         "",
    no_of_sachets:       "",
    remarks:             "",
    entered_by_user_id:  "ADMIN",
    status:              "E" as "E" | "A" | "X",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(date: string | Date): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    const hh    = String(d.getHours()).padStart(2, '0');
    const mm    = String(d.getMinutes()).padStart(2, '0');
    const ss    = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hh}:${mm}:${ss}`;
}

function formatMovementId(id: number): string {
    if (!id) return "-";
    const yy  = Math.floor(id / 100000);
    const sno = id % 100000;
    return `${yy}-${String(sno).padStart(5, '0')}`;
}

function MovementTypeBadge({ type }: { type?: string }) {
    if (type === 'SPECIAL_A')
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Special Add</span>;
    if (type === 'SPECIAL_R')
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Special Reduce</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Normal</span>;
}

const ROWS_PER_PAGE = 10;

// ── Component ────────────────────────────────────────────────────────────────

export default function ProductMovementSpecialPage() {

    // ── list state ────────────────────────────────────────────────────────────
    const [allRecords, setAllRecords]         = useState<ProductMovementRecord[]>([]);
    const [loading, setLoading]               = useState(true);
    const [saving, setSaving]                 = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [searchQuery, setSearchQuery]       = useState("");
    const [currentPage, setCurrentPage]       = useState(1);

    // ── approval modal state ──────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]             = useState(false);
    const [selectedRecord, setSelectedRecord]       = useState<ProductMovementRecord | null>(null);
    const [approvalRemarks, setApprovalRemarks]     = useState("");
    const [approvalError, setApprovalError]         = useState<string | null>(null);

    // ── add movement (special) modal state ───────────────────────────────────
    const [isAdd2ModalOpen, setIsAdd2ModalOpen]     = useState(false);
    const [form2Data, setForm2Data]                 = useState(emptyForm2);
    const [form2Loading, setForm2Loading]           = useState(false);
    const [form2Error, setForm2Error]               = useState<string | null>(null);
    const [saving2, setSaving2]                     = useState(false);
    const [adj2BatchOptions, setAdj2BatchOptions]   = useState<any[]>([]);
    const [adj2PackSizeOptions, setAdj2PackSizeOptions] = useState<any[]>([]);
    const [adj2ToStatusOptions, setAdj2ToStatusOptions] = useState<any[]>([]);
    const [adj2CartonCapInfo, setAdj2CartonCapInfo] = useState<any>(null);
    const [adj2PackSizeInfo, setAdj2PackSizeInfo]   = useState<any>(null);
    const [adj2MaxCartons, setAdj2MaxCartons]       = useState<number>(9999);

    // ── fetch records ─────────────────────────────────────────────────────────

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productMovementAPI.getAll({ status: 'E' });
            setAllRecords(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    // ── filter: only SPECIAL_A / SPECIAL_R ───────────────────────────────────

    const records = allRecords.filter(
        r => r.movement_type === 'SPECIAL_A' || r.movement_type === 'SPECIAL_R'
    );

    // ── search + pagination ───────────────────────────────────────────────────

    const filtered = records.filter(r =>
        r.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.prod_movement_id?.toString().includes(searchQuery)
    );

    const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const paginated  = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // ── next movement ID ──────────────────────────────────────────────────────

    const getNextId = (): number => {
        const yy     = new Date().getFullYear() % 100;
        const prefix = yy * 100000;
        const yearRecords = allRecords.filter(r =>
            Math.floor(r.prod_movement_id / 100000) === yy
        );
        if (yearRecords.length === 0) return prefix + 1;
        return Math.max(...yearRecords.map(r => r.prod_movement_id)) + 1;
    };

    // ── update stock helper ───────────────────────────────────────────────────

    const updateStock = async (mv: ProductMovementRecord) => {
        await Promise.all([
            productStockAPI.adjust(mv.batch_no, {
                pack_size_id:        mv.pack_size_id,
                product_status_id:   mv.to_prod_status_id,
                packs_delta:         mv.no_of_packs,
                sachets_delta:       mv.no_of_sachets,
                product_id:          mv.product_id,
                carton_type_id:      mv.carton_type_id,
                total_no_of_cartons: mv.no_of_cartons,
            }),
            productStockAPI.adjust(mv.batch_no, {
                pack_size_id:      mv.pack_size_id,
                product_status_id: mv.from_prod_status_id,
                packs_delta:       -mv.no_of_packs,
                sachets_delta:     -mv.no_of_sachets,
                product_id:        mv.product_id,
            }),
        ]);
    };

    // ── approval modal handlers ───────────────────────────────────────────────

    const handleOpenApproval = (record: ProductMovementRecord) => {
        setSelectedRecord(record);
        setApprovalRemarks("");
        setApprovalError(null);
        setIsModalOpen(true);
    };

    const closeApprovalModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
        setApprovalRemarks("");
        setApprovalError(null);
    };

    const handleApprove = async () => {
        if (!selectedRecord) return;
        if (!approvalRemarks.trim()) { setApprovalError("Approval remarks are required."); return; }
        setSaving(true);
        setApprovalError(null);
        try {
            await productMovementAPI.update(selectedRecord.prod_movement_id, {
                status:              'A',
                approval_remarks:    approvalRemarks.trim(),
                approved_by_user_id: 'ADMIN',
                approved_date_time:  new Date().toISOString(),
            });
            await updateStock(selectedRecord);
            closeApprovalModal();
            fetchRecords();
        } catch (err: any) {
            setApprovalError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelMovement = async () => {
        if (!selectedRecord) return;
        setSaving(true);
        setApprovalError(null);
        try {
            await productMovementAPI.update(selectedRecord.prod_movement_id, { status: 'X' });
            closeApprovalModal();
            fetchRecords();
        } catch (err: any) {
            setApprovalError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Movement2: open modal ─────────────────────────────────────────────────

    const handleOpenAdd2 = async () => {
        setForm2Data({ ...emptyForm2, movement_date: today() });
        setForm2Error(null);
        setAdj2BatchOptions([]);
        setAdj2PackSizeOptions([]);
        setAdj2ToStatusOptions([]);
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);
        setAdj2MaxCartons(9999);
        setForm2Loading(true);
        try {
            const [batches, toStatuses] = await Promise.all([
                transactionAPI.getAll(),
                productStatusAPI.getAll({ movementType: 'N' }),
            ]);
            setAdj2BatchOptions(
                (batches as any[]).filter(
                    (b: any) => b.current_batch_status_id === 'W' || b.current_batch_status_id === 'C'
                )
            );
            setAdj2ToStatusOptions(toStatuses as any[]);
        } finally {
            setForm2Loading(false);
        }
        setIsAdd2ModalOpen(true);
    };

    // ── Movement2: adjustment type changed ────────────────────────────────────

    const handleAdj2TypeChange = async (adjType: "A" | "R") => {
        setForm2Data({ ...emptyForm2, movement_date: form2Data.movement_date, adjustment_type: adjType });
        setAdj2BatchOptions([]);
        setAdj2PackSizeOptions([]);
        setAdj2ToStatusOptions([]);
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);
        setAdj2MaxCartons(9999);
        setForm2Error(null);
        setForm2Loading(true);
        try {
            if (adjType === 'A') {
                const [batches, toStatuses] = await Promise.all([
                    transactionAPI.getAll(),
                    productStatusAPI.getAll({ movementType: 'N' }),
                ]);
                setAdj2BatchOptions(
                    (batches as any[]).filter(
                        (b: any) => b.current_batch_status_id === 'W' || b.current_batch_status_id === 'C'
                    )
                );
                setAdj2ToStatusOptions(toStatuses as any[]);
            } else {
                const [stocks, toStatuses] = await Promise.all([
                    productStockAPI.getAll(),
                    productStatusAPI.getAll({ movementType: 'S' }),
                ]);
                setAdj2BatchOptions((stocks as any[]).filter((s: any) => s.total_no_of_packs > 0));
                setAdj2ToStatusOptions(toStatuses as any[]);
            }
        } finally {
            setForm2Loading(false);
        }
    };

    // ── Movement2: batch selected ─────────────────────────────────────────────

    const handleAdj2BatchSelect = async (batchNo: string) => {
        const adjType = form2Data.adjustment_type;
        const batch   = adj2BatchOptions.find((b: any) => b.batch_no === batchNo);
        if (!batch) return;

        setForm2Data(prev => ({
            ...prev,
            batch_no:            batchNo,
            product_id:          batch.product_id,
            pack_size_id:        "",
            to_prod_status_id:   "",
            from_prod_status_id: "",
            carton_type_id:      "",
            carton_capacity_id:  "",
            no_of_cartons:       "",
            no_of_packs:         "",
            no_of_sachets:       "",
        }));
        setAdj2PackSizeOptions([]);
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);

        setForm2Loading(true);
        try {
            if (adjType === 'A') {
                const caps = await cartonCapacityAPI.getAll({ productId: batch.product_id, active: true });
                const uniquePackSizes = Array.from(
                    new Map((caps as any[]).map((c: any) => [c.pack_size_id, c])).values()
                );
                setAdj2PackSizeOptions(uniquePackSizes);
            } else {
                const stocks = await productStockAPI.getAll({ batchNo, productId: batch.product_id } as any);
                const validStocks = (stocks as any[]).filter((s: any) => s.total_no_of_packs > 0);
                setAdj2PackSizeOptions(validStocks.map((s: any) => ({ pack_size_id: s.pack_size_id })));
                if (validStocks.length === 1) {
                    await handleAdj2PackSizeSelect(validStocks[0].pack_size_id, batch.product_id, validStocks[0]);
                }
            }
        } finally {
            setForm2Loading(false);
        }
    };

    // ── Movement2: pack size selected ─────────────────────────────────────────

    const handleAdj2PackSizeSelect = async (packSizeId: string, _productIdArg?: string, stockArg?: any) => {
        const adjType = form2Data.adjustment_type;

        setForm2Data(prev => ({
            ...prev,
            pack_size_id:        packSizeId,
            to_prod_status_id:   "",
            from_prod_status_id: "",
            carton_type_id:      "",
            carton_capacity_id:  "",
            no_of_cartons:       "",
            no_of_packs:         "",
            no_of_sachets:       "",
        }));
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);

        if (adjType === 'R') {
            const stock = stockArg ?? (adj2BatchOptions as any[]).find(
                (s: any) => s.batch_no === form2Data.batch_no && s.pack_size_id === packSizeId
            );
            if (stock) {
                setAdj2MaxCartons(stock.total_no_of_packs);
                setForm2Data(prev => ({
                    ...prev,
                    pack_size_id:        packSizeId,
                    from_prod_status_id: stock.product_status_id,
                    no_of_cartons:       String(stock.total_no_of_packs),
                }));
            }
        }
    };

    // ── Movement2: to status selected ─────────────────────────────────────────

    const handleAdj2ToStatusSelect = async (toStatusId: string) => {
        const adjType    = form2Data.adjustment_type;
        const productId  = form2Data.product_id;
        const packSizeId = form2Data.pack_size_id;

        const toStatusRecord = adj2ToStatusOptions.find((s: any) => s.prod_status_id === toStatusId);
        const cartonTypeId   = toStatusRecord?.carton_type_id || "";

        setForm2Data(prev => ({
            ...prev,
            to_prod_status_id:  toStatusId,
            carton_type_id:     cartonTypeId,
            carton_capacity_id: "",
            no_of_packs:        "",
            no_of_sachets:      "",
        }));

        if (!productId || !packSizeId) return;

        setForm2Loading(true);
        try {
            const allTransitions = await productStatusTransitionAPI.getAll();
            const matchedTrans   = (allTransitions as any[]).find(
                (t: any) => t.product_status_id === toStatusId
            );
            const approvalRequired = matchedTrans?.approval_required;
            const newStatus: 'E' | 'A' = approvalRequired === 'Y' ? 'E' : 'A';

            if (adjType === 'A' && matchedTrans) {
                setForm2Data(prev => ({
                    ...prev,
                    from_prod_status_id: matchedTrans.from_product_status_id,
                    status: newStatus,
                }));
            } else {
                setForm2Data(prev => ({ ...prev, status: newStatus }));
            }

            const [caps, ps] = await Promise.all([
                cartonCapacityAPI.getAll({ productId, packSizeId, active: true }),
                packSizeAPI.getById(packSizeId),
            ]);
            const cap: any = (caps as any[])[0] || null;
            setAdj2CartonCapInfo(cap);
            setAdj2PackSizeInfo(ps || null);
            setForm2Data(prev => ({ ...prev, carton_capacity_id: cap?.carton_capacity_id || "" }));

            const n = Number(form2Data.no_of_cartons) || 0;
            if (cap && ps && n > 0) {
                const noPacks   = n * cap.packs_per_carton;
                const noSachets = noPacks * (ps as any).qty_per_carton;
                setForm2Data(prev => ({
                    ...prev,
                    no_of_packs:   String(noPacks),
                    no_of_sachets: String(noSachets),
                }));
            }
        } finally {
            setForm2Loading(false);
        }
    };

    // ── Movement2: cartons changed ────────────────────────────────────────────

    const handleAdj2CartonsChange = (value: string) => {
        const n = Number(value) || 0;
        let noPacks = "", noSachets = "";
        if (adj2CartonCapInfo && adj2PackSizeInfo) {
            const p = n * adj2CartonCapInfo.packs_per_carton;
            noPacks   = String(p);
            noSachets = String(p * adj2PackSizeInfo.qty_per_carton);
        }
        setForm2Data(prev => ({ ...prev, no_of_cartons: value, no_of_packs: noPacks, no_of_sachets: noSachets }));
    };

    // ── Movement2: submit ─────────────────────────────────────────────────────

    const handleSubmit2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving2(true);
        setForm2Error(null);
        try {
            const payload2 = {
                prod_movement_id:    getNextId(),
                movement_date:       form2Data.movement_date,
                batch_no:            form2Data.batch_no,
                product_id:          form2Data.product_id,
                pack_size_id:        form2Data.pack_size_id,
                to_prod_status_id:   form2Data.to_prod_status_id,
                from_prod_status_id: form2Data.from_prod_status_id,
                carton_type_id:      form2Data.carton_type_id,
                carton_capacity_id:  form2Data.carton_capacity_id,
                no_of_cartons:       Number(form2Data.no_of_cartons) || 0,
                no_of_packs:         Number(form2Data.no_of_packs),
                no_of_sachets:       Number(form2Data.no_of_sachets),
                remarks:             form2Data.remarks,
                entered_by_user_id:  form2Data.entered_by_user_id,
                entered_date_time:   new Date().toISOString(),
                approval_remarks:    "",
                approved_by_user_id: "",
                approved_date_time:  null,
                status:              form2Data.status,
                movement_type:       `SPECIAL_${form2Data.adjustment_type}` as 'SPECIAL_A' | 'SPECIAL_R',
            };
            await productMovementAPI.create(payload2);
            if (form2Data.status === 'A') {
                await Promise.all([
                    productStockAPI.adjust(payload2.batch_no, {
                        pack_size_id:        payload2.pack_size_id,
                        product_status_id:   payload2.to_prod_status_id,
                        packs_delta:         payload2.no_of_packs,
                        sachets_delta:       payload2.no_of_sachets,
                        product_id:          payload2.product_id,
                        carton_type_id:      payload2.carton_type_id,
                        total_no_of_cartons: payload2.no_of_cartons,
                    }),
                    productStockAPI.adjust(payload2.batch_no, {
                        pack_size_id:      payload2.pack_size_id,
                        product_status_id: payload2.from_prod_status_id,
                        packs_delta:       -payload2.no_of_packs,
                        sachets_delta:     -payload2.no_of_sachets,
                        product_id:        payload2.product_id,
                    }),
                ]);
            }
            setIsAdd2ModalOpen(false);
            setForm2Data(emptyForm2);
            fetchRecords();
        } catch (err: any) {
            setForm2Error(err.message);
        } finally {
            setSaving2(false);
        }
    };

    // ── Movement2 Form ────────────────────────────────────────────────────────

    const Movement2Form = () => (
        <form onSubmit={handleSubmit2} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {form2Loading && (
                <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
            )}

            {/* Row 1: Movement ID + Movement Date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Movement ID</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm font-mono">{formatMovementId(getNextId())}</div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Movement Date <span className="text-red-500">*</span></label>
                    <Input type="date" value={form2Data.movement_date} onChange={e => setForm2Data(p => ({ ...p, movement_date: e.target.value }))} required />
                </div>
            </div>

            {/* Row 2: Adjustment Type */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Adjustment Type <span className="text-red-500">*</span></label>
                <select
                    value={form2Data.adjustment_type}
                    onChange={e => handleAdj2TypeChange(e.target.value as "A" | "R")}
                    disabled={form2Loading}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                    <option value="A">A – Add Stock</option>
                    <option value="R">R – Reduce Stock</option>
                </select>
            </div>

            {/* Row 3: Batch No + Product ID */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Batch No. <span className="text-red-500">*</span></label>
                    <select
                        value={form2Data.batch_no}
                        onChange={e => handleAdj2BatchSelect(e.target.value)}
                        required disabled={form2Loading || adj2BatchOptions.length === 0}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="">-- Select Batch --</option>
                        {adj2BatchOptions.map((b: any) => (
                            <option key={b.batch_no} value={b.batch_no}>
                                {b.batch_no}{b.total_no_of_packs != null ? ` (Packs: ${b.total_no_of_packs})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Product ID</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.product_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
            </div>

            {/* Row 4: Pack Size */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Pack Size <span className="text-red-500">*</span></label>
                {form2Data.adjustment_type === 'A' ? (
                    <select
                        value={form2Data.pack_size_id}
                        onChange={e => handleAdj2PackSizeSelect(e.target.value)}
                        required disabled={form2Loading || !form2Data.batch_no}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="">-- Select Pack Size --</option>
                        {adj2PackSizeOptions.map((p: any) => (
                            <option key={p.pack_size_id} value={p.pack_size_id}>{p.pack_size_id}</option>
                        ))}
                    </select>
                ) : (
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.pack_size_id || <span className="italic text-muted-foreground">Auto-filled from stock</span>}
                    </div>
                )}
            </div>

            {/* Row 5: To Status + From Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">To Status <span className="text-red-500">*</span></label>
                    <select
                        value={form2Data.to_prod_status_id}
                        onChange={e => handleAdj2ToStatusSelect(e.target.value)}
                        required disabled={form2Loading || !form2Data.pack_size_id}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="">-- Select --</option>
                        {adj2ToStatusOptions.map((s: any) => (
                            <option key={s.prod_status_id} value={s.prod_status_id}>
                                {s.prod_status_id} – {s.product_status}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">From Status</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.from_prod_status_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
            </div>

            {/* Row 6: Carton Type + Carton Capacity */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Carton Type</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.carton_type_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Carton Capacity</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.carton_capacity_id
                            ? `${form2Data.carton_capacity_id}${adj2CartonCapInfo?.packs_per_carton != null ? ` (${adj2CartonCapInfo.packs_per_carton} packs/carton)` : ''}`
                            : <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
            </div>

            {/* Row 7: No. of Cartons + No. of Packs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Cartons <span className="text-red-500">*</span></label>
                    <Input
                        type="number"
                        value={form2Data.no_of_cartons}
                        onChange={e => handleAdj2CartonsChange(e.target.value)}
                        min={1} max={adj2MaxCartons}
                        placeholder={`1 – ${adj2MaxCartons}`}
                        required
                        disabled={!form2Data.carton_capacity_id || form2Loading}
                    />
                    {adj2MaxCartons < 9999 && (
                        <p className="text-xs text-muted-foreground mt-1">Max: {adj2MaxCartons} (from stock)</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Packs</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.no_of_packs ? Number(form2Data.no_of_packs).toLocaleString() : <span className="italic text-muted-foreground">Auto-calculated</span>}
                    </div>
                </div>
            </div>

            {/* Row 8: No. of Sachets + Remarks */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Sachets</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.no_of_sachets ? Number(form2Data.no_of_sachets).toLocaleString() : <span className="italic text-muted-foreground">Auto-calculated</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Remarks <span className="text-red-500">*</span></label>
                    <Input value={form2Data.remarks} onChange={e => setForm2Data(p => ({ ...p, remarks: e.target.value }))} placeholder="Required" maxLength={100} required />
                </div>
            </div>

            {/* Row 9: Entered By + Entered Date Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Entered By</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">{form2Data.entered_by_user_id}</div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Entered Date &amp; Time</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">{formatDateTime(new Date())}</div>
                </div>
            </div>

            {/* Row 10: Status */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Status</label>
                <div className={`px-3 py-2 rounded-md border border-input text-sm font-medium inline-flex items-center gap-2 ${STATUS_LABELS[form2Data.status]?.color || ""}`}>
                    <span className="font-bold">{form2Data.status}</span> &ndash;
                    {STATUS_LABELS[form2Data.status]?.label}
                </div>
            </div>

            {form2Error && (
                <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">{form2Error}</p>
            )}

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsAdd2ModalOpen(false)} className="px-6" disabled={saving2}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                    disabled={saving2 || !form2Data.batch_no || !form2Data.to_prod_status_id || !form2Data.pack_size_id}
                >
                    {saving2 ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Movement
                </Button>
            </div>
        </form>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 md:mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                                    Product Movement (Special)
                                </h1>
                                <p className="text-sm md:text-base text-muted-foreground">
                                    Manage and approve pending special stock adjustment movements
                                </p>
                            </div>
                            <Button
                                onClick={handleOpenAdd2}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add Movement (Special)</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-4 md:mb-6"
                    >
                        <Card className="p-3 md:p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch No, Product ID, Movement ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 w-full text-sm"
                                    />
                                </div>
                                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                                    {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + ROWS_PER_PAGE, filtered.length)} of {filtered.length} pending
                                </span>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <p className="text-sm text-red-600">{error}</p>
                                    <Button variant="outline" size="sm" onClick={fetchRecords}>Retry</Button>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-100 border-b border-border">
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Movement ID</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Type</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Movement Date</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Batch No.</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Product ID</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Pack Size</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">From Status</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">To Status</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Carton Type</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Carton Cap.</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-right text-foreground whitespace-nowrap">Cartons</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-right text-foreground whitespace-nowrap">Packs</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-right text-foreground whitespace-nowrap">Sachets</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Entered By</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-left text-foreground whitespace-nowrap">Entered Date &amp; Time</th>
                                                    <th className="px-6 py-3 text-xs font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {paginated.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={17} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                            No pending special movements found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginated.map((record, index) => (
                                                        <motion.tr
                                                            key={record._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.04 }}
                                                            className="hover:bg-muted/30 transition-colors"
                                                        >
                                                            <td className="px-6 py-4 text-sm font-bold text-blue-600 font-mono whitespace-nowrap">
                                                                {formatMovementId(record.prod_movement_id)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <MovementTypeBadge type={record.movement_type} />
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                                                                {record.movement_date ? new Date(record.movement_date).toLocaleDateString() : "-"}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-foreground">{record.batch_no}</td>
                                                            <td className="px-6 py-4 text-sm font-bold text-foreground">{record.product_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.pack_size_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.from_prod_status_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.to_prod_status_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.carton_type_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.carton_capacity_id}</td>
                                                            <td className="px-6 py-4 text-sm text-right font-bold">{record.no_of_cartons?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-sm text-right font-bold">{record.no_of_packs?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-sm text-right font-bold">{record.no_of_sachets?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground max-w-[150px] truncate">{record.remarks || "—"}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.entered_by_user_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{formatDateTime(record.entered_date_time)}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenApproval(record)}
                                                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                    title="Approve / Cancel"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </motion.tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                        <span className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages || 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline" size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                            </Button>
                                            <Button
                                                variant="outline" size="sm"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage >= totalPages}
                                            >
                                                Next <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* ── Approval Modal ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isModalOpen && selectedRecord && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={closeApprovalModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">Approve / Cancel Movement</h2>
                                        <p className="text-amber-100 text-sm mt-0.5">
                                            {formatMovementId(selectedRecord.prod_movement_id)} — {selectedRecord.batch_no}
                                            {" "}
                                            <MovementTypeBadge type={selectedRecord.movement_type} />
                                        </p>
                                    </div>
                                    <button onClick={closeApprovalModal} className="text-white hover:bg-amber-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        {[
                                            ["Movement Date",  selectedRecord.movement_date?.slice(0, 10)],
                                            ["Batch No.",      selectedRecord.batch_no],
                                            ["Product ID",     selectedRecord.product_id],
                                            ["Pack Size",      selectedRecord.pack_size_id],
                                            ["From Status",    selectedRecord.from_prod_status_id],
                                            ["To Status",      selectedRecord.to_prod_status_id],
                                            ["Carton Type",    selectedRecord.carton_type_id],
                                            ["Carton Cap.",    selectedRecord.carton_capacity_id],
                                            ["No. of Cartons", selectedRecord.no_of_cartons],
                                            ["No. of Packs",   selectedRecord.no_of_packs?.toLocaleString()],
                                            ["No. of Sachets", selectedRecord.no_of_sachets?.toLocaleString()],
                                            ["Remarks",        selectedRecord.remarks],
                                            ["Entered By",     selectedRecord.entered_by_user_id],
                                            ["Entered At",     selectedRecord.entered_date_time ? formatDateTime(selectedRecord.entered_date_time) : ""],
                                        ].map(([label, value]) => (
                                            <div key={String(label)}>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                                                <div className="px-3 py-1.5 rounded border border-input bg-muted text-sm">{value || "—"}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <hr className="mb-4" />

                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                            Approval Remarks <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={approvalRemarks}
                                            onChange={e => setApprovalRemarks(e.target.value)}
                                            placeholder="Required before approving"
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Approved By</p>
                                            <div className="px-3 py-1.5 rounded border border-input bg-muted text-sm">ADMIN</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Approved Date &amp; Time</p>
                                            <div className="px-3 py-1.5 rounded border border-input bg-muted text-sm">{formatDateTime(new Date())}</div>
                                        </div>
                                    </div>

                                    {approvalError && (
                                        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">{approvalError}</p>
                                    )}

                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                        <Button variant="outline" onClick={closeApprovalModal} disabled={saving}>Close</Button>
                                        <Button
                                            onClick={handleCancelMovement}
                                            className="bg-red-600 hover:bg-red-700 text-white px-5"
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                                            X — Cancel
                                        </Button>
                                        <Button
                                            onClick={handleApprove}
                                            className="bg-green-600 hover:bg-green-700 text-white px-5"
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                                            A — Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Add Movement (Special) Modal ──────────────────────────────────── */}
            <AnimatePresence>
                {isAdd2ModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsAdd2ModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Stock Adjustment</h2>
                                        <p className="text-green-100 text-sm mt-0.5">Add or reduce product stock</p>
                                    </div>
                                    <button onClick={() => setIsAdd2ModalOpen(false)} className="text-white hover:bg-green-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                {Movement2Form()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
