'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pencil, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productMovementAPI, productStockAPI } from "@/services/api";

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

export default function ProductMovementApprovalPage() {
    const [records, setRecords]               = useState<ProductMovementRecord[]>([]);
    const [loading, setLoading]               = useState(true);
    const [saving, setSaving]                 = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [searchQuery, setSearchQuery]       = useState("");
    const [currentPage, setCurrentPage]       = useState(1);

    // Approval modal state
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ProductMovementRecord | null>(null);
    const [approvalRemarks, setApprovalRemarks] = useState("");
    const [approvalError, setApprovalError]   = useState<string | null>(null);

    // ── Fetch records (status=E only) ─────────────────────────────────────────

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productMovementAPI.getAll({ status: 'E' });
            setRecords(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    // ── Derived / pagination ──────────────────────────────────────────────────

    const filtered = records.filter(r =>
        r.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.prod_movement_id?.toString().includes(searchQuery)
    );

    const totalPages  = Math.ceil(filtered.length / ROWS_PER_PAGE);
    const startIndex  = (currentPage - 1) * ROWS_PER_PAGE;
    const paginated   = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // ── Update stock helper ───────────────────────────────────────────────────

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

    // ── Open approval modal ───────────────────────────────────────────────────

    const handleOpenApproval = (record: ProductMovementRecord) => {
        setSelectedRecord(record);
        setApprovalRemarks("");
        setApprovalError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
        setApprovalRemarks("");
        setApprovalError(null);
    };

    // ── Approve ───────────────────────────────────────────────────────────────

    const handleApprove = async () => {
        if (!selectedRecord) return;
        if (!approvalRemarks.trim()) {
            setApprovalError("Approval remarks are required.");
            return;
        }
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
            closeModal();
            fetchRecords();
        } catch (err: any) {
            setApprovalError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Cancel / Reject ───────────────────────────────────────────────────────

    const handleCancelMovement = async () => {
        if (!selectedRecord) return;
        setSaving(true);
        setApprovalError(null);
        try {
            await productMovementAPI.update(selectedRecord.prod_movement_id, { status: 'X' });
            closeModal();
            fetchRecords();
        } catch (err: any) {
            setApprovalError(err.message);
        } finally {
            setSaving(false);
        }
    };

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
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                            Product Movement Approval
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Review and approve pending product movement records
                        </p>
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
                                                            No pending product movements found.
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
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                {/* Modal header */}
                                <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">Approve / Cancel Movement</h2>
                                        <p className="text-amber-100 text-sm mt-0.5">
                                            {formatMovementId(selectedRecord.prod_movement_id)} — {selectedRecord.batch_no}
                                            {" "}
                                            <MovementTypeBadge type={selectedRecord.movement_type} />
                                        </p>
                                    </div>
                                    <button onClick={closeModal} className="text-white hover:bg-amber-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {/* Display-only movement fields */}
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

                                    {/* Approval fields */}
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
                                        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">
                                            {approvalError}
                                        </p>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                        <Button variant="outline" onClick={closeModal} disabled={saving}>
                                            Close
                                        </Button>
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
        </div>
    );
}
