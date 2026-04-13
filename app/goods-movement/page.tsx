'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
    goodsMovementAPI, materialStatusAPI, goodsReceiptHeaderAPI,
    goodsReceiptDetailAPI, goodsReceiptUnitsAPI, materialStockAPI, materialAPI,
    goodsMovementUnitsAPI,
} from "@/services/api";
import { getSessionUser } from "@/lib/auth";

// ─── Interfaces ────────────────────────────────────────────────────────────────

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

interface GRHeader {
    material_doc_no: string;
    material_doc_date: string;
    material_id?: string;
    material_status_id?: string;
    invoice_no?: string;
    invoice_date?: string;
    status: string;
}

interface GRUnitRow {
    _id: string;
    roll_no: string;
    balance_qty: number;
    uom: string;
    material_id?: string;
}

interface GmUnitRow {
    roll_no: string;
    balance_qty: number;   // original GRUnit balance (for display)
    nett_qty: number;       // may be negative for OUT movement
    uom: string;
    _originalRoll: GRUnitRow; // kept so we can restore on remove
}

interface MaterialStock {
    material_id: string;
    current_stock_qty: number;
    uom: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | undefined) {
    if (!d) return "-";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "-";
    return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
}

function formatDateTime(d: string | Date | undefined) {
    if (!d) return "-";
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return "-";
    return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}:${String(dt.getSeconds()).padStart(2, '0')}`;
}

function toDateInput(d: string | undefined) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().split('T')[0];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    E: { label: 'Entered',   color: 'bg-blue-50 text-blue-600' },
    A: { label: 'Approved',  color: 'bg-green-50 text-green-600' },
    X: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
};

const emptyForm = {
    gm_date:           new Date().toISOString().split('T')[0],
    material_status_id: "",
    // derived from material status (GM's own status)
    stock_movement:      "",
    unit_split_allowed:  "",
    approval_required:   "",
    // derived from GR header's material status → for nett_qty multiplier
    gr_stock_movement:   "",
    against_gr_only:     "",
    // GR path
    material_doc_no:     "",
    material_doc_date:   "",
    // common
    material_id:         "",
    invoice_total_nett_qty: "",
    current_stock_qty:   "",
    unit_split_exists:   "",
    total_nett_qty:      "",
    uom:                 "",
    remarks:             "",
    entered_by_user_id:  "ADMIN",
    status:              "E",
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GoodsMovementPage() {
    const { toast } = useToast();
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const isSubmittingRef = useRef(false);

    // Table data
    const [movements, setMovements]   = useState<GoodsMovement[]>([]);
    const [loading, setLoading]       = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [isAddModalOpen,    setIsAddModalOpen]    = useState(false);
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
    const [isGRPopupOpen,     setIsGRPopupOpen]     = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [movementToDelete,  setMovementToDelete]  = useState<GoodsMovement | null>(null);
    const [selectedMovement,  setSelectedMovement]  = useState<GoodsMovement | null>(null);

    // Form
    const [formData, setFormData] = useState({ ...emptyForm });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Reference data
    const [materialStatuses, setMaterialStatuses] = useState<MaterialStatus[]>([]);
    const [grHeaders,        setGrHeaders]        = useState<GRHeader[]>([]);
    const [materialStocks,   setMaterialStocks]   = useState<MaterialStock[]>([]);

    // Units grid (add form)
    const [gmUnits,          setGmUnits]          = useState<GmUnitRow[]>([]);
    const [availableRolls,   setAvailableRolls]   = useState<GRUnitRow[]>([]);
    const [isRollPopupOpen,  setIsRollPopupOpen]  = useState(false);
    const [rollSearch,       setRollSearch]       = useState("");

    // Expandable rows
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [unitsCache,   setUnitsCache]   = useState<Record<string, any[]>>({});

    // ── Load reference data ─────────────────────────────────────────────────────

    const loadMovements = useCallback(async () => {
        try {
            setLoading(true);
            const data = await goodsMovementAPI.getAll();
            setMovements(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadMovements(); }, [loadMovements]);

    const toggleRow = async (gmNo: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.has(gmNo) ? next.delete(gmNo) : next.add(gmNo);
            return next;
        });
        if (!unitsCache[gmNo]) {
            try {
                const units = await goodsMovementUnitsAPI.getByGmNo(gmNo);
                setUnitsCache(prev => ({ ...prev, [gmNo]: units || [] }));
            } catch {
                setUnitsCache(prev => ({ ...prev, [gmNo]: [] }));
            }
        }
    };

    useEffect(() => {
        materialStatusAPI.getAll().then(setMaterialStatuses).catch(console.error);
        goodsReceiptHeaderAPI.getAll().then(setGrHeaders).catch(console.error);
        materialStockAPI.getAll().then(setMaterialStocks).catch(console.error);
    }, []);

    // Filter to only Goods Movement = 'Y' statuses
    const gmStatuses = materialStatuses.filter(s => s.goods_movement?.toUpperCase() === 'Y');

    // Active GR headers for popup
    const activeGRHeaders = grHeaders.filter(g => g.status === 'A');

    // Material stock where qty > 0
    const stocksWithQty = materialStocks.filter(s => s.current_stock_qty > 0);

    // ── Reset form on Add open ───────────────────────────────────────────────────

    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                ...emptyForm,
                gm_date: new Date().toISOString().split('T')[0],
                entered_by_user_id: getSessionUser()?.user_id || "ADMIN",
            });
            setFieldErrors({});
            setGmUnits([]);
            setAvailableRolls([]);
            setRollSearch("");
        }
    }, [isAddModalOpen]);

    // ── When material_status_id changes: derive flags ────────────────────────────

    const handleMaterialStatusChange = (statusId: string) => {
        const ms = materialStatuses.find(s => s.matl_status_id === statusId);
        const approvalRequired  = (ms?.approval_required  || "N").toUpperCase();
        const againstGR         = (ms?.against_gr         || "N").toUpperCase();
        const stockMovement     = (ms?.stock_movement     || "").toUpperCase();
        const unitSplitAllowed  = (ms?.unit_split_allowed || "N").toUpperCase();
        const derivedStatus     = approvalRequired === 'Y' ? 'E' : 'A';

        setGmUnits([]);
        setAvailableRolls([]);
        setFormData(prev => ({
            ...prev,
            material_status_id:  statusId,
            stock_movement:      stockMovement,
            unit_split_allowed:  unitSplitAllowed,
            approval_required:   approvalRequired,
            against_gr_only:     againstGR,
            gr_stock_movement:   "",
            status:              derivedStatus,
            // reset derived fields when status changes
            material_doc_no:     "",
            material_doc_date:   "",
            material_id:         "",
            invoice_total_nett_qty: "",
            current_stock_qty:   "",
            unit_split_exists:   "",
            total_nett_qty:      "",
            uom:                 "",
        }));
    };
// Helper function for GM Status (Goods Movement Status)
const getGMStatusDisplay = (statusId: string) => {
    if (!statusId) return "-";
    const status = gmStatuses.find(s => s.matl_status_id === statusId);
    return status ? `${status.matl_status_id} - ${status.material_status}` : statusId;
};
    // ── GR row selected from popup ───────────────────────────────────────────────

    const handleGRSelect = async (gr: GRHeader) => {
        setIsGRPopupOpen(false);
        try {
            // Fetch detail for invoice_total_nett_qty and uom
            const details = await goodsReceiptDetailAPI.getByDocNo(gr.material_doc_no);
            const detail  = details?.[0];

            const materialId = gr.material_id || detail?.material_id || "";

            // Fetch available rolls (status='A', balance_qty>0)
            const available: GRUnitRow[] = await goodsReceiptUnitsAPI.getAvailable(materialId, gr.material_doc_no).catch(() => []);

            if (!available || available.length === 0) {
                toast({
                    title: "No Available Rolls",
                    description: `No available unit split rolls found for ${gr.material_doc_no}`,
                    variant: "destructive",
                });
                return;
            }

            // Derive stock_movement from GR's material_status_id → MaterialStatusMaster
            const grMs = materialStatuses.find(s => s.matl_status_id === gr.material_status_id);
            const grStockMovement = (grMs?.stock_movement || "").toUpperCase();

            // Fetch current stock qty
            const stock = materialStocks.find(s => s.material_id === materialId);
            const currentStockQty = stock?.current_stock_qty ?? 0;
            const uom = detail?.uom || stock?.uom || "";
            const invoiceQty = detail?.invoice_total_nett_qty ?? "";

            setAvailableRolls(available);
            setGmUnits([]);
            setFormData(prev => ({
                ...prev,
                material_doc_no:        gr.material_doc_no,
                material_doc_date:      toDateInput(gr.material_doc_date),
                material_id:            materialId,
                invoice_total_nett_qty: String(invoiceQty),
                current_stock_qty:      String(currentStockQty),
                unit_split_exists:      "Y",
                uom,
                total_nett_qty:         "",
                gr_stock_movement:      grStockMovement,
            }));
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to fetch GR details", variant: "destructive" });
        }
    };

    // ── Material selected (non-GR path) ─────────────────────────────────────────

    const handleMaterialSelect = async (materialId: string) => {
        try {
            const stock = materialStocks.find(s => s.material_id === materialId);
            const currentStockQty = stock?.current_stock_qty ?? 0;
            const uom = stock?.uom || "";

            // Check unit split from GR units for this material
            const units = await goodsReceiptUnitsAPI.getByDetail("", materialId).catch(() => []);
            const unitSplitExists = units && units.length > 0 ? "Y" : "N";

            if (unitSplitExists === "N") {
                toast({
                    title: "Unit Split Error",
                    description: `Unit split details not available for this Material`,
                    variant: "destructive",
                });
            }

            setFormData(prev => ({
                ...prev,
                material_id:       materialId,
                current_stock_qty: String(currentStockQty),
                unit_split_exists: unitSplitExists,
                uom,
                total_nett_qty:    "",
            }));
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to fetch stock", variant: "destructive" });
        }
    };

    // ── Roll add / remove ────────────────────────────────────────────────────────

    const handleAddRoll = (roll: GRUnitRow) => {
        // If GR's material status has stock_movement = 'OUT', nett_qty is negative
        const isOut = formData.gr_stock_movement === 'OUT';
        const qty = isOut ? Math.abs(roll.balance_qty) * -1 : roll.balance_qty;
        const newUnit: GmUnitRow = {
            roll_no:       roll.roll_no,
            balance_qty:   roll.balance_qty,
            nett_qty:      qty,
            uom:           roll.uom,
            _originalRoll: roll,
        };
        const newGmUnits = [...gmUnits, newUnit];
        setGmUnits(newGmUnits);
        setAvailableRolls(prev => prev.filter(r => r._id !== roll._id));
        // Auto-sum absolute quantities for total_nett_qty
        const newTotal = newGmUnits.reduce((sum, u) => sum + Math.abs(u.nett_qty), 0);
        setFormData(prev => ({ ...prev, total_nett_qty: String(parseFloat(newTotal.toFixed(3))) }));
        setIsRollPopupOpen(false);
        setRollSearch("");
    };

    const handleRemoveUnit = (idx: number) => {
        const unit = gmUnits[idx];
        const newGmUnits = gmUnits.filter((_, i) => i !== idx);
        setGmUnits(newGmUnits);
        // Restore roll to available list
        setAvailableRolls(prev => [...prev, unit._originalRoll]);
        const newTotal = newGmUnits.reduce((sum, u) => sum + Math.abs(u.nett_qty), 0);
        setFormData(prev => ({ ...prev, total_nett_qty: newGmUnits.length ? String(parseFloat(newTotal.toFixed(3))) : "" }));
    };

    // ── Input change ─────────────────────────────────────────────────────────────

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'material_status_id') {
            handleMaterialStatusChange(value);
            return;
        }
        if (name === 'material_id' && formData.against_gr_only !== 'Y') {
            handleMaterialSelect(value);
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ── Validate ─────────────────────────────────────────────────────────────────

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!formData.material_status_id) errors.material_status_id = "Required";
        if (formData.against_gr_only === 'Y' && !formData.material_doc_no) errors.material_doc_no = "Required";
        if (!formData.material_id) errors.material_id = "Required";
        if (!formData.total_nett_qty || parseFloat(formData.total_nett_qty) === 0) errors.total_nett_qty = "Required";
        if (!formData.remarks?.trim()) errors.remarks = "Required";

        const qty = parseFloat(formData.total_nett_qty);
        const invoiceQty = parseFloat(formData.invoice_total_nett_qty);
        const stockQty = parseFloat(formData.current_stock_qty);

        if (formData.against_gr_only === 'Y' && !isNaN(qty) && !isNaN(invoiceQty) && qty > invoiceQty) {
            errors.total_nett_qty = `Cannot exceed Invoice total nett qty (${invoiceQty})`;
        }
        if (!isNaN(qty) && !isNaN(stockQty) && qty > stockQty) {
            errors.total_nett_qty = `Cannot exceed current stock qty (${stockQty})`;
        }
        return errors;
    };

    // ── Submit (Add) ─────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length) { setFieldErrors(errors); return; }
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        try {
            // Apply (-1) multiplier: use GR header's stock_movement ('OUT' = outward)
            // When GRHeader.stock_movement field is added in future, derive gr_stock_movement from that instead
            let qty = parseFloat(formData.total_nett_qty);
            if (formData.gr_stock_movement === 'OUT') qty = Math.abs(qty) * -1;

            // Pass units inside the POST body so the API handles everything in one transaction
            await goodsMovementAPI.create({
                gm_date:            formData.gm_date,
                material_status_id: formData.material_status_id,
                material_doc_no:    formData.material_doc_no || undefined,
                material_doc_date:  formData.material_doc_date || undefined,
                material_id:        formData.material_id,
                total_nett_qty:     qty,
                uom:                formData.uom,
                remarks:            formData.remarks,
                entered_by_user_id: formData.entered_by_user_id,
                status:             formData.status,
                units: gmUnits.map(u => ({ roll_no: u.roll_no, nett_qty: u.nett_qty, uom: u.uom })),
            });

            toast({ title: "Success", description: "Goods Movement created successfully" });
            setIsAddModalOpen(false);
            loadMovements();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────────

    const handleEdit = (movement: GoodsMovement) => {
        setSelectedMovement(movement);
        const ms = materialStatuses.find(s => s.matl_status_id === movement.material_status_id);
        setFormData({
            gm_date:           toDateInput(movement.gm_date),
            material_status_id: movement.material_status_id,
            stock_movement:    ms?.stock_movement     || "",
            unit_split_allowed: ms?.unit_split_allowed || "",
            approval_required: ms?.approval_required  || "",
            against_gr_only:   ms?.against_gr         || "",
            gr_stock_movement: "",
            material_doc_no:   movement.material_doc_no || "",
            material_doc_date: toDateInput(movement.material_doc_date),
            material_id:       movement.material_id,
            invoice_total_nett_qty: "",
            current_stock_qty: "",
            unit_split_exists: "",
            total_nett_qty:    String(Math.abs(movement.total_nett_qty)),
            uom:               movement.uom,
            remarks:           movement.remarks || "",
            entered_by_user_id: movement.entered_by_user_id,
            status:            movement.status,
        });
        setFieldErrors({});
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current || !selectedMovement) return;
        isSubmittingRef.current = true;
        try {
            let qty = parseFloat(formData.total_nett_qty);
            if (formData.gr_stock_movement === 'OUT') qty = Math.abs(qty) * -1;

            await goodsMovementAPI.update(selectedMovement.gm_no, {
                material_status_id: formData.material_status_id,
                material_doc_no:    formData.material_doc_no || undefined,
                material_doc_date:  formData.material_doc_date || undefined,
                material_id:        formData.material_id,
                total_nett_qty:     qty,
                uom:                formData.uom,
                remarks:            formData.remarks,
                status:             formData.status,
            });

            toast({ title: "Success", description: "Goods Movement updated successfully" });
            setIsEditModalOpen(false);
            setSelectedMovement(null);
            loadMovements();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────────

    const handleDelete = (m: GoodsMovement) => { setMovementToDelete(m); setIsDeleteDialogOpen(true); };

    const confirmDelete = async () => {
        if (!movementToDelete) return;
        try {
            await goodsMovementAPI.delete(movementToDelete.gm_no);
            toast({ title: "Deleted", description: `${movementToDelete.gm_no} deleted` });
            setIsDeleteDialogOpen(false);
            setMovementToDelete(null);
            loadMovements();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
        }
    };

    // ── Filter / Pagination ──────────────────────────────────────────────────────

    const filtered = movements.filter(m => {
        const q = searchQuery.toLowerCase();
        const matchSearch = m.gm_no.toLowerCase().includes(q) ||
            m.material_id.toLowerCase().includes(q) ||
            (m.material_doc_no || "").toLowerCase().includes(q);
        const matchStatus = filterStatus === "all" || m.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const totalPages  = Math.ceil(filtered.length / rowsPerPage);
    const startIndex  = (currentPage - 1) * rowsPerPage;
    const endIndex    = startIndex + rowsPerPage;
    const paginated   = filtered.slice(startIndex, endIndex);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, rowsPerPage]);

    // ── Render ───────────────────────────────────────────────────────────────────

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

    // ── Reusable modal form body ─────────────────────────────────────────────────

    const renderFormFields = (isEdit = false) => (
        <div className="grid grid-cols-2 gap-6">
            {/* Section: GM Header */}
            <div className="col-span-2">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Goods Movement Header</h3>
            </div>

            {/* GM No (edit only display) */}
            {isEdit && (
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">GM No.</label>
                    <Input value={selectedMovement?.gm_no || ""} disabled className="bg-gray-50 font-mono" />
                </div>
            )}

            {/* GM Date */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">GM Date</label>
                <Input value={formatDate(formData.gm_date)} disabled className="bg-gray-50" />
            </div>

            {/* Material Status ID */}
            <div className={isEdit ? "col-span-1" : "col-span-2"}>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Material Status ID <span className="text-red-500">*</span>
                </label>
                <select
                    name="material_status_id"
                    value={formData.material_status_id}
                    onChange={handleInputChange}
                    disabled={isEdit}
                    className={`w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none ${isEdit ? 'opacity-70' : ''} ${fieldErrors.material_status_id ? 'border-red-500' : ''}`}
                >
                    <option value="">Select Material Status</option>
                    {gmStatuses.map(s => (
                        <option key={s.matl_status_id} value={s.matl_status_id}>
                            {s.matl_status_id} - {s.material_status}
                        </option>
                    ))}
                </select>
                {fieldErrors.material_status_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.material_status_id}</p>}
            </div>

            {/* Derived flags (display only) */}
            {formData.material_status_id && (
                <>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Stock Movement</label>
                        <Input value={formData.stock_movement || "-"} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Unit Split Allowed</label>
                        <Input value={formData.unit_split_allowed || "-"} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Approval Required</label>
                        <Input value={formData.approval_required || "-"} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Against GR Only</label>
                        <Input value={formData.against_gr_only || "-"} disabled className="bg-gray-50" />
                    </div>
                </>
            )}

            {/* ── Path A: Against GR ───────────────────────────────────────── */}
            {formData.material_status_id && formData.against_gr_only === 'Y' && (
                <>
                    <div className="col-span-2 mt-2">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">GR Reference</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Material Doc No. <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <Input value={formData.material_doc_no} disabled className="bg-gray-50 font-mono flex-1" placeholder="Select from GR..." />
                            {!isEdit && (
                                <Button type="button" variant="outline" onClick={() => setIsGRPopupOpen(true)} className="whitespace-nowrap">
                                    Select GR
                                </Button>
                            )}
                        </div>
                        {fieldErrors.material_doc_no && <p className="text-red-500 text-xs mt-1">{fieldErrors.material_doc_no}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Material Doc Date</label>
                        <Input value={formatDate(formData.material_doc_date)} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Material ID</label>
                        <Input value={formData.material_id} disabled className="bg-gray-50 font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Invoice Total Nett Qty</label>
                        <Input value={formData.invoice_total_nett_qty || "-"} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Current Stock Qty</label>
                        <Input value={formData.current_stock_qty || "-"} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Unit Split Exists</label>
                        <Input value={formData.unit_split_exists || "-"} disabled className={`bg-gray-50 ${formData.unit_split_exists === 'Y' ? 'text-green-600' : formData.unit_split_exists === 'N' ? 'text-red-600' : ''}`} />
                    </div>
                </>
            )}

            {/* ── Path B: Non-GR ───────────────────────────────────────────── */}
            {formData.material_status_id && formData.against_gr_only !== 'Y' && formData.against_gr_only !== '' && (
                <>
                    <div className="col-span-2 mt-2">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Material</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Material ID <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="material_id"
                            value={formData.material_id}
                            onChange={handleInputChange}
                            disabled={isEdit}
                            className={`w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none ${isEdit ? 'opacity-70' : ''} ${fieldErrors.material_id ? 'border-red-500' : ''}`}
                        >
                            <option value="">Select Material</option>
                            {stocksWithQty.map(s => (
                                <option key={s.material_id} value={s.material_id}>
                                    {s.material_id} (Stock: {s.current_stock_qty} {s.uom})
                                </option>
                            ))}
                        </select>
                        {fieldErrors.material_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.material_id}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Current Stock Qty</label>
                        <Input value={formData.current_stock_qty || "-"} disabled className="bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Unit Split Exists</label>
                        <Input value={formData.unit_split_exists || "-"} disabled className={`bg-gray-50 ${formData.unit_split_exists === 'Y' ? 'text-green-600' : formData.unit_split_exists === 'N' ? 'text-red-600' : ''}`} />
                    </div>
                </>
            )}

            {/* ── Common qty + uom ─────────────────────────────────────────── */}
            {formData.material_id && (
                <>
                    <div className="col-span-2 mt-2">
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Quantity</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Total Nett Qty <span className="text-red-500">*</span>
                        </label>
                        {formData.unit_split_exists === 'Y' ? (
                            <Input value={formData.total_nett_qty || "-"} disabled className="bg-gray-50" />
                        ) : (
                            <Input
                                name="total_nett_qty"
                                type="number"
                                step="0.001"
                                value={formData.total_nett_qty}
                                onChange={handleInputChange}
                                className={fieldErrors.total_nett_qty ? 'border-red-500' : ''}
                                min={0}
                            />
                        )}
                        {fieldErrors.total_nett_qty && <p className="text-red-500 text-xs mt-1">{fieldErrors.total_nett_qty}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">UOM</label>
                        <Input value={formData.uom || "-"} disabled className="bg-gray-50" />
                    </div>

                    {/* ── Units Grid (unit_split = Y, add form only) ─────── */}
                    {!isEdit && formData.unit_split_exists === 'Y' && (
                        <div className="col-span-2 mt-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-2 flex-1">
                                    Movement Units
                                    {formData.gr_stock_movement === 'OUT' && (
                                        <span className="ml-2 text-red-500 normal-case">(Outward — qty will be negative)</span>
                                    )}
                                </h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => { setRollSearch(""); setIsRollPopupOpen(true); }}
                                    className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    + Add Roll
                                </Button>
                            </div>
                            {gmUnits.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">No rolls added yet. Click Add Roll to select available rolls.</p>
                            ) : (
                                <table className="w-full text-sm border rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-3 py-2 text-left font-semibold">Roll No.</th>
                                            <th className="px-3 py-2 text-right font-semibold">Bal. Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold">Nett Qty</th>
                                            <th className="px-3 py-2 text-left font-semibold">UOM</th>
                                            <th className="px-3 py-2 text-center font-semibold">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {gmUnits.map((u, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 font-mono">{u.roll_no}</td>
                                                <td className="px-3 py-2 text-right">{u.balance_qty}</td>
                                                <td className={`px-3 py-2 text-right font-semibold ${u.nett_qty < 0 ? 'text-red-600' : 'text-green-700'}`}>{u.nett_qty}</td>
                                                <td className="px-3 py-2">{u.uom}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveUnit(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50">✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Entry fields ─────────────────────────────────────────────── */}
            <div className="col-span-2 mt-2">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Additional Info</h3>
            </div>

            <div className="col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Remarks <span className="text-red-500">*</span>
                </label>
                <Input
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    maxLength={100}
                    className={fieldErrors.remarks ? 'border-red-500' : ''}
                />
                {fieldErrors.remarks && <p className="text-red-500 text-xs mt-1">{fieldErrors.remarks}</p>}
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Entered By</label>
                <Input value={formData.entered_by_user_id} disabled className="bg-gray-50 font-mono" />
            </div>
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                <div className="flex items-center h-10 px-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[formData.status]?.color || ''}`}>
                        {STATUS_LABELS[formData.status]?.label || formData.status}
                    </span>
                    {formData.approval_required && (
                        <span className="text-xs text-muted-foreground ml-3">
                            (Approval required: {formData.approval_required})
                        </span>
                    )}
                </div>
            </div>

        </div>
    );

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Goods Movement</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Manage goods movement records</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">New Goods Movement</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search + Filter */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search by GM No, Material ID, or Doc No..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filtered.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filtered.length)} OF {filtered.length}
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
                                                    {[
                                                        { value: "all", label: "All" },
                                                        { value: "E", label: "E - Entered" },
                                                        { value: "A", label: "A - Approved" },
                                                        { value: "X", label: "X - Cancelled" },
                                                    ].map(opt => (
                                                        <div key={opt.value} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`filter-${opt.value}`}
                                                                name="gmStatusFilter"
                                                                checked={filterStatus === opt.value}
                                                                onChange={() => setFilterStatus(opt.value)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`filter-${opt.value}`} className="text-sm font-normal cursor-pointer text-foreground">{opt.label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">No. of rows per screen</Label>
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={e => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
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

                    {/* Table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="overflow-hidden">
                            <div className="overflow-auto max-h-[360px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-2 py-3 w-8"></th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">GM No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">GM Date</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Status ID</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Doc No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Doc Date</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material ID</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Total Nett Qty</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">UOM</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Remarks</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Entered By</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Entered Date & Time</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={14} className="px-4 py-8 text-center text-muted-foreground">No goods movements found</td>
                                            </tr>
                                        ) : (
                                            paginated.map((m, index) => {
                                                const isExpanded = expandedRows.has(m.gm_no);
                                                const units      = unitsCache[m.gm_no] || [];
                                                return (
                                                    <React.Fragment key={m._id || m.gm_no}>
                                                        {/* ── Main row ── */}
                                                        <motion.tr
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                                            className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-blue-50/40' : ''}`}
                                                        >
                                                            <td className="px-2 py-3 text-center">
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); toggleRow(m.gm_no); }}
                                                                    className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                                                    title="Show Movement Units"
                                                                >
                                                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-semibold">{m.gm_no}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">{formatDate(m.gm_date)}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{getGMStatusDisplay(m.material_status_id)}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {m.material_doc_no ? (
                                                                    <span className="inline-flex px-2 py-1 rounded-md bg-purple-50 text-purple-700 font-mono text-xs">{m.material_doc_no}</span>
                                                                ) : "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">{formatDate(m.material_doc_date)}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{m.material_id}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-mono">{m.total_nett_qty}</td>
                                                            <td className="px-4 py-3 text-sm">{m.uom}</td>
                                                            <td className="px-4 py-3 text-sm">{m.remarks || "-"}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{m.entered_by_user_id}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">{formatDateTime(m.entered_date_time)}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[m.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                                    {STATUS_LABELS[m.status]?.label || m.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {isSuperAdmin && (
                                                                        <Button variant="ghost" size="sm"
                                                                            onClick={e => { e.stopPropagation(); handleDelete(m); }}
                                                                            className="text-gray-500 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>

                                                        {/* ── Expanded units row ── */}
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={14} className="p-0 border-b border-slate-100">
                                                                    <div className="px-4 py-2 bg-slate-50/60">
                                                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm inline-block">
                                                                            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-white">
                                                                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                                                                    Goods Movement Units — {m.gm_no}
                                                                                </span>
                                                                            </div>
                                                                            {units.length === 0 ? (
                                                                                <div className="px-4 py-5 text-sm text-slate-400 italic text-center">No unit records found.</div>
                                                                            ) : (
                                                                                <table className="text-xs" style={{ tableLayout: 'fixed', width: '480px' }}>
                                                                                    <colgroup>
                                                                                        <col style={{ width: '160px' }} />
                                                                                        <col style={{ width: '100px' }} />
                                                                                        <col style={{ width: '60px' }} />
                                                                                        <col style={{ width: '100px' }} />
                                                                                    </colgroup>
                                                                                    <thead>
                                                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Roll No.</th>
                                                                                            <th className="px-3 py-1.5 text-right font-semibold text-slate-500 uppercase tracking-wider">Nett Qty</th>
                                                                                            <th className="px-3 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider">UOM</th>
                                                                                            <th className="px-3 py-1.5 text-center font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-slate-100">
                                                                                        {units.map((u: any, i: number) => (
                                                                                            <tr key={i} className="hover:bg-slate-50">
                                                                                                <td className="px-3 py-1.5 font-mono">{u.roll_no}</td>
                                                                                                <td className={`px-3 py-1.5 text-right font-mono font-semibold ${u.nett_qty < 0 ? 'text-red-600' : 'text-green-700'}`}>{u.nett_qty}</td>
                                                                                                <td className="px-3 py-1.5">{u.uom}</td>
                                                                                                <td className="px-3 py-1.5 text-center">
                                                                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_LABELS[u.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                                                                        {STATUS_LABELS[u.status]?.label || u.status}
                                                                                                    </span>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
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

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
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

            {/* ── Add Modal ──────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">New Goods Movement</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderFormFields(false)}
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Goods Movement</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Goods Movement — {selectedMovement?.gm_no}</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderFormFields(true)}
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Goods Movement</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── GR Selection Popup ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {isGRPopupOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60]" onClick={() => setIsGRPopupOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[70vh] overflow-hidden">
                                <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
                                    <h3 className="text-lg font-bold">Select Goods Receipt</h3>
                                    <button onClick={() => setIsGRPopupOpen(false)} className="text-white hover:bg-gray-700 rounded-lg p-1 transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="overflow-auto max-h-[calc(70vh-80px)]">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-gray-100 border-b border-border">
                                                <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Doc No.</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Doc Date</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material ID</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Invoice No.</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Invoice Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {activeGRHeaders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No active GR records found</td>
                                                </tr>
                                            ) : (
                                                activeGRHeaders.map(gr => (
                                                    <tr
                                                        key={gr.material_doc_no}
                                                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                        onClick={() => handleGRSelect(gr)}
                                                    >
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-semibold">{gr.material_doc_no}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{formatDate(gr.material_doc_date)}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{gr.material_id || "-"}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{gr.invoice_no || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">{formatDate(gr.invoice_date)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Roll Selection Popup ───────────────────────────────────────────── */}
            <AnimatePresence>
                {isRollPopupOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[70]" onClick={() => setIsRollPopupOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[60vh] overflow-hidden">
                                <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
                                    <h3 className="text-lg font-bold">Select Roll</h3>
                                    <button onClick={() => setIsRollPopupOpen(false)} className="text-white hover:bg-green-800 rounded-lg p-1 transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="px-4 pt-3 pb-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search roll no..."
                                            value={rollSearch}
                                            onChange={e => setRollSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="overflow-auto max-h-[calc(60vh-130px)]">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-gray-100 border-b border-border">
                                                <th className="px-4 py-3 text-sm font-semibold text-left">Roll No.</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-right">Balance Qty</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-left">UOM</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {availableRolls.filter(r => !rollSearch || r.roll_no.toLowerCase().includes(rollSearch.toLowerCase())).length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                        {availableRolls.length === 0 ? "No available rolls" : "No rolls match search"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                availableRolls
                                                    .filter(r => !rollSearch || r.roll_no.toLowerCase().includes(rollSearch.toLowerCase()))
                                                    .map(r => (
                                                        <tr key={r._id} className="hover:bg-green-50 cursor-pointer transition-colors" onClick={() => handleAddRoll(r)}>
                                                            <td className="px-4 py-3 text-sm font-mono font-semibold">{r.roll_no}</td>
                                                            <td className="px-4 py-3 text-sm text-right font-mono">{r.balance_qty}</td>
                                                            <td className="px-4 py-3 text-sm">{r.uom}</td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete Confirmation ────────────────────────────────────────────── */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                                <h3 className="text-lg font-bold text-foreground mb-2">Delete Goods Movement</h3>
                                <p className="text-muted-foreground mb-6">
                                    Are you sure you want to permanently delete <span className="font-semibold text-foreground">{movementToDelete?.gm_no}</span>? This cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
