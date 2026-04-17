'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, Plus, Filter, Pencil, ChevronLeft, ChevronRight, X,
    Truck, FileText, Settings, LayoutList, ChevronDown, ChevronUp, Trash2, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { employeeAPI, goodsReceiptHeaderAPI, goodsReceiptDetailAPI, goodsReceiptUnitsAPI, materialStatusAPI, materialAPI, materialStockAPI, purchaseOrderAPI, purchaseOrderDetailAPI, materialCategoryAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface GoodsReceiptHeader {
    active: boolean;
    _id?: string;
    material_doc_no: string;
    material_doc_date: Date | string;
    material_doc_time: string;
    material_status_id: string;
    invoice_no: string;
    invoice_date: Date | string;
    po_no: string;
    po_date: Date | string;
    received_by_emp_id: string;
    checked_by_emp_id: string;
    remarks?: string;
    supplier_coa?: string;
    last_modified_user_id: string;
    last_modified_date_time: Date | string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

interface EmployeeRecord {
    emp_id:string;
    emp_name: string;
    email: string;
    active: boolean;
    id: string;
    empId: string;
    empName: string;
    location: string;
    deptId: string;
    gender: string;
    gradeId: string;
    team: string;
    category: string;
    pfNo: string;
    esiNo: string;
    doj: string;
    dol: string;
    remarks: string;
    address: string;
    mobileNo: string;
    dob: string;
    age: string;
    married: string;
    bloodGroup: string;
    education: string;
    empPhoto: string;
    status: "Active" | "Exited";
}

interface MaterialStatus {
    matl_status_id: string;
    material_status: string;
    stock_movement?: string;
    effect_in_stock?: string;
    seq_no: number;
    active: boolean;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
}

interface Material {
    material_id: string;
    material_name: string;
    material_short_name: string;
    uom: string;
    material_category_id?: string;
    material_type: string;
    material_spec?: string;
    safety_stock_qty?: number;
    re_order_qty?: number;
    min_order_qty?: number;
    lead_time_days_min?: number | string;
    lead_time_days_max?: number | string;
    shelf_life_in_months?: number;
    gr_tolerance_percent?: number;
    qc_required?: boolean;
    coa_checklist_id?: string;
    material_image?: string;
    material_image_icon?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}

interface UnitRow {
    sno: number;
    packet_no: string;
    roll_no: string;
    gross_qty: string;
    tare_qty: string;    // display only - MaterialMaster.core_weight
    nett_qty: string;    // display only - gross - tare
    uom: string;         // display only - from GoodsReceiptDetail.uom
    status: string;      // hidden - from GR Header status
    balance_qty: string; // hidden - defaults to gross_qty
}

interface MaterialRow {
    id: string;
    sno: number;
    material_id: string;
    po_qty: string;
    gr_qty: string;
    balance_qty: string;
    uom: string;
    invoice_total_gross_qty: string;
    invoice_total_tare_qty: string;
    total_pockets: string;
    total_rolls: string;
    existing_stock_qty: string;
    existing_total_rolls: string;
    unit_split: boolean;
    gr_tolerance_percent: string;
    core_weight: string;
    expanded: boolean;
    units: UnitRow[];
}

let _rc = 0;
const newId = () => `r_${++_rc}`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}
function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GoodsReceiptHeaderPage() {
    const { toast } = useToast();

    // ── Table state ──────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery]   = useState("");
    const [items, setItems]               = useState<GoodsReceiptHeader[]>([]);
    const [loading, setLoading]           = useState(true);
    const [rowsPerPage, setRowsPerPage]   = useState<number>(10);
    const [currentPage, setCurrentPage]   = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>("active");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<GoodsReceiptHeader | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [itemToCancel, setItemToCancel] = useState<GoodsReceiptHeader | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;

    // ── Expandable rows state ─────────────────────────────────────────────────
    const [expandedDocRows,    setExpandedDocRows]    = useState<Set<string>>(new Set());
    const [expandedDetailRows, setExpandedDetailRows] = useState<Set<string>>(new Set());
    const [detailsCache,       setDetailsCache]       = useState<Record<string, any[]>>({});
    const [unitsCache,         setUnitsCache]         = useState<Record<string, any[]>>({});

    const toggleDocRow = async (docNo: string) => {
        setExpandedDocRows(prev => {
            const next = new Set(prev);
            next.has(docNo) ? next.delete(docNo) : next.add(docNo);
            return next;
        });
        if (!detailsCache[docNo]) {
            try {
                const [details, allUnits]: [any[], any[]] = await Promise.all([
                    goodsReceiptDetailAPI.getByDocNo(docNo),
                    goodsReceiptUnitsAPI.getByDocNo(docNo),
                ]);
                setDetailsCache(prev => ({ ...prev, [docNo]: details }));
                // Pre-populate units cache keyed by material_id
                const unitsByMaterial: Record<string, any[]> = {};
                for (const u of allUnits) {
                    const key = `${docNo}__${u.material_id}`;
                    if (!unitsByMaterial[key]) unitsByMaterial[key] = [];
                    unitsByMaterial[key].push(u);
                }
                setUnitsCache(prev => ({ ...prev, ...unitsByMaterial }));
            } catch {
                setDetailsCache(prev => ({ ...prev, [docNo]: [] }));
            }
        }
    };

    const toggleDetailRow = (docNo: string, materialId: string) => {
        const key = `${docNo}__${materialId}`;
        setExpandedDetailRows(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
        // Units already pre-populated by toggleDocRow
    };

    // ── Modal state ──────────────────────────────────────────────────────────
    const [isAddModalOpen,  setIsAddModalOpen]  = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem,    setSelectedItem]    = useState<GoodsReceiptHeader | null>(null);

    // ── Form state ───────────────────────────────────────────────────────────
    const isSubmittingRef = useRef(false);
    const supplierCoaInputRef = useRef<HTMLInputElement>(null);
    const [lastAction,   setLastAction]   = useState<{ type: "edit"; data: GoodsReceiptHeader } | null>(null);
    const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({});
    const [records,           setRecords]           = useState<EmployeeRecord[]>([]);
    const [statuses,          setStatuses]          = useState<MaterialStatus[]>([]);
    const [materials,         setMaterials]         = useState<Material[]>([]);
    const [materialCategories, setMaterialCategories] = useState<{ material_category_id: string; unit_split?: boolean }[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<{ po_no: string; vendor_id: string; po_date: string; status: string }[]>([]);

    // ── Material grid state ──────────────────────────────────────────────────
    const makeUnit = (sno: number, defaults?: Partial<UnitRow>): UnitRow => ({
        sno, packet_no: "", roll_no: "", gross_qty: "",
        tare_qty: "0", nett_qty: "", uom: "", status: "D", balance_qty: "",
        ...defaults,
    });
    const makeMaterialRow = (overrides?: Partial<MaterialRow>): MaterialRow => {
        const base: MaterialRow = {
            id: newId(), sno: 1, material_id: "",
            po_qty: "", gr_qty: "", balance_qty: "",
            uom: "", invoice_total_gross_qty: "", invoice_total_tare_qty: "",
            total_pockets: "", total_rolls: "",
            existing_stock_qty: "", existing_total_rolls: "",
            unit_split: false, gr_tolerance_percent: "0", core_weight: "0",
            expanded: true, units: [],
            ...overrides,
        };
        if (base.units.length === 0) {
            base.units = [makeUnit(1, { tare_qty: base.core_weight, uom: base.uom })];
        }
        return base;
    };
    const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const openPdfDataUrl = (dataUrl: string) => {
        const [header, base64] = dataUrl.split(",");
        const mime = header.match(/:(.*?);/)?.[1] ?? "application/pdf";
        const bytes = atob(base64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };
    const todayStr   = () => new Date().toISOString().split("T")[0];
    const nowTimeStr = () => {
        const n = new Date();
        return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
    };

    const emptyForm = {
        material_doc_no:    "",
        material_doc_date:  todayStr(),
        material_doc_time:  nowTimeStr(),
        material_status_id: "",
        invoice_no:         "",
        invoice_date:       "",
        po_no:              "",
        po_date:            "",
        received_by_emp_id: getSessionUser()?.user_id || "",
        checked_by_emp_id:  getSessionUser()?.user_id || "",
        remarks:            "",
        supplier_coa:       "",
        status:             "D",
    };
    const [formData, setFormData] = useState(emptyForm);

    // ── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isAddModalOpen) {
            const defaultStatus = statuses.find(s => s.seq_no === 1);
            setFormData({ ...emptyForm, material_doc_date: todayStr(), material_doc_time: nowTimeStr(), material_status_id: defaultStatus?.matl_status_id ?? "" });
            setFieldErrors({});
            setMaterialRows([makeMaterialRow()]);
        }
    }, [isAddModalOpen]);

    useEffect(() => { employeeAPI.getAll().then(setRecords).catch(console.error); }, []);
    useEffect(() => {
        materialStatusAPI.getAll().then(data => {
            setStatuses(data);
            const defaultStatus = data.find((s: MaterialStatus) => s.seq_no === 1);
            if (defaultStatus) {
                setFormData(prev => ({ ...prev, material_status_id: defaultStatus.matl_status_id }));
            }
        }).catch(console.error);
    }, []);
    useEffect(() => { materialAPI.getAll().then(setMaterials).catch(console.error); }, []);
    useEffect(() => { materialCategoryAPI.getAll().then(setMaterialCategories).catch(console.error); }, []);
    useEffect(() => { purchaseOrderAPI.getAll().then(setPurchaseOrders).catch(console.error); }, []);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const data = await goodsReceiptHeaderAPI.getAll();
            setItems(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadItems(); }, [loadItems]);
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, rowsPerPage]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const lastRecordDate = (() => {
        const dates = items
            .map(i => { const d = new Date(i.material_doc_date); return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]; })
            .filter((d): d is string => d !== null);
        return dates.length > 0 ? [...dates].sort().at(-1)! : null;
    })();

    const filteredItems = items.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            item.material_doc_no?.toLowerCase().includes(q) ||
            item.invoice_no?.toLowerCase().includes(q) ||
            item.po_no?.toLowerCase().includes(q) ||
            item.received_by_emp_id?.toLowerCase().includes(q);
        const isCancelled = item.active === false;
        const matchStatus =
            filterStatus === "all" ||
            (filterStatus === "cancelled" && isCancelled) ||
            (filterStatus === "draft"  && item.status === "D" && !isCancelled) ||
            (filterStatus === "active" && !isCancelled);
        return matchSearch && matchStatus;
    });

    const sortedItems    = [...filteredItems].sort((a, b) => new Date(b.material_doc_date).getTime() - new Date(a.material_doc_date).getTime());
    const totalPages     = Math.ceil(sortedItems.length / rowsPerPage);
    const startIndex     = (currentPage - 1) * rowsPerPage;
    const endIndex       = startIndex + rowsPerPage;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);

    // ── Validation ───────────────────────────────────────────────────────────
    const validateForm = (data: typeof emptyForm, isEdit = false): Record<string, string> => {
        const errors: Record<string, string> = {};
        const today   = todayStr();
        const nowTime = nowTimeStr();

        if (!data.material_doc_date) errors.material_doc_date = "Required.";
        else if (data.material_doc_date > today) errors.material_doc_date = "Cannot be future date.";
        else if (lastRecordDate && data.material_doc_date < lastRecordDate)
            errors.material_doc_date = `Must be >= ${lastRecordDate}.`;

        if (!data.material_doc_time) errors.material_doc_time = "Required.";
        else if (data.material_doc_date === today && data.material_doc_time > nowTime)
            errors.material_doc_time = `Cannot exceed current time (${nowTime}).`;

        if (!data.invoice_no.trim()) errors.invoice_no = "Invoice No is required.";

        if (!data.invoice_date) errors.invoice_date = "Required.";
        else if (data.invoice_date > today) errors.invoice_date = "Cannot be future date.";
        else if (data.invoice_no.trim()) {
            const dup = items.some(i => {
                if (isEdit && i.material_doc_no === selectedItem?.material_doc_no) return false;
                return i.invoice_no?.toLowerCase() === data.invoice_no.trim().toLowerCase() &&
                    i.invoice_date && new Date(i.invoice_date).toISOString().split("T")[0] === data.invoice_date;
            });
            if (dup) { errors.invoice_no = "Invoice No + Date combo already exists."; errors.invoice_date = "Invoice No + Date combo already exists."; }
        }

        if (!data.po_no.trim()) errors.po_no = "PO No is required.";

        if (!data.po_date) errors.po_date = "Required.";
        else if (data.po_date > today) errors.po_date = "Cannot be future date.";

        if (!data.remarks.trim()) errors.remarks = "Remarks is required.";

        return errors;
    };

    // ── Resolve unit_split + gr_tolerance_percent + core_weight for a material_id
    const resolveMaterialMeta = (material_id: string): { unit_split: boolean; gr_tolerance_percent: string; core_weight: string } => {
        const mat = materials.find(m => m.material_id === material_id);
        const cat = mat?.material_category_id
            ? materialCategories.find(c => c.material_category_id === mat.material_category_id)
            : undefined;
        return {
            unit_split:           cat?.unit_split ?? false,
            gr_tolerance_percent: String(mat?.gr_tolerance_percent ?? "0"),
            core_weight:          String((mat as any)?.core_weight  ?? "0"),
        };
    };

    // ── Form handlers ────────────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "po_no") {
            const selectedPO = purchaseOrders.find(po => po.po_no === value);
            const poDate = selectedPO?.po_date ? new Date(selectedPO.po_date).toISOString().split("T")[0] : "";
            setFormData(prev => ({ ...prev, po_no: value, po_date: poDate }));
            setFieldErrors(prev => { const n = { ...prev }; delete n.po_no; delete n.po_date; return n; });
            if (value) {
                purchaseOrderDetailAPI.getByPoNo(value).then((details: any[]) => {
                    if (details.length > 0) {
                        setMaterialRows(details
                            .sort((a, b) => a.sno - b.sno)
                            .map(d => {
                                const meta = resolveMaterialMeta(d.material_id || "");
                                return makeMaterialRow({
                                    sno:                  d.sno,
                                    material_id:          d.material_id || "",
                                    po_qty:               String(d.po_qty      ?? ""),
                                    gr_qty:               String(d.gr_qty      ?? ""),
                                    balance_qty:          String(d.balance_qty ?? ""),
                                    uom:                  d.uom || "",
                                    unit_split:           meta.unit_split,
                                    gr_tolerance_percent: meta.gr_tolerance_percent,
                                    core_weight:          meta.core_weight,
                                });
                            })
                        );
                    } else {
                        setMaterialRows([makeMaterialRow()]);
                    }
                }).catch(() => setMaterialRows([makeMaterialRow()]));
            } else {
                setMaterialRows([makeMaterialRow()]);
            }
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        setFieldErrors(prev => {
            const n = { ...prev };
            delete n[name];
            if (name === "invoice_no" || name === "invoice_date") { delete n.invoice_no; delete n.invoice_date; }
            return n;
        });
    };

    const submitWithStatus = async (status: "D" | "A", e: React.MouseEvent) => {
        e.preventDefault();
        const dataWithStatus = { ...formData, status };
        const errors = validateForm(dataWithStatus, false);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
            return;
        }
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            const createdHeader = await goodsReceiptHeaderAPI.create({
                ...dataWithStatus,
                last_modified_user_id:   "ADMIN",
                last_modified_date_time: new Date(),
            });
            const docNo: string = createdHeader.material_doc_no;

            const validMaterialRows = materialRows.filter(r => r.material_id.trim());
            for (const row of validMaterialRows) {
                const grossQty = Number(row.invoice_total_gross_qty) || 0;
                const tareQty  = Number(row.invoice_total_tare_qty)  || 0;
                const nettQty  = grossQty - tareQty;
                const totalRolls = row.unit_split && row.total_rolls !== "" ? Number(row.total_rolls) : 0;
                await goodsReceiptDetailAPI.create({
                    material_doc_no:         docNo,
                    material_id:             row.material_id.trim().toUpperCase(),
                    invoice_total_gross_qty: grossQty,
                    invoice_total_tare_qty:  tareQty,
                    invoice_total_nett_qty:  nettQty,
                    uom:                     row.uom.trim().toUpperCase(),
                    total_pockets:           row.unit_split && row.total_pockets !== "" ? Number(row.total_pockets) : undefined,
                    total_rolls:             row.unit_split && row.total_rolls   !== "" ? Number(row.total_rolls)   : undefined,
                    existing_stock_qty:      (Number(row.existing_stock_qty)   || 0) + nettQty,
                    existing_total_rolls:    (Number(row.existing_total_rolls) || 0) + totalRolls,
                });
                // ── Unit rows (only when unit_split) ──────────────────────────
                if (row.unit_split) {
                    const validUnits = row.units.filter(u => u.packet_no && u.roll_no && parseFloat(u.gross_qty) > 0);
                    for (const unit of validUnits) {
                        await goodsReceiptUnitsAPI.create({
                            material_doc_no: docNo,
                            material_id:     row.material_id.trim().toUpperCase(),
                            packet_no:       unit.packet_no,
                            roll_no:         unit.roll_no,
                            gross_qty:       Number(unit.gross_qty),
                            balance_qty:     unit.balance_qty !== "" ? Number(unit.balance_qty) : Number(unit.gross_qty),
                            uom:             row.uom.trim().toUpperCase(),
                            status:          status,
                        });
                    }
                }
                // ── Only update stocks + PO when status = A ──────────────────
                if (status === "A") {
                    await updateMaterialStock(row);
                    await purchaseOrderDetailAPI.addGrQty(formData.po_no, row.material_id.trim().toUpperCase(), nettQty);
                }
            }
            toast({ title: "Success", description: `${docNo} saved as ${status === "A" ? "Active" : "Draft"} with ${validMaterialRows.length} material(s).` });
            setIsAddModalOpen(false);
            setFormData(emptyForm);
            setFieldErrors({});
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
        } finally { isSubmittingRef.current = false; }
    };

    const handleSupplierCoaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "File too large", description: "Supplier COA must be ≤ 2 MB.", variant: "destructive" });
            e.target.value = "";
            return;
        }
        if (!["application/pdf", "image/jpeg", "image/jpg"].includes(file.type)) {
            toast({ title: "Invalid file type", description: "Only PDF or JPG files are allowed.", variant: "destructive" });
            e.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setFormData(prev => ({ ...prev, supplier_coa: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); e.stopPropagation();
        const errors = validateForm(formData, false);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
            return;
        }
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            const createdHeader = await goodsReceiptHeaderAPI.create({
                ...formData,
                last_modified_user_id:   "ADMIN",
                last_modified_date_time: new Date(),
            });
            const docNo: string = createdHeader.material_doc_no;
            const validMaterialRows = materialRows.filter(r => r.material_id.trim());
            for (const row of validMaterialRows) {
                const grossQty   = Number(row.invoice_total_gross_qty) || 0;
                const tareQty    = Number(row.invoice_total_tare_qty)  || 0;
                const nettQty    = grossQty - tareQty;
                const totalRolls = row.unit_split && row.total_rolls !== "" ? Number(row.total_rolls) : 0;
                await goodsReceiptDetailAPI.create({
                    material_doc_no:         docNo,
                    material_id:             row.material_id.trim().toUpperCase(),
                    invoice_total_gross_qty: grossQty,
                    invoice_total_tare_qty:  tareQty,
                    invoice_total_nett_qty:  nettQty,
                    uom:                     row.uom.trim().toUpperCase(),
                    total_pockets:           row.unit_split && row.total_pockets !== "" ? Number(row.total_pockets) : undefined,
                    total_rolls:             totalRolls || undefined,
                    existing_stock_qty:      (Number(row.existing_stock_qty)   || 0) + nettQty,
                    existing_total_rolls:    (Number(row.existing_total_rolls) || 0) + totalRolls,
                });
                if (row.unit_split) {
                    const validUnits = row.units.filter(u => u.packet_no && u.roll_no && parseFloat(u.gross_qty) > 0);
                    for (const unit of validUnits) {
                        await goodsReceiptUnitsAPI.create({
                            material_doc_no: docNo,
                            material_id:     row.material_id.trim().toUpperCase(),
                            packet_no:       unit.packet_no,
                            roll_no:         unit.roll_no,
                            gross_qty:       Number(unit.gross_qty),
                            uom:             row.uom.trim().toUpperCase(),
                            status:          formData.status || "D",
                        });
                    }
                }
            }
            toast({ title: "Success", description: `GR Header ${docNo} saved with ${validMaterialRows.length} material(s).` });
            setIsAddModalOpen(false);
            setFormData(emptyForm);
            setFieldErrors({});
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create record", variant: "destructive" });
        } finally { isSubmittingRef.current = false; }
    };

    const handleCancelItem = (item: GoodsReceiptHeader) => {
        setItemToCancel(item);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!itemToCancel) return;
        try {
            await goodsReceiptHeaderAPI.cancel(itemToCancel.material_doc_no);
            setItems(prev => prev.map(i =>
                i.material_doc_no === itemToCancel.material_doc_no ? { ...i, active: false } : i
            ));
            toast({ title: "Cancelled", description: `GR ${itemToCancel.material_doc_no} has been cancelled` });
            setIsCancelItemDialogOpen(false);
            setItemToCancel(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to cancel goods receipt", variant: "destructive" });
        }
    };

    const handleDelete = (item: GoodsReceiptHeader) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await goodsReceiptHeaderAPI.delete(itemToDelete.material_doc_no);
            toast({ title: "Deleted", description: `GR ${itemToDelete.material_doc_no} permanently deleted` });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete goods receipt", variant: "destructive" });
        }
    };

    const handleEdit = async (item: GoodsReceiptHeader) => {
        if (item.status !== "D" || item.active === false) return;
        setSelectedItem(item);
        setFormData({
            material_doc_no:    item.material_doc_no,
            material_doc_date:  item.material_doc_date ? new Date(item.material_doc_date).toISOString().split("T")[0] : "",
            material_doc_time:  item.material_doc_time || "",
            material_status_id: item.material_status_id || "",
            invoice_no:         item.invoice_no || "",
            invoice_date:       item.invoice_date ? new Date(item.invoice_date).toISOString().split("T")[0] : "",
            po_no:              item.po_no || "",
            po_date:            item.po_date ? new Date(item.po_date).toISOString().split("T")[0] : "",
            received_by_emp_id: item.received_by_emp_id || "",
            checked_by_emp_id:  item.checked_by_emp_id || "",
            remarks:            item.remarks || "",
            supplier_coa:       item.supplier_coa || "",
            status:             item.status || "D",
        });
        setFieldErrors({});
        try {
            const [details, units]: [any[], any[]] = await Promise.all([
                goodsReceiptDetailAPI.getByDocNo(item.material_doc_no),
                goodsReceiptUnitsAPI.getByDocNo(item.material_doc_no),
            ]);
            if (details.length > 0) {
                const rows: MaterialRow[] = details.map((d: any) => {
                    const rowUnits: UnitRow[] = units
                        .filter((u: any) => u.material_id === d.material_id)
                        .sort((a: any, b: any) => a.sno - b.sno)
                        .map((u: any) => ({
                            sno:         u.sno,
                            packet_no:   u.packet_no || "",
                            roll_no:     u.roll_no   || "",
                            gross_qty:   String(u.gross_qty   ?? ""),
                            tare_qty:    String(u.tare_qty    ?? "0"),
                            nett_qty:    String(u.nett_qty    ?? ""),
                            uom:         u.uom         || "",
                            status:      u.status      || "D",
                            balance_qty: String(u.balance_qty ?? u.gross_qty ?? ""),
                        }));
                    const editMeta = resolveMaterialMeta(d.material_id || "");
                    return {
                        id:                      d._id || newId(),
                        _id:                     d._id,
                        sno:                     d.sno ?? 1,
                        material_id:             d.material_id || "",
                        po_qty:                  String(d.po_qty      ?? ""),
                        gr_qty:                  String(d.gr_qty      ?? ""),
                        balance_qty:             String(d.balance_qty ?? ""),
                        uom:                     d.uom || "",
                        invoice_total_gross_qty: String(d.invoice_total_gross_qty ?? ""),
                        invoice_total_tare_qty:  String(d.invoice_total_tare_qty  ?? ""),
                        total_pockets:           String(d.total_pockets ?? ""),
                        total_rolls:             String(d.total_rolls   ?? ""),
                        existing_stock_qty:      String(d.existing_stock_qty   ?? ""),
                        existing_total_rolls:    String(d.existing_total_rolls ?? ""),
                        unit_split:              editMeta.unit_split,
                        gr_tolerance_percent:    editMeta.gr_tolerance_percent,
                        core_weight:             editMeta.core_weight,
                        expanded:                true,
                        units:                   rowUnits.length > 0 ? rowUnits : [makeUnit(1)],
                    };
                });
                setMaterialRows(rows);
            } else {
                setMaterialRows([makeMaterialRow()]);
            }
        } catch {
            setMaterialRows([makeMaterialRow()]);
        }
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); e.stopPropagation();
        const errors = validateForm(formData, true);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
            return;
        }
        if (isSubmittingRef.current || !selectedItem) return;
        isSubmittingRef.current = true;
        const previousData = { ...selectedItem };
        try {
            const docNo = selectedItem.material_doc_no;
            await goodsReceiptHeaderAPI.update(docNo, {
                ...formData,
                last_modified_user_id:   "ADMIN",
                last_modified_date_time: new Date(),
            });
            const validMaterialRows = materialRows.filter(r => r.material_id.trim());
            await goodsReceiptDetailAPI.deleteByDocNo(docNo);
            await goodsReceiptUnitsAPI.deleteByDocNo(docNo);
            for (const row of validMaterialRows) {
                const grossQty   = Number(row.invoice_total_gross_qty) || 0;
                const tareQty    = Number(row.invoice_total_tare_qty)  || 0;
                const nettQty    = grossQty - tareQty;
                const totalRolls = row.unit_split && row.total_rolls !== "" ? Number(row.total_rolls) : 0;
                await goodsReceiptDetailAPI.create({
                    material_doc_no:         docNo,
                    material_id:             row.material_id.trim().toUpperCase(),
                    invoice_total_gross_qty: grossQty,
                    invoice_total_tare_qty:  tareQty,
                    invoice_total_nett_qty:  nettQty,
                    uom:                     row.uom.trim().toUpperCase(),
                    total_pockets:           row.unit_split && row.total_pockets !== "" ? Number(row.total_pockets) : undefined,
                    total_rolls:             totalRolls || undefined,
                    existing_stock_qty:      (Number(row.existing_stock_qty)   || 0) + nettQty,
                    existing_total_rolls:    (Number(row.existing_total_rolls) || 0) + totalRolls,
                });
                if (row.unit_split) {
                    const validUnits = row.units.filter(u => u.packet_no && u.roll_no && parseFloat(u.gross_qty) > 0);
                    for (const unit of validUnits) {
                        await goodsReceiptUnitsAPI.create({
                            material_doc_no: docNo,
                            material_id:     row.material_id.trim().toUpperCase(),
                            packet_no:       unit.packet_no,
                            roll_no:         unit.roll_no,
                            gross_qty:       Number(unit.gross_qty),
                            uom:             row.uom.trim().toUpperCase(),
                            status:          formData.status || "D",
                        });
                    }
                }
                // ── Only update stocks + PO on Active save ────────────────────
                if (formData.status === "A") {
                    await updateMaterialStock(row);
                    await purchaseOrderDetailAPI.addGrQty(formData.po_no, row.material_id.trim().toUpperCase(), nettQty);
                }
            }
            // Invalidate cache for this doc so it refreshes on next expand
            setDetailsCache(prev => { const n = { ...prev }; delete n[docNo]; return n; });
            setUnitsCache(prev => {
                const n = { ...prev };
                Object.keys(n).filter(k => k.startsWith(`${docNo}__`)).forEach(k => delete n[k]);
                return n;
            });
            setLastAction({ type: "edit", data: previousData });
            toast({
                title: "Updated",
                description: `${docNo} updated with ${validMaterialRows.length} material(s).`,
                action: <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>,
            });
            setIsEditModalOpen(false);
            setSelectedItem(null);
            setFormData(emptyForm);
            setFieldErrors({});
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
        } finally { isSubmittingRef.current = false; }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        try {
            await goodsReceiptHeaderAPI.update(lastAction.data.material_doc_no, { ...lastAction.data, last_modified_user_id: "ADMIN", last_modified_date_time: new Date() });
            toast({ title: "Undone", description: "Changes reverted" });
            setLastAction(null);
            loadItems();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Undo failed", variant: "destructive" });
        }
    };

    // ── Material grid handlers ────────────────────────────────────────────────
    // ── Fetch stock + meta when a material is selected ────────────────────────
    const handleMaterialSelect = async (rowId: string, material_id: string) => {
        const meta = resolveMaterialMeta(material_id);
        // ── Step 1: set material_id + meta immediately, clear stock fields ──
        setMaterialRows(prev => prev.map(r =>
            r.id !== rowId ? r : {
                ...r,
                material_id,
                existing_stock_qty:   "",
                existing_total_rolls: "",
                unit_split:           meta.unit_split,
                gr_tolerance_percent: meta.gr_tolerance_percent,
                core_weight:          meta.core_weight,
                total_pockets:        meta.unit_split ? r.total_pockets : "",
                total_rolls:          meta.unit_split ? r.total_rolls   : "",
            }
        ));

        if (!material_id) return;

        // ── Step 2: fetch MaterialStocks and set in one atomic update ──
        try {
            const stock = await materialStockAPI.getByMaterialId(material_id);
            setMaterialRows(prev => prev.map(r =>
                r.id !== rowId ? r : {
                    ...r,
                    existing_stock_qty:   stock?.current_stock_qty  != null ? String(stock.current_stock_qty)  : "0",
                    existing_total_rolls: stock?.total_no_of_rolls  != null ? String(stock.total_no_of_rolls)  : "0",
                }
            ));
        } catch {
            setMaterialRows(prev => prev.map(r =>
                r.id !== rowId ? r : {
                    ...r,
                    existing_stock_qty:   "0",
                    existing_total_rolls: "0",
                }
            ));
        }
    };

    // ── After saving GR, push updated stock figures back to MaterialStocks ──────
    const updateMaterialStock = async (row: MaterialRow) => {
        const material_id = row.material_id.trim().toUpperCase();
        const nettQty     = (Number(row.invoice_total_gross_qty) || 0) - (Number(row.invoice_total_tare_qty) || 0);
        const newStockQty = (Number(row.existing_stock_qty)   || 0) + nettQty;
        const newTotRolls = (Number(row.existing_total_rolls) || 0) + (Number(row.total_rolls) || 0);
        // uom is required by MaterialStocks schema — pass from row, fallback to "KG"
        const uom         = row.uom?.trim().toUpperCase() || "KG";
        try {
            await materialStockAPI.update(material_id, {
                current_stock_qty:     newStockQty,
                total_no_of_rolls:     newTotRolls,
                uom,
                last_modified_user_id: "ADMIN",
            });
        } catch (err: any) {
            console.error(`[MaterialStock] FAILED for ${material_id}:`, err?.message || err);
            toast({
                title:       "Stock Update Warning",
                description: `MaterialStock update failed for ${material_id}: ${err?.message || "Unknown error"}`,
                variant:     "destructive",
            });
        }
    };

    const addMaterialRow      = () => setMaterialRows(p => [...p, makeMaterialRow()]);
    const removeMaterialRow   = (id: string) => setMaterialRows(p => p.filter(r => r.id !== id));
    const toggleExpand        = (id: string) => setMaterialRows(p => p.map(r => r.id === id ? { ...r, expanded: !r.expanded } : r));
    const updateMaterialField = (id: string, field: keyof MaterialRow, value: any) =>
        setMaterialRows(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));

    // Add unit row; default packet_no + roll_no stem from previous row
    const addUnit = (rid: string, defaults?: Partial<UnitRow>) =>
        setMaterialRows(p => p.map(r => {
            if (r.id !== rid) return r;
            const tare = r.core_weight || "0";
            const uom  = r.uom || "";
            return { ...r, units: [...r.units, makeUnit(r.units.length + 1, { tare_qty: tare, uom, ...defaults })] };
        }));

    const removeUnit = (rid: string, sno: number) =>
        setMaterialRows(p => p.map(r => r.id !== rid ? r : {
            ...r, units: r.units.filter(u => u.sno !== sno).map((u, i) => ({ ...u, sno: i + 1 }))
        }));

    // Update a unit field; recompute nett_qty and balance_qty when gross changes
    const updateUnit = (rid: string, sno: number, field: keyof UnitRow, value: string) =>
        setMaterialRows(p => p.map(r => {
            if (r.id !== rid) return r;
            const units = r.units.map(u => {
                if (u.sno !== sno) return u;
                const upd = { ...u, [field]: value };
                const gross = parseFloat(field === "gross_qty" ? value : u.gross_qty) || 0;
                const tare  = parseFloat(u.tare_qty) || 0;
                upd.nett_qty    = gross > 0 ? (gross - tare).toFixed(3) : "";
                upd.balance_qty = gross > 0 ? String(gross) : ""; // defaults to gross_qty
                return upd;
            });
            return { ...r, units };
        }));

    // ── renderFormFields ──────────────────────────────────────────────────────
    const renderFormFields = (disabled = false) => {
        const today   = todayStr();
        const minDate = (lastRecordDate && lastRecordDate <= today) ? lastRecordDate : undefined;

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* 1. DOCUMENT DETAILS */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] tracking-widest uppercase">
                                <FileText size={14} /><span>Document Details</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Doc No.:</span>
                                <span className="text-[10px] font-mono text-slate-600">
                                    {disabled && formData.material_doc_no
                                        ? formData.material_doc_no
                                        : <span className="italic opacity-50">M{String(new Date().getFullYear()).slice(-2)}XXXXX</span>}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Doc Type</label>
                                <div className="w-full h-9 px-2 border border-slate-200 rounded-md bg-slate-50 text-xs flex items-center text-slate-700">
                                    {(() => {
                                        const s = statuses.find(s => s.matl_status_id === formData.material_status_id);
                                        return s ? `${s.matl_status_id} - ${s.material_status}` : formData.material_status_id || "-";
                                    })()}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date *</label>
                                    <Input type="date" name="material_doc_date" value={formData.material_doc_date as string}
                                        onChange={handleInputChange} min={minDate} max={today}
                                        className={`h-9 text-xs border-slate-200 ${fieldErrors.material_doc_date ? "border-red-500 bg-red-50" : ""}`} />
                                    {fieldErrors.material_doc_date && <p className="text-red-500 text-[10px] mt-0.5">{fieldErrors.material_doc_date}</p>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Time *</label>
                                    <Input type="time" name="material_doc_time" value={formData.material_doc_time}
                                        onChange={handleInputChange}
                                        max={formData.material_doc_date === today ? nowTimeStr() : undefined}
                                        className={`h-9 text-xs border-slate-200 ${fieldErrors.material_doc_time ? "border-red-500 bg-red-50" : ""}`} />
                                    {fieldErrors.material_doc_time && <p className="text-red-500 text-[10px] mt-0.5">{fieldErrors.material_doc_time}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. SOURCE DETAILS */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] mb-4 tracking-widest uppercase">
                            <Truck size={14} /><span>Source Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PO No. *</label>
                                <select name="po_no" value={formData.po_no} onChange={handleInputChange}
                                    className={`h-9 text-xs border border-slate-200 rounded-md w-full px-2 bg-background focus:ring-2 focus:ring-blue-500 outline-none ${fieldErrors.po_no ? "border-red-500 bg-red-50" : ""}`}>
                                    <option value="">Select PO No.</option>
                                    {purchaseOrders.filter(po =>po.status === 'A').map(po => (
                                        <option key={po.po_no} value={po.po_no}>{po.po_no}</option>
                                    ))}
                                </select>
                                {fieldErrors.po_no && <p className="text-red-500 text-[10px] mt-0.5">{fieldErrors.po_no}</p>}
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PO Date *</label>
                                <div className={`h-9 px-2 border rounded-md bg-slate-50 text-xs flex items-center text-slate-700 ${fieldErrors.po_date ? "border-red-500" : "border-slate-200"}`}>
                                    {formData.po_date ? formatDate(formData.po_date) : "-"}
                                </div>
                                {fieldErrors.po_date && <p className="text-red-500 text-[10px] mt-0.5">{fieldErrors.po_date}</p>}
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Invoice No. *</label>
                                <Input name="invoice_no" value={formData.invoice_no} onChange={handleInputChange} placeholder="INV-..." maxLength={10}
                                    className={`h-9 text-xs border-slate-200 ${fieldErrors.invoice_no ? "border-red-500 bg-red-50" : ""}`} />
                                {fieldErrors.invoice_no && <p className="text-red-500 text-[10px] mt-0.5">{fieldErrors.invoice_no}</p>}
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Invoice Date *</label>
                                <Input type="date" name="invoice_date" value={formData.invoice_date as string} onChange={handleInputChange} max={today}
                                    className={`h-9 text-xs border-slate-200 ${fieldErrors.invoice_date ? "border-red-500 bg-red-50" : ""}`} />
                                {fieldErrors.invoice_date && <p className="text-red-500 text-[10px] mt-0.5">{fieldErrors.invoice_date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* 3. SYSTEM INFO */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] mb-4 tracking-widest uppercase">
                            <Settings size={14} /><span>System Info</span>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Performed By *</label>
                                    <select name="received_by_emp_id" value={formData.received_by_emp_id} onChange={handleInputChange}
                                        className="w-full h-9 px-2 border border-slate-200 rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-none">
                                        <option value="">Select</option>
                                        {records.filter(r => r.active).map(r => <option key={r.id} value={r.emp_id}>{r.emp_id}-{r.emp_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Checked By *</label>
                                    <select name="checked_by_emp_id" value={formData.checked_by_emp_id} onChange={handleInputChange}
                                        className="w-full h-9 px-2 border border-slate-200 rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-none">
                                        <option value="">Select</option>
                                        {records.filter(r => r.active).map(r => <option key={r.id} value={r.emp_id}>{r.emp_id}-{r.emp_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${selectedItem?.active === false ? "bg-red-100 text-red-600" : formData.status === "A" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    <span className="w-2 h-2 rounded-full bg-current" />
                                    {selectedItem?.active === false ? "CANCELLED" : formData.status === "A" ? "ACTIVE" : "DRAFT MODE"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── REMARKS ── */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] mb-3 tracking-widest uppercase">
                        <MessageSquare size={14} /><span>Remarks</span>
                    </div>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange}
                        placeholder="Enter remarks..." maxLength={100} rows={2}
                        className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${fieldErrors.remarks ? "border-red-500 bg-red-50" : "border-slate-200"}`} />
                    <div className="flex items-center justify-between mt-0.5">
                        {fieldErrors.remarks ? <p className="text-red-500 text-[10px]">{fieldErrors.remarks}</p> : <span />}
                        <span className="text-[10px] text-slate-400 ml-auto">{formData.remarks.length}/100</span>
                    </div>

                    {/* Supplier COA Attachment */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Supplier COA <span className="text-slate-300 font-normal normal-case">(PDF / JPG · max 2 MB)</span></label>
                        <div className="flex items-center gap-2">
                            <button type="button"
                                onClick={() => supplierCoaInputRef.current?.click()}
                                className="h-8 px-3 text-xs border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition-colors">
                                {formData.supplier_coa ? "Replace File" : "Upload File"}
                            </button>
                            {formData.supplier_coa ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {formData.supplier_coa.startsWith("data:image") ? (
                                        <img src={formData.supplier_coa} alt="Supplier COA preview"
                                            className="h-8 w-8 object-cover rounded border border-slate-200" />
                                    ) : (
                                        <span className="text-xs text-slate-500 truncate">PDF attached</span>
                                    )}
                                    <button type="button"
                                        onClick={() => { setFormData(prev => ({ ...prev, supplier_coa: "" })); if (supplierCoaInputRef.current) supplierCoaInputRef.current.value = ""; }}
                                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                                        <X size={13} />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-400">No file selected</span>
                            )}
                        </div>
                        <input ref={supplierCoaInputRef} type="file" accept=".pdf,.jpg,.jpeg"
                            className="hidden" onChange={handleSupplierCoaUpload} />
                    </div>
                </div>

                {/* ── MATERIALS GRID ── */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <LayoutList size={14} className="text-slate-500" />
                            <span className="text-[11px] font-bold text-slate-600 tracking-widest uppercase">Materials Grid</span>
                        </div>
                        {/* <button type="button" onClick={addMaterialRow}
                            className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors">
                            <Plus size={13} /> Add Material Row
                        </button> */}
                    </div> 

                    {/* Material column headers */}
                    <div className="grid items-center px-4 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        style={{ gridTemplateColumns: "28px 32px 2fr 0.7fr 0.7fr 0.7fr 0.6fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr 0.6fr 0.8fr 0.8fr 36px" }}>
                        <div />
                        <div className="text-center">S.No</div>
                        <div>Material ID / Description</div>
                        <div className="text-right pr-1">PO Qty</div>
                        <div className="text-right pr-1">GR Qty</div>
                        <div className="text-right pr-1">Bal Qty</div>
                        <div className="text-center">UOM</div>
                        <div className="text-right pr-1">Gross Qty*</div>
                        <div className="text-right pr-1">Tare Qty*</div>
                        <div className="text-right pr-1">Nett Qty</div>
                        <div className="text-center">Unit Split</div>
                        <div className="text-center">Pockets</div>
                        <div className="text-center">Rolls</div>
                        <div className="text-center">Exist. Stock</div>
                        <div className="text-center">Exist. Rolls</div>
                        <div className="text-center">Del</div>
                    </div>

                    {materialRows.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-xs italic">
                            No materials added yet. Click + Add Material Row to begin.
                        </div>
                    )}

                    {materialRows.map(row => {
                        const grossVal = Number(row.invoice_total_gross_qty) || 0;
                        const tareVal  = Number(row.invoice_total_tare_qty)  || 0;
                        const nettVal  = grossVal > 0 ? (grossVal - tareVal).toFixed(3) : "";
                        const balQty   = Number(row.balance_qty) || 0;
                        const tolPct   = Number(row.gr_tolerance_percent) || 0;
                        const poQty    = Number(row.po_qty) || 0;
                        const maxNett  = balQty + (poQty * tolPct / 100);
                        const nettOver = nettVal !== "" && Number(nettVal) > maxNett && maxNett > 0;
                        const tareErr  = row.invoice_total_tare_qty !== "" && row.invoice_total_gross_qty !== "" && tareVal >= grossVal;
                        return (
                        <div key={row.id} className="border-b border-slate-100 last:border-0">
                            <div className="grid items-center px-4 py-2.5 gap-x-2 hover:bg-slate-50/60 transition-colors"
                                style={{ gridTemplateColumns: "28px 32px 2fr 0.7fr 0.7fr 0.7fr 0.6fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr 0.6fr 0.8fr 0.8fr 36px" }}>
                                <button type="button" onClick={() => toggleExpand(row.id)}
                                    className="text-blue-500 hover:text-blue-700 flex items-center justify-center">
                                    {row.expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                                </button>
                                {/* S.No - display only */}
                                <div className="h-9 flex items-center justify-center border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-500 font-mono select-none">
                                    {row.sno}
                                </div>
                                {/* Material ID - display only */}
                                <div className="h-9 flex flex-col justify-center border border-slate-100 rounded-md bg-slate-50 px-2 select-none overflow-hidden">
                                    <span className="text-xs text-slate-700 font-mono truncate">{row.material_id || "—"}</span>
                                    {row.material_id && (
                                        <span className="text-xs text-slate-400 truncate">
                                            {materials.find(m => m.material_id === row.material_id)?.material_name || ""}
                                        </span>
                                    )}
                                </div>
                                {/* PO Qty - display only */}
                                <div className="h-9 flex items-center justify-end pr-2 border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-600 font-mono select-none">
                                    {row.po_qty || "—"}
                                </div>
                                {/* GR Qty - display only */}
                                <div className="h-9 flex items-center justify-end pr-2 border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-600 font-mono select-none">
                                    {row.gr_qty || "—"}
                                </div>
                                {/* Balance Qty - display only */}
                                <div className="h-9 flex items-center justify-end pr-2 border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-600 font-mono select-none">
                                    {row.balance_qty || "—"}
                                </div>
                                {/* UOM - display only */}
                                <div className="h-9 flex items-center justify-center border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-600 select-none">
                                    {row.uom || "—"}
                                </div>
                                {/* Gross Qty - entry */}
                                <Input value={row.invoice_total_gross_qty}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^\d{0,6}(\.\d{0,3})?$/.test(val) && (val === "" || parseFloat(val) <= 999999.999))
                                            updateMaterialField(row.id, "invoice_total_gross_qty", val);
                                    }}
                                    placeholder="0.000" type="text" inputMode="decimal"
                                    className="h-9 text-xs text-right border-slate-200" />
                                {/* Tare Qty - entry */}
                                <Input value={row.invoice_total_tare_qty}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^\d{0,6}(\.\d{0,3})?$/.test(val) && (val === "" || parseFloat(val) <= 999999.999))
                                            updateMaterialField(row.id, "invoice_total_tare_qty", val);
                                    }}
                                    placeholder="0.000" type="text" inputMode="decimal"
                                    className={`h-9 text-xs text-right ${tareErr ? "border-red-500 bg-red-50" : "border-slate-200"}`} />
                                {/* Nett Qty - display only (computed) */}
                                <div className={`h-9 flex items-center justify-end pr-2 border rounded-md text-xs font-semibold select-none ${nettOver ? "border-red-400 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                    {nettVal || "—"}
                                </div>
                                {/* Unit Split - display only */}
                                <div className={`h-9 flex items-center justify-center border border-slate-100 rounded-md text-[10px] font-bold select-none ${row.unit_split ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"}`}>
                                    {row.unit_split ? "Yes" : "No"}
                                </div>
                                {/* Pockets - entry only when unit_split=true */}
                                {row.unit_split ? (
                                    <Input value={row.total_pockets}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (/^\d{0,3}$/.test(val) && (val === "" || parseInt(val) <= 999))
                                                updateMaterialField(row.id, "total_pockets", val);
                                        }}
                                        placeholder="0" type="text" inputMode="numeric"
                                        className="h-9 text-xs border-slate-200 text-center" />
                                ) : (
                                    <div className="h-9 flex items-center justify-center border border-slate-100 rounded-md bg-slate-100 text-xs text-slate-300 select-none">—</div>
                                )}
                                {/* Rolls - entry only when unit_split=true */}
                                {row.unit_split ? (
                                    <Input value={row.total_rolls}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (/^\d{0,3}$/.test(val) && (val === "" || parseInt(val) <= 999))
                                                updateMaterialField(row.id, "total_rolls", val);
                                        }}
                                        placeholder="0" type="text" inputMode="numeric"
                                        className="h-9 text-xs border-slate-200 text-center" />
                                ) : (
                                    <div className="h-9 flex items-center justify-center border border-slate-100 rounded-md bg-slate-100 text-xs text-slate-300 select-none">—</div>
                                )}
                                {/* Exist Stock - display only */}
                                <div className="h-9 flex items-center justify-center border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-400 select-none">
                                    {row.existing_stock_qty || "—"}
                                </div>
                                {/* Exist Rolls - display only */}
                                <div className="h-9 flex items-center justify-center border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-400 select-none">
                                    {row.existing_total_rolls || "—"}
                                </div>
                                <button type="button" onClick={() => removeMaterialRow(row.id)}
                                    className="flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            {row.expanded && row.unit_split && (
                                <div className="mx-4 mb-3 border border-blue-200 rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase tracking-widest">
                                            <span className="font-mono">↳</span> Goods Receipt Units
                                        </div>
                                        <button type="button" onClick={() => {
                                            const prev = row.units[row.units.length - 1];
                                            const prevRollStem = prev?.roll_no ? prev.roll_no.replace(/\d+$/, "") : "";
                                            addUnit(row.id, {
                                                packet_no: prev?.packet_no || "",
                                                roll_no:   prevRollStem,
                                            });
                                        }}
                                            className="flex items-center gap-1 text-blue-600 text-[10px] font-bold hover:text-blue-800 transition-colors">
                                            <Plus size={11} /> Add Unit
                                        </button>
                                    </div>
                                    {/* Unit column headers */}
                                    <div className="grid items-center px-4 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-white"
                                        style={{ gridTemplateColumns: "28px 1.2fr 1.2fr 0.9fr 0.9fr 0.9fr 0.7fr 24px" }}>
                                        <div>S.No</div>
                                        <div>Packet No *</div>
                                        <div>Roll No *</div>
                                        <div className="text-right pr-1">Gross Qty *</div>
                                        <div className="text-right pr-1">Tare Qty</div>
                                        <div className="text-right pr-1">Nett Qty</div>
                                        <div className="text-center">UOM</div>
                                        <div />
                                    </div>
                                    {row.units.length === 0 && (
                                        <div className="py-4 text-center text-[10px] text-slate-400 italic">No units yet — click + Add Unit.</div>
                                    )}
                                    {row.units.map((unit, unitIdx) => {
                                        // Duplicate roll_no check within this material row
                                        const dupRoll = unit.roll_no && row.units.some(
                                            (u, i) => i !== unitIdx && u.roll_no === unit.roll_no
                                        );
                                        return (
                                        <div key={unit.sno}
                                            className="grid items-center px-4 py-1.5 gap-x-2 border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors"
                                            style={{ gridTemplateColumns: "28px 1.2fr 1.2fr 0.9fr 0.9fr 0.9fr 0.7fr 24px" }}>
                                            {/* S.No - display only */}
                                            <span className="text-[10px] text-slate-400 font-mono">{unit.sno}</span>
                                            {/* Packet No */}
                                            <Input value={unit.packet_no}
                                                onChange={e => updateUnit(row.id, unit.sno, "packet_no", e.target.value)}
                                                placeholder="PKT-001" maxLength={10}
                                                className={`h-8 text-xs px-2 ${!unit.packet_no ? "border-slate-200" : "border-slate-200"}`} />
                                            {/* Roll No */}
                                            <Input value={unit.roll_no}
                                                onChange={e => updateUnit(row.id, unit.sno, "roll_no", e.target.value)}
                                                placeholder="ROLL-01" maxLength={10}
                                                className={`h-8 text-xs px-2 ${dupRoll ? "border-red-500 bg-red-50" : !unit.roll_no ? "border-slate-200" : "border-slate-200"}`} />
                                            {/* Gross Qty - entry; Enter key auto-adds next row */}
                                            <Input value={unit.gross_qty}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (/^\d{0,6}(\.\d{0,3})?$/.test(val) && (val === "" || parseFloat(val) <= 999999.999))
                                                        updateUnit(row.id, unit.sno, "gross_qty", val);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter" && unit.packet_no && unit.roll_no && parseFloat(unit.gross_qty) > 0) {
                                                        e.preventDefault();
                                                        const prev = unit;
                                                        const rollStem = prev.roll_no.replace(/\d+$/, "");
                                                        addUnit(row.id, { packet_no: prev.packet_no, roll_no: rollStem });
                                                    }
                                                }}
                                                placeholder="0.000" type="text" inputMode="decimal"
                                                className={`h-8 text-xs text-right px-2 ${!unit.gross_qty || parseFloat(unit.gross_qty) <= 0 ? "border-slate-200" : "border-slate-200"}`} />
                                            {/* Tare Qty - display only (core_weight) */}
                                            <div className="h-8 flex items-center justify-end pr-2 border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-500 font-mono select-none">
                                                {unit.tare_qty || "0"}
                                            </div>
                                            {/* Nett Qty - display only (gross - tare) */}
                                            <div className="h-8 flex items-center justify-end pr-2 border border-slate-200 rounded-md bg-slate-50 text-xs font-semibold text-slate-700 select-none">
                                                {unit.nett_qty || "—"}
                                            </div>
                                            {/* UOM - display only (from detail row) */}
                                            <div className="h-8 flex items-center justify-center border border-slate-100 rounded-md bg-slate-50 text-xs text-slate-600 select-none">
                                                {unit.uom || "—"}
                                            </div>
                                            <button type="button" onClick={() => removeUnit(row.id, unit.sno)}
                                                className="flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors">
                                                <X size={12} />
                                            </button>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ── renderModal ───────────────────────────────────────────────────────────
    const renderModal = (isEdit: boolean) => {
        const closeModal = () => isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false);

        return (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50" onClick={closeModal} />
                <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 16 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col pointer-events-auto">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                                <FileText size={17} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-slate-800 leading-tight">
                                    {isEdit ? `Edit GR Header — ${selectedItem?.material_doc_no}` : "New Goods Receipt Entry"}
                                </h2>
                                <p className="text-[10px] font-semibold text-slate-400 tracking-widest">INDUSTRIAL ERP MODULE • GRN PORTAL</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {renderFormFields(isEdit)}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                            <Button type="button" variant="outline" onClick={closeModal}
                                className="border-slate-300 text-slate-600 hover:bg-slate-100">Discard</Button>
                            {!isEdit && (
                                <Button type="button" variant="outline"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                                    disabled={isSubmittingRef.current}
                                    onClick={(e) => submitWithStatus("D", e)}>
                                    Save Draft
                                </Button>
                            )}
                            <Button type="button"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 flex items-center gap-2"
                                disabled={isSubmittingRef.current}
                                onClick={(e) => isEdit ? handleEditSubmit(e as any) : submitWithStatus("A", e)}>
                                {isEdit ? "Update GR Header" : (
                                    <><span className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold">✓</span> Submit for Review</>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Goods Receipt</h1>
                                <p className="text-muted-foreground">Manage Goods Receipt records</p>
                            </div>
                            <Button onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                                <Plus className="w-5 h-5" /> Add New GR
                            </Button>
                        </div>
                    </motion.div>


                    {/* Search / Filter bar */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input placeholder="Search by Doc No, Invoice No, PO No, Employee ID..."
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredItems.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filteredItems.length)} OF {filteredItems.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="end">
                                        <div className="p-4 border-b"><h3 className="font-semibold text-sm">Filters</h3></div>
                                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold">Status</Label>
                                                <div className="space-y-2">
                                                    {[["all","All"],["active","Active"],["draft","Draft (D)"],["cancelled","Cancelled"]].map(([val,label]) => (
                                                        <div key={val} className="flex items-center gap-2">
                                                            <input type="radio" id={`sf-${val}`} name="sf" checked={filterStatus === val} onChange={() => setFilterStatus(val)} className="h-4 w-4" />
                                                            <Label htmlFor={`sf-${val}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t">
                                                <Label className="text-sm font-semibold">Rows per screen</Label>
                                                <select value={rowsPerPage} onChange={e => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                                                    {[5,10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t bg-muted/30">
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
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            {[
                                                { label: "" },

                                                { label: "Material Doc No" },
                                                { label: ["Material Doc","Date"] },
                                                { label: ["Material Doc","Time"] },
                                                { label: ["Material","Status ID"] },
                                                { label: "Invoice No" },
                                                { label: ["Invoice","Date"] },
                                                { label: "PO No" },
                                                { label: ["PO","Date"] },
                                                { label: ["Supplier","Coa"] },
                                                { label: ["Received By","Emp ID"] },
                                                { label: ["Checked By","Emp ID"] },
                                                { label: "Remarks" },
                                                { label: ["Last Modified","User ID"] },
                                                { label: ["Last Modified","Date & Time"] },
                                                { label: "Status" },
                                                { label: "Actions", center: true },
                                            ].map((col, i) => (
                                                <th key={i} className={`px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap ${(col as any).center ? "text-center" : "text-left"}`}>
                                                    {Array.isArray(col.label)
                                                        ? <div className="flex flex-col">{col.label.map((l,j) => <span key={j}>{l}</span>)}</div>
                                                        : col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={16} className="px-6 py-8 text-center text-muted-foreground">Loading records...</td></tr>
                                        ) : filteredItems.length === 0 ? (
                                            <tr><td colSpan={16} className="px-6 py-8 text-center text-muted-foreground">No records found</td></tr>
                                        ) : paginatedItems.map((item, index) => {
                                            const docNo         = item.material_doc_no;
                                            const isDocExpanded = expandedDocRows.has(docNo);
                                            const details       = detailsCache[docNo] || [];

                                            return (
                                                <React.Fragment key={docNo}>
                                                    {/* ── Main row ── */}
                                                    <motion.tr
                                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${isDocExpanded ? "bg-blue-50/40" : ""}`}>
                                                              <td className="px-4 py-4 text-center align-middle">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); toggleDocRow(docNo); }}
                                                                className={`p-1.5 rounded-md transition-colors ${isDocExpanded ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}
                                                                title="Show GR Details">
                                                                {isDocExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm align-middle">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">{docNo}</span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm align-middle">{formatDate(item.material_doc_date)}</td>
                                                        <td className="px-4 py-4 text-sm align-middle">{item.material_doc_time || "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs">{item.material_status_id}</span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm align-middle">{item.invoice_no || "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle">{item.invoice_date ? formatDate(item.invoice_date) : "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle">{item.po_no || "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle">{item.po_date ? formatDate(item.po_date) : "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle">
                                                            {item.supplier_coa ? (
                                                                item.supplier_coa.startsWith("data:image") ? (
                                                                    <a href={item.supplier_coa} target="_blank" rel="noopener noreferrer">
                                                                        <img src={item.supplier_coa} alt="Supplier COA" className="h-8 w-8 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer" />
                                                                    </a>
                                                                ) : (
                                                                    <button type="button" onClick={() => openPdfDataUrl(item.supplier_coa!)}
                                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                                        View PDF
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-4 text-sm align-middle font-mono">{item.received_by_emp_id}</td>
                                                        <td className="px-4 py-4 text-sm align-middle font-mono">{item.checked_by_emp_id}</td>
                                                        <td className="px-4 py-4 text-sm align-middle max-w-[120px] truncate text-muted-foreground">{item.remarks || "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle font-mono">{item.last_modified_user_id || "-"}</td>
                                                        <td className="px-4 py-4 text-sm align-middle whitespace-nowrap">{item.last_modified_date_time ? formatDateTime(item.last_modified_date_time) : "-"}</td>
                                                        <td className="px-4 py-4 align-middle">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${item.active === false ? "bg-red-50 text-red-600" : item.status === "A" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                                                                {item.active === false ? "Cancelled" : item.status === "A" ? "Active" : "Draft"}
                                                            </span>
                                                        </td>
                                                        {/* Details expand */}
                                                      
                                                        <td className="px-4 py-4 text-center align-middle">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button variant="ghost" size="sm"
                                                                    onClick={e => { e.stopPropagation(); handleEdit(item); }}
                                                                    disabled={item.status !== "D" || item.active === false}
                                                                    className={item.status === "D" && item.active !== false ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed"}
                                                                    title={item.status !== "D" ? "Only Draft records can be edited" : "Edit"}>
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm"
                                                                    onClick={e => { e.stopPropagation(); handleCancelItem(item); }}
                                                                    disabled={item.active === false}
                                                                    className={item.active !== false ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-gray-400 cursor-not-allowed"}
                                                                    title={item.active !== false ? "Cancel GR" : "Already cancelled"}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                                {isSuperAdmin && (
                                                                    <Button variant="ghost" size="sm"
                                                                        onClick={e => { e.stopPropagation(); handleDelete(item); }}
                                                                        className="text-red-700 hover:text-red-800 hover:bg-red-50" title="Permanently delete">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>

                                                    {/* ── GR Details expanded row ── */}
                                                    {isDocExpanded && (
                                                        <tr>
                                                            <td colSpan={16} className="p-0 border-b border-slate-100">
                                                                <div className="px-6 py-4 bg-slate-50/60">
                                                                    {/* Details card */}
                                                                    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                                                                        {/* Card header */}
                                                                        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
                                                                            <LayoutList size={13} className="text-blue-500" />
                                                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                                                                Goods Receipt Details — {docNo}
                                                                            </span>
                                                                        </div>

                                                                        {details.length === 0 ? (
                                                                            <div className="px-4 py-6 text-sm text-slate-400 italic text-center">No detail records found.</div>
                                                                        ) : (
                                                                            <table className="w-full text-sm">
                                                                                <thead>
                                                                                    <tr className="border-b border-slate-100">
                                                                                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-8"></th>
                                                                                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-8"></th>

                                                                                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Material Doc</th>
                                                                                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Material ID</th>
                                                                                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gross Qty</th>
                                                                                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tare Qty</th>
                                                                                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nett Qty</th>
                                                                                        <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">UOM</th>
                                                                                        <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pockets</th>
                                                                                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tot Rolls</th>
                                                                                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stock Qty</th>
                                                                                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ex. Rolls</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {details.map((d: any) => {
                                                                                        const detailKey      = `${docNo}__${d.material_id}`;
                                                                                        const isUnitExpanded = expandedDetailRows.has(detailKey);
                                                                                        const units          = unitsCache[detailKey] || [];
                                                                                        return (
                                                                                            <React.Fragment key={detailKey}>
                                                                                                {/* Detail row */}
                                                                                                <tr className={`border-b border-slate-50 transition-colors ${isUnitExpanded ? "bg-green-50/30" : "hover:bg-slate-50/80"}`}>

                                                                                                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">↳</td>
                                                                                                        <td className="px-4 py-3 text-center">
                                                                                                        <button
                                                                                                            onClick={() => toggleDetailRow(docNo, d.material_id)}
                                                                                                            className={`p-1 rounded-md transition-colors ${isUnitExpanded ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-500"}`}
                                                                                                            title="Show Units">
                                                                                                            {isUnitExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                                                                        </button>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{docNo}</td>
                                                                                                    <td className="px-4 py-3 text-sm font-bold text-slate-800">{d.material_id}</td>
                                                                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">{Number(d.invoice_total_gross_qty).toFixed(3)}</td>
                                                                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">{Number(d.invoice_total_tare_qty).toFixed(3)}</td>
                                                                                                    <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">{Number(d.invoice_total_nett_qty).toFixed(3)}</td>
                                                                                                    <td className="px-4 py-3 text-center text-xs text-slate-500">{d.uom}</td>
                                                                                                    <td className="px-4 py-3 text-center text-xs text-slate-600">{d.total_pockets ?? 0}</td>
                                                                                                    <td className="px-4 py-3 text-right text-xs text-slate-600">{d.total_rolls ?? 0}</td>
                                                                                                    <td className="px-4 py-3 text-right text-xs text-slate-600">{d.existing_stock_qty ?? 0}</td>
                                                                                                    <td className="px-4 py-3 text-right text-xs text-slate-600">{d.existing_total_rolls ?? 0}</td>
                                                                                                
                                                                                                </tr>

                                                                                                {/* Units expanded section */}
                                                                                                {isUnitExpanded && (
                                                                                                    <tr>
                                                                                                        <td colSpan={10} className="px-6 pb-3 pt-0 bg-green-50/20">
                                                                                                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                                                                                                {/* Unit breakdown header */}
                                                                                                                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5">
                                                                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">↳ Unit Breakdown</span>
                                                                                                                </div>
                                                                                                                {units.length === 0 ? (
                                                                                                                    <div className="px-4 py-4 text-xs text-slate-400 italic text-center">No unit records found.</div>
                                                                                                                ) : (
                                                                                                                    <table className="w-full text-sm">
                                                                                                                        <thead>
                                                                                                                            <tr className="border-b border-slate-100">
                                                                                                                                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Doc No</th>
                                                                                                                                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Material ID</th>
                                                                                                                                <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">SNO</th>
                                                                                                                                <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Packet</th>
                                                                                                                                <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Roll</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gross</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tare</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nett</th>
                                                                                                                                <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">UOM</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actual</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cons.</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rej.</th>
                                                                                                                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Balance</th>
                                                                                                                                <th className="px-4 py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                                                                                                            </tr>
                                                                                                                        </thead>
                                                                                                                        <tbody>
                                                                                                                            {units.map((u: any) => (
                                                                                                                                <tr key={u.sno} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                                                                                                                    <td className="px-4 py-2.5 text-xs font-mono text-slate-400">{docNo}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{d.material_id}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center text-xs text-slate-500">{u.sno}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center text-xs font-mono text-slate-600">{u.packet_no || "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center text-xs font-mono text-slate-600">{u.roll_no || "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center text-xs font-mono text-slate-600">{u.gross_qty || "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center text-xs font-mono text-slate-600">{u.tare_qty || "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-right text-sm font-semibold text-blue-600">{Number(u.nett_qty).toFixed(3)}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center text-xs text-slate-500">{u.uom || "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-right text-xs text-slate-700">{(u.actual_qty)|| "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-right text-xs text-slate-400">{(u.consumed_qty)|| "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-right text-xs text-slate-400">{(u.rejected_qty)|| "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-right text-sm font-bold text-slate-700">{(u.balance_qty)|| "—"}</td>
                                                                                                                                    <td className="px-4 py-2.5 text-center">
                                                                                                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${(u.status || "A") === "A" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                                                                                                                                            {u.status || "A"}
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
                                                                                    })}
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
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE {currentPage} OF {totalPages || 1}</span>
                                <div className="flex gap-2">
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

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="font-semibold">ALL SYSTEMS OPERATIONAL</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Real-time Data Sync • ACUMED Manufacturing Cloud v4.2</p>
                    </motion.div>
                </div>
            </main>

            <AnimatePresence>{isAddModalOpen  && renderModal(false)}</AnimatePresence>
            <AnimatePresence>{isEditModalOpen && renderModal(true)}</AnimatePresence>

            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Goods Receipt</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel GR &quot;{itemToCancel?.material_doc_no}&quot;? It will be set to inactive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsCancelItemDialogOpen(false); setItemToCancel(null); }}>
                            No, Keep Active
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, Cancel GR
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goods Receipt</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete GR &quot;{itemToDelete?.material_doc_no}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setItemToDelete(null); }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

