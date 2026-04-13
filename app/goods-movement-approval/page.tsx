'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
    goodsMovementAPI,
    goodsMovementUnitsAPI,
    materialStatusAPI,
    materialStockAPI,
    goodsReceiptDetailAPI,
} from "@/services/api";
import { getSessionUser } from "@/lib/auth";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface GoodsMovement {
    _id?: string;
    gm_no: string;
    gm_date: string;
    material_status_id: string;
    material_doc_no?: string;
    material_doc_date?: string;
    material_id: string;
    total_nett_qty: number;
    uom: string;
    remarks?: string;
    entered_by_user_id: string;
    entered_date_time?: string;
    approval_remarks?: string;
    approved_by_user_id?: string;
    approved_date_time?: string;
    status: string;
}

interface MaterialStatus {
    matl_status_id: string;
    material_status: string;
    goods_movement?: string;
    against_gr?: string;
    stock_movement?: string;
    unit_split_allowed?: string;
    approval_required?: string;
}

interface MaterialStock {
    material_id: string;
    current_stock_qty: number;
    uom: string;
    total_no_of_rolls: number;
}

interface GmUnit {
    _id?: string;
    gm_no: string;
    roll_no: string;
    nett_qty: number;
    uom: string;
    status: string;
}

interface GRDetail {
    material_doc_no: string;
    material_id: string;
    invoice_total_nett_qty: number;
    uom: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(d?: string | Date): string {
    if (!d) return '-';
    const dt = new Date(d as string);
    if (isNaN(dt.getTime())) return '-';
    return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
}

function formatDateTime(d?: string | Date): string {
    if (!d) return '-';
    const dt = new Date(d as string);
    if (isNaN(dt.getTime())) return '-';
    return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}:${String(dt.getSeconds()).padStart(2, '0')}`;
}

function yn(val?: string): string {
    if (!val) return '-';
    return val === 'Y' ? 'Yes' : val === 'N' ? 'No' : val;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoodsMovementApprovalPage() {
    const { toast } = useToast();
    const currentUser = getSessionUser()?.user_id || 'ADMIN';

    // Data
    const [movements, setMovements] = useState<GoodsMovement[]>([]);
    const [materialStatuses, setMaterialStatuses] = useState<MaterialStatus[]>([]);
    const [materialStocks, setMaterialStocks] = useState<Record<string, MaterialStock>>({});
    const [grDetails, setGrDetails] = useState<Record<string, GRDetail>>({});  // key: `${docNo}|${materialId}`
    const [loading, setLoading] = useState(true);

    // Search & pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Expand state
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandedUnits, setExpandedUnits] = useState<Record<string, GmUnit[]>>({});
    const [unitsLoading, setUnitsLoading] = useState<Set<string>>(new Set());

    // Per-row approval_remarks
    const [approvalRemarks, setApprovalRemarks] = useState<Record<string, string>>({});

    // Rows being submitted
    const [submitting, setSubmitting] = useState<Set<string>>(new Set());

    // ── Load all data ──────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [allMovements, allStatuses] = await Promise.all([
                goodsMovementAPI.getAll(),
                materialStatusAPI.getAll(),
            ]);

            const eMovements: GoodsMovement[] = allMovements.filter(
                (m: GoodsMovement) => m.status === 'E'
            );
            setMovements(eMovements);
            setMaterialStatuses(allStatuses);

            // Pre-fill approval remarks
            setApprovalRemarks(prev => {
                const next = { ...prev };
                eMovements.forEach(m => { if (!(m.gm_no in next)) next[m.gm_no] = m.approval_remarks || ''; });
                return next;
            });

            // Fetch MaterialStocks for unique material_ids
            const uniqueMatIds = [...new Set(eMovements.map(m => m.material_id))];
            const stocks: Record<string, MaterialStock> = {};
            await Promise.all(
                uniqueMatIds.map(async id => {
                    try {
                        const s = await materialStockAPI.getByMaterialId(id);
                        if (s) stocks[id] = s;
                    } catch { /* no stock record yet */ }
                })
            );
            setMaterialStocks(stocks);

            // Fetch GR details for unique material_doc_nos (to get invoice_total_nett_qty)
            const uniqueDocNos = [...new Set(
                eMovements.filter(m => m.material_doc_no).map(m => m.material_doc_no!)
            )];
            const details: Record<string, GRDetail> = {};
            await Promise.all(
                uniqueDocNos.map(async docNo => {
                    try {
                        const rows: GRDetail[] = await goodsReceiptDetailAPI.getByDocNo(docNo);
                        rows.forEach(r => { details[`${docNo}|${r.material_id}`] = r; });
                    } catch { /* GR not found */ }
                })
            );
            setGrDetails(details);

            // Pre-load GM units for all 'E' movements (needed for unit_split_exists display)
            const units: Record<string, GmUnit[]> = {};
            await Promise.all(
                eMovements.map(async m => {
                    try {
                        const u: GmUnit[] = await goodsMovementUnitsAPI.getByGmNo(m.gm_no);
                        units[m.gm_no] = u;
                    } catch { units[m.gm_no] = []; }
                })
            );
            setExpandedUnits(prev => ({ ...prev, ...units }));

        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // ── Filter / paginate ──────────────────────────────────────────────────────
    const filteredMovements = movements.filter(m =>
        !searchQuery ||
        m.gm_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.material_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.material_doc_no || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);
    const paginatedMovements = filteredMovements.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // ── Expand toggle ──────────────────────────────────────────────────────────
    const handleToggleExpand = async (gmNo: string) => {
        const isExpanded = expandedRows.has(gmNo);
        setExpandedRows(prev => {
            const next = new Set(prev);
            isExpanded ? next.delete(gmNo) : next.add(gmNo);
            return next;
        });
        if (!isExpanded && expandedUnits[gmNo] === undefined) {
            setUnitsLoading(prev => new Set(prev).add(gmNo));
            try {
                const data: GmUnit[] = await goodsMovementUnitsAPI.getByGmNo(gmNo);
                setExpandedUnits(prev => ({ ...prev, [gmNo]: data }));
            } catch {
                setExpandedUnits(prev => ({ ...prev, [gmNo]: [] }));
            } finally {
                setUnitsLoading(prev => { const s = new Set(prev); s.delete(gmNo); return s; });
            }
        }
    };

    // ── Approve / Cancel ───────────────────────────────────────────────────────
    const handleAction = async (gmNo: string, newStatus: 'A' | 'X') => {
        if (submitting.has(gmNo)) return;
        setSubmitting(prev => new Set(prev).add(gmNo));
        try {
            await goodsMovementAPI.update(gmNo, {
                status: newStatus,
                approval_remarks: approvalRemarks[gmNo] || undefined,
                approved_by_user_id: currentUser,
                approved_date_time: new Date(),
            });
            const label = newStatus === 'A' ? 'Approved' : 'Cancelled';
            toast({ title: "Success", description: `GM ${gmNo} ${label} successfully` });
            setApprovalRemarks(prev => { const n = { ...prev }; delete n[gmNo]; return n; });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Action failed", variant: "destructive" });
        } finally {
            setSubmitting(prev => { const s = new Set(prev); s.delete(gmNo); return s; });
        }
    };

    // ── Lookups ────────────────────────────────────────────────────────────────
    const getStatus = (id: string) =>
        materialStatuses.find(s => s.matl_status_id === id);

    const getStock = (materialId: string) =>
        materialStocks[materialId];

    const getInvoiceQty = (docNo?: string, materialId?: string): string => {
        if (!docNo || !materialId) return '-';
        const d = grDetails[`${docNo}|${materialId}`];
        return d ? String(d.invoice_total_nett_qty) : '-';
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-auto lg:ml-64">
                    <div className="p-8 flex items-center justify-center">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }} className="mb-6 md:mb-8"
                    >
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                            Goods Movement Approval
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Approve or cancel goods movements with status — Entered (E)
                        </p>
                    </motion.div>

                    {/* Search bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }} className="mb-6"
                    >
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search by GM No, Material ID, or Doc No..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {filteredMovements.length} record{filteredMovements.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-auto max-h-[520px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-2 py-3 w-8"></th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">GM No.</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">GM Date</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Material Status</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Stock Movement</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Unit Split Allowed</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Approval Required</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Against GR Only</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Material Doc No.</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Material Doc Date</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Material ID</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Invoice Total Nett Qty</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Current Stock Qty</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Unit Split Exists</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Total Nett Qty</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">UOM</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Remarks</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Entered By</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Entered Date & Time</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Approval Remarks</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Approved By</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-left whitespace-nowrap">Approved Date & Time</th>
                                            <th className="px-3 py-3 text-xs font-semibold text-center whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedMovements.length === 0 ? (
                                            <tr>
                                                <td colSpan={23} className="px-4 py-8 text-center text-muted-foreground">
                                                    No goods movements pending approval
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedMovements.map((mv, index) => {
                                                const ms = getStatus(mv.material_status_id);
                                                const stock = getStock(mv.material_id);
                                                const units = expandedUnits[mv.gm_no];
                                                const unitSplitExists = units !== undefined
                                                    ? (units.length > 0 ? 'Yes' : 'No')
                                                    : '-';
                                                const busy = submitting.has(mv.gm_no);

                                                return (
                                                    <React.Fragment key={mv._id || mv.gm_no}>
                                                        <motion.tr
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.04 }}
                                                            className="hover:bg-muted/30 transition-colors"
                                                        >
                                                            {/* Expand */}
                                                            <td className="px-2 py-3 text-center">
                                                                <button
                                                                    onClick={() => handleToggleExpand(mv.gm_no)}
                                                                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                                    title="Show GM unit rows"
                                                                >
                                                                    <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${expandedRows.has(mv.gm_no) ? 'rotate-0' : '-rotate-90'}`} />
                                                                </button>
                                                            </td>

                                                            <td className="px-3 py-3 text-sm">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-semibold">
                                                                    {mv.gm_no}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-xs whitespace-nowrap">{formatDate(mv.gm_date)}</td>
                                                            <td className="px-3 py-3 text-xs">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs whitespace-nowrap">
                                                                    {mv.material_status_id}{ms ? ` - ${ms.material_status}` : ''}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-xs text-center">{yn(ms?.stock_movement)}</td>
                                                            <td className="px-3 py-3 text-xs text-center">{yn(ms?.unit_split_allowed)}</td>
                                                            <td className="px-3 py-3 text-xs text-center">{yn(ms?.approval_required)}</td>
                                                            <td className="px-3 py-3 text-xs text-center">{yn(ms?.against_gr)}</td>
                                                            <td className="px-3 py-3 text-xs">
                                                                {mv.material_doc_no
                                                                    ? <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{mv.material_doc_no}</span>
                                                                    : '-'}
                                                            </td>
                                                            <td className="px-3 py-3 text-xs whitespace-nowrap">{formatDate(mv.material_doc_date)}</td>
                                                            <td className="px-3 py-3 text-xs">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                    {mv.material_id}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-xs text-right">
                                                                {getInvoiceQty(mv.material_doc_no, mv.material_id)}
                                                            </td>
                                                            <td className="px-3 py-3 text-xs text-right">
                                                                {stock ? stock.current_stock_qty : '-'}
                                                            </td>
                                                            <td className="px-3 py-3 text-xs text-center">{unitSplitExists}</td>
                                                            <td className="px-3 py-3 text-xs text-right font-semibold">{mv.total_nett_qty}</td>
                                                            <td className="px-3 py-3 text-xs">{mv.uom}</td>
                                                            <td className="px-3 py-3 text-xs">{mv.remarks || '-'}</td>
                                                            <td className="px-3 py-3 text-xs">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                    {mv.entered_by_user_id}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-xs whitespace-nowrap">{formatDateTime(mv.entered_date_time)}</td>

                                                            {/* Approval Remarks — editable */}
                                                            <td className="px-3 py-3">
                                                                <Input
                                                                    type="text"
                                                                    value={approvalRemarks[mv.gm_no] ?? ''}
                                                                    onChange={e => setApprovalRemarks(prev => ({ ...prev, [mv.gm_no]: e.target.value }))}
                                                                    maxLength={100}
                                                                    placeholder="Enter remarks..."
                                                                    className="w-36 text-xs h-7 px-2"
                                                                />
                                                            </td>

                                                            {/* Approved By — display only, default current user */}
                                                            <td className="px-3 py-3 text-xs">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs whitespace-nowrap">
                                                                    {mv.approved_by_user_id || currentUser}
                                                                </span>
                                                            </td>

                                                            {/* Approved Date & Time — display only, current time */}
                                                            <td className="px-3 py-3 text-xs whitespace-nowrap text-gray-500">
                                                                {mv.approved_date_time
                                                                    ? formatDateTime(mv.approved_date_time)
                                                                    : formatDateTime(new Date().toISOString())}
                                                            </td>

                                                            {/* Action buttons */}
                                                            <td className="px-3 py-3">
                                                                <div className="flex flex-col gap-1 min-w-[76px]">
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={busy}
                                                                        onClick={() => handleAction(mv.gm_no, 'A')}
                                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3 w-full"
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={busy}
                                                                        onClick={() => handleAction(mv.gm_no, 'X')}
                                                                        className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3 w-full"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>

                                                        {/* Expanded GM Units sub-row */}
                                                        {expandedRows.has(mv.gm_no) && (
                                                            <tr>
                                                                <td colSpan={23} className="p-0 bg-blue-50/40 border-b border-blue-100">
                                                                    <div className="px-8 py-4">
                                                                        {unitsLoading.has(mv.gm_no) ? (
                                                                            <p className="text-sm text-muted-foreground py-2">Loading units...</p>
                                                                        ) : (expandedUnits[mv.gm_no] || []).length === 0 ? (
                                                                            <p className="text-sm text-muted-foreground py-2">No unit rows for this goods movement.</p>
                                                                        ) : (
                                                                            <table className="w-full text-xs border rounded-lg overflow-hidden">
                                                                                <thead>
                                                                                    <tr className="bg-blue-100">
                                                                                        <th className="px-3 py-2 text-left font-semibold">Roll No.</th>
                                                                                        <th className="px-3 py-2 text-left font-semibold">Nett Qty</th>
                                                                                        <th className="px-3 py-2 text-left font-semibold">Balance Qty</th>
                                                                                        <th className="px-3 py-2 text-left font-semibold">UOM</th>
                                                                                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-blue-100">
                                                                                    {(expandedUnits[mv.gm_no] || []).map((unit, ui) => (
                                                                                        <tr key={unit._id || ui} className="bg-white hover:bg-blue-50/50">
                                                                                            <td className="px-3 py-2 font-mono font-semibold text-blue-700">{unit.roll_no}</td>
                                                                                            <td className="px-3 py-2">{unit.nett_qty}</td>
                                                                                            <td className="px-3 py-2">
                                                                                                {(() => {
                                                                                                    // balance_qty comes from GRUnits; show nett_qty as reference
                                                                                                    return unit.nett_qty;
                                                                                                })()}
                                                                                            </td>
                                                                                            <td className="px-3 py-2">{unit.uom}</td>
                                                                                            <td className="px-3 py-2">
                                                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                                                    mv.status === 'E'
                                                                                                        ? 'bg-blue-50 text-blue-600'
                                                                                                        : mv.status === 'A'
                                                                                                        ? 'bg-green-50 text-green-600'
                                                                                                        : 'bg-red-50 text-red-600'
                                                                                                }`}>
                                                                                                    {mv.status}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        )}
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

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    PAGE {currentPage} OF {totalPages || 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4 mr-1" />Previous
                                    </Button>
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}>
                                        Next<ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
