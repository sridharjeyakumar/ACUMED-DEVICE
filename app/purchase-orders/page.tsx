'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2, ChevronDown, Printer, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { purchaseOrderAPI, vendorAPI, materialAPI, purchaseOrderDetailAPI, companyAPI, employeeAPI, userAPI, sendMailAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";

interface PurchaseOrder {
    _id?: string;
    po_no: string;
    po_date: string;
    po_time: string;
    vendor_id: string;
    vendor_ref_doc_no?: string;
    vendor_ref_doc_date?: string;
    delivery_text?: string;
    shipping_instruction?: string;
    terms_of_payment?: string;
    remarks?: string;
    entered_by_user_id: string;
    entered_date_time?: string;
    approval_remarks?: string;
    approved_by_user_id?: string;
    approved_date_time?: string;
    status: string;
    po_basic_amount?: number;
    po_gst_amount?: number;
    po_total_amount?: number;
    mail_sent_status?: string;
}

interface Vendor {
    vendor_id: string;
    vendor_name: string;
    active?: boolean;
    default_shipping_instruction?: string;
    default_terms_of_payment?: string;
    contact_person?: string;
    contact_email_id?: string;
    default_material_type?: string;
}

interface ActiveMaterial {
    material_id: string;
    material_name: string;
    material_type?: string;
    uom: string;
    material_spec?: string;
    min_order_qty?: number;
    default_unit_price?: number;
    default_gst_percent?: number;
    lead_time_days_min?: number;
}

interface PODetail {
    _id?: string;
    po_no: string;
    material_id: string;
    sno: number;
    po_qty: number;
    uom: string;
    material_spec?: string;
    remarks?: string;
    gr_qty: number;
    balance_qty: number;
    unit_price?: number;
    basic_amount?: number;
    gst_percentage?: number;
    gst_amount?: number;
    total_amount?: number;
    expected_delivery_date?: string;
}

interface DetailRow {
    _id?: string;
    material_id: string;
    _original_material_id?: string;
    po_qty: number | string;
    uom: string;
    material_spec: string;
    remarks: string;
    gr_qty: number;
    balance_qty: number;
    min_order_qty: number;
    _deleted?: boolean;
    unit_price: number | string;
    basic_amount: number;
    gst_percentage: number;
    gst_amount: number;
    total_amount: number;
    expected_delivery_date: string;
}

function computeAmounts(po_qty: number | string, unit_price: number | string, gst_percentage: number | string) {
    const qty = parseFloat(String(po_qty)) || 0;
    const price = parseFloat(String(unit_price)) || 0;
    const gst = parseFloat(String(gst_percentage)) || 0;
    const basic_amount = parseFloat((qty * price).toFixed(2));
    const gst_amount = Math.round(basic_amount * gst / 100);
    const total_amount = parseFloat((basic_amount + gst_amount).toFixed(2));
    return { basic_amount, gst_amount, total_amount };
}

function computeExpectedDeliveryDate(po_date: string, lead_time_days_min?: number): string {
    const base = po_date ? new Date(po_date) : new Date();
    if (lead_time_days_min != null && lead_time_days_min > 0) {
        base.setDate(base.getDate() + lead_time_days_min);
    }
    // Clamp to today if result is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    base.setHours(0, 0, 0, 0);
    const result = base < today ? today : base;
    return result.toISOString().split('T')[0];
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function formatDateTime(dateStr: string | Date | undefined): string {
    if (!dateStr) return "-";
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function toDateInput(dateStr: string | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
}

function generatePoNo(existing: PurchaseOrder[]): string {
    const yy = new Date().getFullYear().toString().slice(-2);
    const prefix = `P${yy}`;
    const thisYear = existing.filter(o => o.po_no.startsWith(prefix));
    const maxSerial = thisYear.reduce((max, o) => {
        const serial = parseInt(o.po_no.slice(3)) || 0;
        return Math.max(max, serial);
    }, 0);
    return `${prefix}${String(maxSerial + 1).padStart(5, '0')}`;
}

// ── PODetailTable — defined outside the page to prevent unmount on parent re-render ──
interface PODetailTableProps {
    detailRows: DetailRow[];
    activeMaterials: ActiveMaterial[];
    selectedVendor?: Vendor;
    readOnly?: boolean;
    onAddRow: () => void;
    onMaterialChange: (idx: number, materialId: string) => void;
    onChange: (idx: number, field: keyof DetailRow, value: any) => void;
    onRemoveRow: (idx: number) => void;
}

function PODetailTable({ detailRows, activeMaterials, selectedVendor, readOnly, onAddRow, onMaterialChange, onChange, onRemoveRow }: PODetailTableProps) {
    const filteredMaterials = selectedVendor?.default_material_type
        ? activeMaterials.filter(m => m.material_type === selectedVendor.default_material_type)
        : activeMaterials;
    const visibleRows = detailRows.filter(r => !r._deleted);
    return (
        <div className="col-span-2 mt-4">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">PO Details</h3>
                <Button type="button" size="sm" onClick={onAddRow}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 h-7">
                    + Add Row
                </Button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="px-3 py-2 text-left whitespace-nowrap w-10">SNO</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">Material ID <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">PO Qty <span className="text-red-500">*</span></th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">UOM</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">Unit Price</th>
                            <th className="px-3 py-2 text-right whitespace-nowrap">Basic Amt</th>
                            <th className="px-3 py-2 text-right whitespace-nowrap">GST %</th>
                            <th className="px-3 py-2 text-right whitespace-nowrap">GST Amt</th>
                            <th className="px-3 py-2 text-right whitespace-nowrap">Total Amt</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">Exp. Delivery</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">Material Spec</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">Remarks</th>
                            <th className="px-3 py-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={13} className="px-4 py-6 text-center text-muted-foreground">
                                    No items added. Click &quot;+ Add Row&quot; to add materials.
                                </td>
                            </tr>
                        ) : (
                            detailRows.map((row, idx) => {
                                if (row._deleted) return null;
                                const sno = detailRows.slice(0, idx + 1).filter(r => !r._deleted).length;
                                const matLabel = (() => {
                                    const m = filteredMaterials.find(m => m.material_id === row.material_id) ||
                                              activeMaterials.find(m => m.material_id === row.material_id);
                                    return m ? `${m.material_id} - ${m.material_name}` : (row.material_id || '-');
                                })();
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-center font-mono text-gray-500 w-10">{sno}</td>
                                        <td className="px-3 py-2">
                                            {readOnly ? (
                                                <span className="font-semibold text-blue-700">{matLabel}</span>
                                            ) : (
                                            <select
                                                value={row.material_id}
                                                onChange={e => onMaterialChange(idx, e.target.value)}
                                                className="w-full min-w-[160px] px-2 py-1 border border-border rounded bg-background text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Select material</option>
                                                {filteredMaterials.map(m => (
                                                    <option
                                                        key={m.material_id}
                                                        value={m.material_id}
                                                        disabled={detailRows.some((r, i) => i !== idx && !r._deleted && r.material_id === m.material_id)}
                                                    >
                                                        {m.material_id} - {m.material_name}
                                                    </option>
                                                ))}
                                            </select>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {readOnly ? (
                                                <span>{row.po_qty != null ? Number(row.po_qty).toLocaleString('en-IN') : '-'}</span>
                                            ) : (
                                            <Input
                                                type="number"
                                                value={row.po_qty}
                                                min={row.min_order_qty || 0}
                                                step="0.001"
                                                onChange={e => onChange(idx, 'po_qty', e.target.value)}
                                                className="w-24 text-xs h-7 px-2"
                                                required
                                            />
                                            )}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-gray-600 whitespace-nowrap">{row.uom || '-'}</td>
                                        <td className="px-3 py-2">
                                            {readOnly ? (
                                                <span>{row.unit_price != null ? Number(row.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
                                            ) : (
                                            <Input
                                                type="number"
                                                value={row.unit_price}
                                                min={0}
                                                step="0.01"
                                                onChange={e => onChange(idx, 'unit_price', e.target.value)}
                                                className="w-24 text-xs h-7 px-2"
                                            />
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">{Number(row.basic_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">{row.gst_percentage}%</td>
                                        <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">{Number(row.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-blue-700 whitespace-nowrap">{Number(row.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2">
                                            {readOnly ? (
                                                <span>{row.expected_delivery_date ? new Date(row.expected_delivery_date).toLocaleDateString('en-GB') : '-'}</span>
                                            ) : (
                                            <Input
                                                type="date"
                                                value={row.expected_delivery_date}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={e => onChange(idx, 'expected_delivery_date', e.target.value)}
                                                className="w-36 text-xs h-7 px-2"
                                            />
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 max-w-[180px] truncate" title={row.material_spec}>{row.material_spec || '-'}</td>
                                        <td className="px-3 py-2">
                                            {readOnly ? (
                                                <span className="text-gray-500">{row.remarks || '-'}</span>
                                            ) : (
                                            <Input
                                                type="text"
                                                value={row.remarks}
                                                onChange={e => onChange(idx, 'remarks', e.target.value)}
                                                maxLength={100}
                                                className="w-28 text-xs h-7 px-2"
                                            />
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <button type="button" onClick={() => onRemoveRow(idx)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    E: { label: 'Entered',   color: 'bg-blue-50 text-blue-600' },
    A: { label: 'Active',    color: 'bg-green-50 text-green-600' },
    X: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
    C: { label: 'Closed',    color: 'bg-gray-100 text-gray-600' },
};

const emptyForm = {
    po_no: "",
    po_date: new Date().toISOString().split('T')[0],
    po_time: new Date().toTimeString().slice(0, 8),
    vendor_id: "",
    vendor_ref_doc_no: "",
    vendor_ref_doc_date: "",
    delivery_text: "",
    shipping_instruction: "",
    terms_of_payment: "",
    remarks: "",
    entered_by_user_id: "ADMIN",
    approval_remarks: "",
    approved_by_user_id: "",
    approved_date_time: "",
    status: "E",
};

export default function PurchaseOrdersPage() {
    const { toast } = useToast();
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const isSubmittingRef = useRef(false);

    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [activeMaterials, setActiveMaterials] = useState<ActiveMaterial[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    const [isMailModalOpen, setIsMailModalOpen] = useState(false);
    const [mailData, setMailData] = useState({ to: '', cc: '', subject: '', body: '' });
    const [mailSending, setMailSending] = useState(false);

    const [formData, setFormData] = useState({ ...emptyForm });
    const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
    const [sessionUserName, setSessionUserName] = useState<string>("");

    // Expand state
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandedDetails, setExpandedDetails] = useState<Record<string, PODetail[]>>({});
    const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

    useEffect(() => {
        const sessionUser = getSessionUser();
        if (sessionUser?.employee_id) {
            employeeAPI.getById(sessionUser.employee_id)
                .then((emp: any) => setSessionUserName(emp?.emp_name || ""))
                .catch(() => setSessionUserName(""));
        }
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await purchaseOrderAPI.getAll();
            setOrders(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load purchase orders", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const load = async () => {
            try {
                const [vendorData, materialData, userData, employeeData] = await Promise.all([
                    vendorAPI.getAll(),
                    materialAPI.getActive(),
                    userAPI.getAll(),
                    employeeAPI.getAll(),
                ]);
                setVendors(vendorData);
                setActiveMaterials(materialData);
                setUsers(userData || []);
                setEmployees(employeeData || []);
            } catch {
                console.error("Failed to load vendors/materials");
            }
        };
        load();
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    useEffect(() => {
        if (isAddModalOpen) {
            const newPoNo = generatePoNo(orders);
            setFormData({
                ...emptyForm,
                po_no: newPoNo,
                po_date: new Date().toISOString().split('T')[0],
                po_time: new Date().toTimeString().slice(0, 8),
                entered_by_user_id: getSessionUser()?.user_id || "ADMIN",
            });
            setDetailRows([]);
        }
    }, [isAddModalOpen, orders]);

    // ── Expand row helpers ────────────────────────────────────────────────────
    const handleToggleExpand = async (poNo: string) => {
        const isExpanded = expandedRows.has(poNo);
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (isExpanded) next.delete(poNo); else next.add(poNo);
            return next;
        });
        if (!isExpanded && expandedDetails[poNo] === undefined) {
            setDetailsLoading(prev => new Set(prev).add(poNo));
            try {
                const data = await purchaseOrderDetailAPI.getByPoNo(poNo);
                setExpandedDetails(prev => ({ ...prev, [poNo]: data }));
            } catch {
                setExpandedDetails(prev => ({ ...prev, [poNo]: [] }));
            } finally {
                setDetailsLoading(prev => { const s = new Set(prev); s.delete(poNo); return s; });
            }
        }
    };

    // ── Filter / pagination ───────────────────────────────────────────────────
    const filteredOrders = orders.filter(o => {
        const matchesSearch =
            o.po_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.vendor_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vendorId = e.target.value;
        const vendor = vendors.find(v => v.vendor_id === vendorId);
        setFormData(prev => ({
            ...prev,
            vendor_id: vendorId,
            shipping_instruction: vendor?.default_shipping_instruction || prev.shipping_instruction,
            terms_of_payment: vendor?.default_terms_of_payment || prev.terms_of_payment,
        }));
    };

    const poBasicAmount = detailRows.filter(r => !r._deleted).reduce((s, r) => s + (r.basic_amount || 0), 0);
    const poGstAmount = detailRows.filter(r => !r._deleted).reduce((s, r) => s + (r.gst_amount || 0), 0);
    const poTotalAmount = detailRows.filter(r => !r._deleted).reduce((s, r) => s + (r.total_amount || 0), 0);

    // ── Detail row helpers ────────────────────────────────────────────────────
    const handleAddDetailRow = () => {
        setDetailRows(prev => [...prev, {
            material_id: '', po_qty: '', uom: '', material_spec: '',
            remarks: '', gr_qty: 0, balance_qty: 0, min_order_qty: 0,
            unit_price: '', basic_amount: 0, gst_percentage: 0,
            gst_amount: 0, total_amount: 0, expected_delivery_date: '',
        }]);
    };

    const handleDetailMaterialChange = (idx: number, materialId: string) => {
        const mat = activeMaterials.find(m => m.material_id === materialId);
        const po_qty = mat?.min_order_qty ?? 0;
        const unit_price = mat?.default_unit_price ?? 0;
        const gst_percentage = mat?.default_gst_percent ?? 0;
        const { basic_amount, gst_amount, total_amount } = computeAmounts(po_qty, unit_price, gst_percentage);
        const expected_delivery_date = computeExpectedDeliveryDate(formData.po_date, mat?.lead_time_days_min);
        setDetailRows(prev => prev.map((row, i) => i !== idx ? row : {
            ...row,
            material_id: materialId,
            uom: mat?.uom || '',
            material_spec: mat?.material_spec || '',
            po_qty: mat?.min_order_qty ?? '',
            balance_qty: mat?.min_order_qty ?? 0,
            min_order_qty: mat?.min_order_qty ?? 0,
            unit_price,
            gst_percentage,
            basic_amount,
            gst_amount,
            total_amount,
            expected_delivery_date,
        }));
    };

    const handleDetailChange = (idx: number, field: keyof DetailRow, value: any) => {
        setDetailRows(prev => prev.map((row, i) => {
            if (i !== idx) return row;
            const updated = { ...row, [field]: value };
            if (field === 'po_qty' || field === 'unit_price') {
                const { basic_amount, gst_amount, total_amount } = computeAmounts(
                    updated.po_qty, updated.unit_price, updated.gst_percentage
                );
                if (field === 'po_qty') {
                    updated.balance_qty = parseFloat(String(value)) || 0;
                }
                return { ...updated, basic_amount, gst_amount, total_amount };
            }
            return updated;
        }));
    };

    const handleRemoveDetailRow = (idx: number) => {
        const row = detailRows[idx];
        if (row._id) {
            setDetailRows(prev => prev.map((r, i) => i !== idx ? r : { ...r, _deleted: true }));
        } else {
            setDetailRows(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const validateDetailRows = (): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = detailRows.filter(r => !r._deleted);
        for (const row of active) {
            if (!row.material_id) {
                toast({ title: "Validation Error", description: "Please select a material for all detail rows.", variant: "destructive" });
                return false;
            }
            const qty = Number(row.po_qty);
            if (isNaN(qty) || qty <= 0) {
                toast({ title: "Validation Error", description: `PO Qty for ${row.material_id} must be a positive number.`, variant: "destructive" });
                return false;
            }
            if (qty < row.min_order_qty) {
                toast({ title: "Validation Error", description: `PO Qty for ${row.material_id} must be ≥ ${row.min_order_qty} (min order qty).`, variant: "destructive" });
                return false;
            }
            if (row.expected_delivery_date) {
                const deliveryDate = new Date(row.expected_delivery_date);
                deliveryDate.setHours(0, 0, 0, 0);
                if (deliveryDate < today) {
                    toast({ title: "Validation Error", description: `Expected Delivery Date for ${row.material_id} must be today or a future date.`, variant: "destructive" });
                    return false;
                }
            }
        }
        return true;
    };

    // ── Submit: Add ───────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current) return;
        if (!validateDetailRows()) return;

        isSubmittingRef.current = true;
        try {
            const order = await purchaseOrderAPI.create({
                ...formData,
                po_date: formData.po_date ? new Date(formData.po_date) : new Date(),
                vendor_ref_doc_date: formData.vendor_ref_doc_date || undefined,
                shipping_instruction: formData.shipping_instruction || undefined,
                approved_date_time: formData.approved_date_time || undefined,
                entered_date_time: new Date(),
                po_basic_amount: poBasicAmount || undefined,
                po_gst_amount: poGstAmount || undefined,
                po_total_amount: poTotalAmount || undefined,
            });

            const poNo = order.po_no || formData.po_no;
            const activeRows = detailRows.filter(r => !r._deleted);
            for (let i = 0; i < activeRows.length; i++) {
                const row = activeRows[i];
                await purchaseOrderDetailAPI.create({
                    po_no: poNo,
                    material_id: row.material_id,
                    sno: i + 1,
                    po_qty: Number(row.po_qty),
                    uom: row.uom,
                    material_spec: row.material_spec || undefined,
                    remarks: row.remarks || undefined,
                    gr_qty: 0,
                    balance_qty: Number(row.po_qty),
                    unit_price: Number(row.unit_price) || undefined,
                    basic_amount: row.basic_amount || undefined,
                    gst_percentage: row.gst_percentage || undefined,
                    gst_amount: row.gst_amount || undefined,
                    total_amount: row.total_amount || undefined,
                    expected_delivery_date: row.expected_delivery_date || undefined,
                });
            }

            toast({ title: "Success", description: `Purchase Order ${poNo} created successfully` });
            setIsAddModalOpen(false);
            setDetailRows([]);
            loadOrders();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create purchase order", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    // ── Edit: open ────────────────────────────────────────────────────────────
    const handleEdit = async (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setFormData({
            po_no: order.po_no,
            po_date: toDateInput(order.po_date),
            po_time: order.po_time || "",
            vendor_id: order.vendor_id,
            vendor_ref_doc_no: order.vendor_ref_doc_no || "",
            vendor_ref_doc_date: toDateInput(order.vendor_ref_doc_date),
            delivery_text: order.delivery_text || "",
            shipping_instruction: order.shipping_instruction || "",
            terms_of_payment: order.terms_of_payment || "",
            remarks: order.remarks || "",
            entered_by_user_id: order.entered_by_user_id,
            approval_remarks: order.approval_remarks || "",
            approved_by_user_id: order.approved_by_user_id || "",
            approved_date_time: toDateInput(order.approved_date_time),
            status: order.status,
        });
        setIsEditModalOpen(true);

        try {
            const details: PODetail[] = await purchaseOrderDetailAPI.getByPoNo(order.po_no);
            setDetailRows(details.map(d => {
                const mat = activeMaterials.find(m => m.material_id === d.material_id);
                const unit_price = d.unit_price ?? mat?.default_unit_price ?? 0;
                const gst_percentage = d.gst_percentage ?? mat?.default_gst_percent ?? 0;
                const { basic_amount, gst_amount, total_amount } = computeAmounts(d.po_qty, unit_price, gst_percentage);
                return {
                    _id: d._id,
                    material_id: d.material_id,
                    _original_material_id: d.material_id,
                    po_qty: d.po_qty,
                    uom: d.uom,
                    material_spec: d.material_spec || '',
                    remarks: d.remarks || '',
                    gr_qty: d.gr_qty,
                    balance_qty: d.balance_qty,
                    min_order_qty: mat?.min_order_qty ?? 0,
                    unit_price,
                    gst_percentage,
                    basic_amount: d.basic_amount ?? basic_amount,
                    gst_amount: d.gst_amount ?? gst_amount,
                    total_amount: d.total_amount ?? total_amount,
                    expected_delivery_date: computeExpectedDeliveryDate(
                        d.expected_delivery_date
                            ? new Date(d.expected_delivery_date).toISOString().split('T')[0]
                            : order.po_date,
                        d.expected_delivery_date ? 0 : mat?.lead_time_days_min
                    ),
                };
            }));
        } catch {
            setDetailRows([]);
        }
    };

    // ── Submit: Edit ──────────────────────────────────────────────────────────
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current || !selectedOrder) return;
        if (!validateDetailRows()) return;

        isSubmittingRef.current = true;
        try {
            await purchaseOrderAPI.update(selectedOrder.po_no, {
                po_date: formData.po_date ? new Date(formData.po_date) : undefined,
                po_time: formData.po_time,
                vendor_id: formData.vendor_id,
                vendor_ref_doc_no: formData.vendor_ref_doc_no || undefined,
                vendor_ref_doc_date: formData.vendor_ref_doc_date || undefined,
                delivery_text: formData.delivery_text || undefined,
                shipping_instruction: formData.shipping_instruction || undefined,
                terms_of_payment: formData.terms_of_payment || undefined,
                remarks: formData.remarks || undefined,
                approval_remarks: formData.approval_remarks || undefined,
                po_basic_amount: poBasicAmount || undefined,
                po_gst_amount: poGstAmount || undefined,
                po_total_amount: poTotalAmount || undefined,
                approved_by_user_id: formData.approved_by_user_id || undefined,
                approved_date_time: formData.approved_date_time || undefined,
                status: formData.status,
            });

            // Patch details: Option B — update/insert/delete individually
            let sno = 1;
            for (const row of detailRows) {
                if (row._deleted && row._id) {
                    await purchaseOrderDetailAPI.delete(row._id);
                } else if (!row._deleted && row._id) {
                    if (row.material_id !== row._original_material_id) {
                        // material_id changed — delete old record and create new
                        await purchaseOrderDetailAPI.delete(row._id);
                        await purchaseOrderDetailAPI.create({
                            po_no: selectedOrder.po_no,
                            material_id: row.material_id,
                            sno,
                            po_qty: Number(row.po_qty),
                            uom: row.uom,
                            material_spec: row.material_spec || undefined,
                            remarks: row.remarks || undefined,
                            gr_qty: row.gr_qty,
                            balance_qty: row.balance_qty,
                            unit_price: Number(row.unit_price) || undefined,
                            basic_amount: row.basic_amount || undefined,
                            gst_percentage: row.gst_percentage || undefined,
                            gst_amount: row.gst_amount || undefined,
                            total_amount: row.total_amount || undefined,
                            expected_delivery_date: row.expected_delivery_date || undefined,
                        });
                    } else {
                        await purchaseOrderDetailAPI.update(row._id, {
                            sno,
                            po_qty: Number(row.po_qty),
                            uom: row.uom,
                            material_spec: row.material_spec || undefined,
                            remarks: row.remarks || undefined,
                            unit_price: Number(row.unit_price) || undefined,
                            basic_amount: row.basic_amount || undefined,
                            gst_percentage: row.gst_percentage || undefined,
                            gst_amount: row.gst_amount || undefined,
                            total_amount: row.total_amount || undefined,
                            expected_delivery_date: row.expected_delivery_date || undefined,
                        });
                    }
                    sno++;
                } else if (!row._deleted && !row._id) {
                    await purchaseOrderDetailAPI.create({
                        po_no: selectedOrder.po_no,
                        material_id: row.material_id,
                        sno,
                        po_qty: Number(row.po_qty),
                        uom: row.uom,
                        material_spec: row.material_spec || undefined,
                        remarks: row.remarks || undefined,
                        gr_qty: 0,
                        balance_qty: Number(row.po_qty),
                        unit_price: Number(row.unit_price) || undefined,
                        basic_amount: row.basic_amount || undefined,
                        gst_percentage: row.gst_percentage || undefined,
                        gst_amount: row.gst_amount || undefined,
                        total_amount: row.total_amount || undefined,
                        expected_delivery_date: row.expected_delivery_date || undefined,
                    });
                    sno++;
                }
            }

            toast({ title: "Success", description: "Purchase order updated successfully" });
            setIsEditModalOpen(false);
            setSelectedOrder(null);
            setDetailRows([]);
            // Collapse the row and clear cached details so it re-fetches on next expand
            setExpandedRows(prev => { const s = new Set(prev); s.delete(selectedOrder.po_no); return s; });
            setExpandedDetails(prev => { const n = { ...prev }; delete n[selectedOrder.po_no]; return n; });
            loadOrders();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update purchase order", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (order: PurchaseOrder) => {
        setOrderToDelete(order);
        setIsDeleteDialogOpen(true);
    };

    const getVendorDisplay = (vendorId: string) => {
        if (!vendorId) return "-";
        const vendor = vendors.find(v => v.vendor_id === vendorId);
        return vendor ? `${vendor.vendor_id} - ${vendor.vendor_name}` : vendorId;
    };

    const getUserName = (userId: string) => {
        if (!userId) return "-";
        const user = users.find(u => u.user_id === userId);
        if (!user) return userId;
        const emp = employees.find(e => (e.emp_id || e._id) === user.employee_id);
        const name = emp ? (emp.emp_name || emp.empName || '') : '';
        return name ? `${userId} - ${name}` : userId;
    };

    const confirmDelete = async () => {
        if (!orderToDelete) return;
        try {
            await purchaseOrderAPI.delete(orderToDelete.po_no);
            toast({ title: "Deleted", description: `${orderToDelete.po_no} permanently deleted` });
            setIsDeleteDialogOpen(false);
            setOrderToDelete(null);
            setExpandedDetails(prev => { const n = { ...prev }; delete n[orderToDelete.po_no]; return n; });
            loadOrders();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
        }
    };


    const numberToIndianWords = (amount: number): string => {
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
            'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

        const uptoNinetyNine = (n: number): string => {
            if (n < 20) return ones[n];
            return (tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')).trim();
        };

        const toWords = (n: number): string => {
            if (n === 0) return 'ZERO';
            const parts: string[] = [];
            if (n >= 10000000) { parts.push(toWords(Math.floor(n / 10000000)) + ' CRORE'); n %= 10000000; }
            if (n >= 100000)   { parts.push(uptoNinetyNine(Math.floor(n / 100000)) + ' LAKH'); n %= 100000; }
            if (n >= 1000)     { parts.push(uptoNinetyNine(Math.floor(n / 1000)) + ' THOUSAND'); n %= 1000; }
            if (n >= 100)      { parts.push(ones[Math.floor(n / 100)] + ' HUNDRED'); n %= 100; }
            if (n > 0)         { parts.push(uptoNinetyNine(n)); }
            return parts.join(' ');
        };

        const rupees = Math.floor(amount);
        const paise = Math.round((amount - rupees) * 100);
        let words = 'RUPEES ' + toWords(rupees);
        if (paise > 0) words += ' AND ' + uptoNinetyNine(paise) + ' PAISE';
        return words + ' ONLY';
    };

    const handlePrint = async (order: PurchaseOrder) => {
        try {
            let details: PODetail[] = expandedDetails[order.po_no];
            if (!details) {
                details = await purchaseOrderDetailAPI.getByPoNo(order.po_no);
            }

            const [vendor, allCompanies] = await Promise.all([
                vendorAPI.getById(order.vendor_id),
                companyAPI.getAll().catch(() => []),
            ]);

            const c1 = allCompanies.find((c: any) => c.comp_id === 'CORP');
            const c2 = allCompanies.find((c: any) => c.comp_id === 'FACT');

            let authorisedName = '';
            if (order.approved_by_user_id) {
                try {
                    const emp = await employeeAPI.getById(order.approved_by_user_id);
                    authorisedName = emp?.emp_name || order.approved_by_user_id;
                } catch {
                    authorisedName = order.approved_by_user_id;
                }
            }

            const fmt = (d?: string) => {
                if (!d) return '-';
                const dt = new Date(d);
                if (isNaN(dt.getTime())) return '-';
                return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`;
            };

            const fmtNum = (n?: number) => {
                if (n == null) return '-';
                return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            const getMaterialName = (id: string) => {
                const m = activeMaterials.find(m => m.material_id === id);
                return m?.material_name || id;
            };

            const totalBasic = details.reduce((s, d) => s + (d.basic_amount || 0), 0);
            const totalGst   = details.reduce((s, d) => s + (d.gst_amount || 0), 0);
            const totalAmt   = details.reduce((s, d) => s + (d.total_amount || 0), 0);

            const logoHtml = c1?.logo
                ? `<img src="${c1.logo}" style="height:44px;max-width:80px;object-fit:contain;" alt="Logo"/>`
                : `<div style="width:80px;height:44px;border:1px solid #aaa;display:flex;align-items:center;justify-content:center;font-size:9px;color:#888;">Company<br/>Logo</div>`;

            const signImgHtml = c1?.po_image
                ? `<img src="${c1.po_image}" style="height:56px;max-width:120px;object-fit:contain;display:block;margin:4px auto;" alt="Authorised Sign"/>`
                : '';

            const detailRowsHtml = details.map(d => `
              <tr>
                <td style="text-align:center;">${d.sno}</td>
                <td>
                  ${getMaterialName(d.material_id)}<br/>
                  <span style="color:#444;">Spec : ${d.material_spec || '-'}</span><br/>
                  <span style="color:#444;">Exp. Delivery Date : ${fmt(d.expected_delivery_date)}</span>
                </td>
                <td style="text-align:center;">${d.po_qty != null ? Number(d.po_qty).toLocaleString('en-IN') : '-'}</td>
                <td style="text-align:center;">${d.uom}</td>
                <td style="text-align:center;">${fmtNum(d.unit_price)}</td>
                <td style="text-align:center;">${fmtNum(d.basic_amount)}</td>
                <td style="text-align:center;">${d.gst_percentage != null ? `@ ${d.gst_percentage}%` : '-'}<br/><span style="font-size:11px;">${fmtNum(d.gst_amount)}</span></td>
                <td style="text-align:center;">${fmtNum(d.total_amount)}</td>
              </tr>`).join('');

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Purchase Order - ${order.po_no}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff;
         padding: 12mm 10mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 100%; }
  .hdr { position: relative; text-align: center; margin-bottom: 8px; min-height: 54px; }
  .hdr-logo { position: absolute; left: 0; top: 0; }
  .hdr-info { display: inline-block; text-align: center; }
  .co-name { font-size: 18px; font-weight: bold; color: #1a4fa8; }
  .co-addr { font-size: 11px; color: #333; line-height: 1.6; margin-top: 3px; }
  .main-tbl { width: 100%; border-collapse: collapse; border: 1px solid #555; margin-bottom: 5px; table-layout: fixed; }
  .main-tbl td, .main-tbl th { border: 1px solid #555; padding: 6px 8px; vertical-align: top; font-size: 12px; word-break: break-word; overflow-wrap: break-word; }
  .po-heading { background: #dce6f7; color: #1a4fa8; text-align: center; font-size: 14px; font-weight: bold; padding: 7px; border: 1px solid #555; }
  .lbl { font-weight: bold; }
  .lbl-blue { font-weight: bold; color: #1a4fa8; }
  .items-tbl { width: 100%; border-collapse: collapse; border: 1px solid #555; margin-bottom: 5px; table-layout: fixed; }
  .items-tbl th { background: #dce6f7; color: #000; text-align: center; font-weight: bold; border: 1px solid #555; padding: 6px 4px; font-size: 12px; }
  .items-tbl td { border: 1px solid #555; padding: 5px 6px; vertical-align: top; font-size: 12px; word-break: break-word; overflow-wrap: break-word; }
  .bottom-tbl { width: 100%; border-collapse: collapse; border: 1px solid #555; table-layout: fixed; margin-top: 5px; }
  .bottom-tbl td { border: 1px solid #555; padding: 20px 12px; vertical-align: top; font-size: 12px; word-break: break-word; overflow-wrap: break-word; min-height: 120px; }
  .sys-footer { margin-top: 8px; font-size: 10px; color: #555; font-style: italic; }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-logo">${logoHtml}</div>
    <div class="hdr-info">
      <div class="co-name">${c1?.company_name || ''}</div>
      <div class="co-addr">
        ${[c1?.address_1, c1?.address_2].filter(Boolean).join(' ')}${(c1?.address_1 || c1?.address_2) ? '<br/>' : ''}
        ${[c1?.city, c1?.pincode ? `- ${c1.pincode}` : '', c1?.state ? `, ${c1.state}` : ''].filter(Boolean).join(' ')}
        ${(c1?.website || c1?.email_id) ? '<br/>' : ''}
        ${c1?.website ? `website : ${c1.website}` : ''}${c1?.website && c1?.email_id ? '&nbsp;&nbsp;&nbsp;' : ''}${c1?.email_id ? `email id : ${c1.email_id}` : ''}
      </div>
    </div>
  </div>
  <table class="main-tbl">
    <tr><td colspan="2" class="po-heading">Purchase Order</td></tr>
    <tr>
      <td style="width:50%;">
        <div class="lbl">Supplier Address :</div>
        <div style="margin-top:3px;line-height:1.7;">
          M/s. ${vendor?.vendor_name || ''}<br/>
          ${vendor?.address1 || ''}${vendor?.address1 ? '<br/>' : ''}
          ${vendor?.address2 ? vendor.address2 + '<br/>' : ''}
          ${vendor?.city || ''}${vendor?.pincode ? ` - ${vendor.pincode}` : ''}${(vendor?.city || vendor?.pincode) ? '<br/>' : ''}
          ${[vendor?.district, vendor?.state].filter(Boolean).join(', ')}
        </div>
      </td>
      <td style="width:50%;">
        <table style="width:100%;border:none;border-collapse:collapse;">
          <tr><td style="border:none;padding:2px 4px;width:110px;">PO No.</td><td style="border:none;padding:2px 4px;"> : <span class="lbl-blue"><strong>${order.po_no}</strong></span></td></tr>
          <tr><td style="border:none;padding:2px 4px;">PO Date</td><td style="border:none;padding:2px 4px;"> : <span class="lbl-blue"><strong>${fmt(order.po_date)}</strong></span></td></tr>
          <tr><td style="border:none;padding:4px;" colspan="2"></td></tr>
          <tr><td style="border:none;padding:2px 4px;">Ref. Doc No.</td><td style="border:none;padding:2px 4px;"> : ${order.vendor_ref_doc_no || '-'}</td></tr>
          <tr><td style="border:none;padding:2px 4px;">Ref. Doc Date</td><td style="border:none;padding:2px 4px;"> : ${fmt(order.vendor_ref_doc_date)}</td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div class="lbl">Delivery Address :</div>
        <div style="margin-top:3px;line-height:1.7;">
          M/s. ${c1?.company_name || ''}<br/>
          ${c1?.address_1 || ''}${c1?.address_1 ? '<br/>' : ''}
          ${c1?.address_2 ? c1.address_2 + '<br/>' : ''}
          ${c1?.city || ''}${c1?.pincode ? ` - ${c1.pincode}` : ''}${(c1?.city || c1?.pincode) ? '<br/>' : ''}
          ${c1?.state || ''}
        </div>
      </td>
      <td style="width:50%;vertical-align:top;" rowspan="2">
        <div class="lbl">Billing Address :</div>
        <div style="margin-top:3px;line-height:1.7;">
          M/s. ${c2?.company_name || ''}<br/>
          ${c2?.address_1 || ''}${c2?.address_1 ? '<br/>' : ''}
          ${c2?.address_2 ? c2.address_2 + '<br/>' : ''}
          ${c2?.city || ''}${c2?.pincode ? ` - ${c2.pincode}` : ''}${(c2?.city || c2?.pincode) ? '<br/>' : ''}
          ${c2?.state || ''}
        </div>
        <div style="margin-top:10px;"><span class="lbl">GST No.</span> ${c1?.gst_no || '-'}</div>
        <div style="margin-top:10px;">Contact Person &nbsp;: ${c1?.contact_person || '-'}</div>
        <div style="margin-top:2px;">Contact No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${c1?.contact_no || '-'}</div>
      </td>
    </tr>
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div class="lbl">Shipping Instruction :</div>
        <div style="margin-top:2px;margin-bottom:8px;">${order.shipping_instruction || '-'}</div>
        <div class="lbl">Payment Terms :</div>
        <div style="margin-top:2px;">${order.terms_of_payment || '-'}</div>
      </td>
    </tr>
  </table>
  <table class="items-tbl">
    <thead>
      <tr>
        <th style="width:4%;">S.No</th>
        <th style="width:23%;">Material</th>
        <th style="width:10%;">PO Qty</th>
        <th style="width:7%;">UoM</th>
        <th style="width:11%;">unit Rate &#8377;</th>
        <th style="width:12%;">Amount &#8377;</th>
        <th style="width:13%;">GST</th>
        <th style="width:13%;">Total &#8377;</th>
      </tr>
    </thead>
    <tbody>
      ${detailRowsHtml}
      <tr style="background:#f0f0f0;">
        <td colspan="5" style="text-align:right;font-weight:bold;border:1px solid #555;">TOTAL</td>
        <td style="text-align:center;font-weight:bold;"> ${fmtNum(totalBasic)}</td>
        <td style="text-align:center;font-weight:bold;"> ${fmtNum(totalGst)}</td>
        <td style="text-align:center;font-weight:bold;"> ${fmtNum(totalAmt)}</td>
      </tr>
      <tr>
        <td colspan="8" style="padding:6px 8px;font-size:11px;border:1px solid #aaa;">
          <strong>Amount in words :</strong>&nbsp;&nbsp;${numberToIndianWords(totalAmt)}
        </td>
      </tr>
    </tbody>
  </table>
  <table class="bottom-tbl">
    <tr>
      <td style="width:55%;">
        <div class="lbl">Terms and Conditions :</div>
        <div style="margin-top:8px;line-height:1.8;white-space:pre-wrap;">${c1?.po_terms_and_conditions || ''}</div>
      </td>
      <td style="width:45%;text-align:center;">
        ${order.status === 'A' ? `
        <div style="margin-bottom:16px;">for ${c1?.company_name || c1?.company_short_name || ''}</div>
        ${signImgHtml}
        <div style="margin-top:16px;">${authorisedName}</div>
        <div style="margin-top:4px;">( Authorised Signatory )</div>
        ` : `
        <div style="font-weight:bold;font-size:14px;color:#cc0000;">PURCHASE ORDER NOT YET APPROVED</div>
        `}
      </td>
    </tr>
  </table>
  <div class="sys-footer">
    * This is a system-generated Purchase Order and does not require a physical signature.
    ${c1?.email_id ? `For any queries, contact ${c1.email_id}` : ''}
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

            const printWindow = window.open('', '_blank', 'width=900,height=750');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } catch (err: any) {
            toast({ title: "Print Error", description: err.message || "Failed to generate print", variant: "destructive" });
        }
    };

    const handleOpenMailModal = async (order: PurchaseOrder) => {
        try {
            const vendor = vendors.find(v => v.vendor_id === order.vendor_id);
            const allCompanies = await companyAPI.getAll().catch(() => []);
            const c1 = allCompanies.find((c: any) => c.comp_id === 'CORP');
            let details: PODetail[] = expandedDetails[order.po_no];
            if (!details) {
                details = await purchaseOrderDetailAPI.getByPoNo(order.po_no);
            }
            const detailTableRows = details.map((d, i) => {
                const mat = activeMaterials.find(m => m.material_id === d.material_id);
                return `<tr>
                    <td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${i + 1}</td>
                    <td style="border:1px solid #ccc;padding:6px 10px;">${mat?.material_name || d.material_id}</td>
                    <td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${d.po_qty != null ? Number(d.po_qty).toLocaleString('en-IN') : '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 10px;text-align:center;">${d.uom || '-'}</td>
                </tr>`;
            }).join('');

            const bodyHtml = `
<p>Dear ${vendor?.contact_person || 'Sir/Madam'},</p>
<p>We are pleased to place the Order for the below material.</p>
<table style="border-collapse:collapse;width:100%;margin:12px 0;">
  <thead>
    <tr style="background:#f0f4ff;">
      <th style="border:1px solid #ccc;padding:6px 10px;">S.No</th>
      <th style="border:1px solid #ccc;padding:6px 10px;">Material Name</th>
      <th style="border:1px solid #ccc;padding:6px 10px;">PO Qty</th>
      <th style="border:1px solid #ccc;padding:6px 10px;">UoM</th>
    </tr>
  </thead>
  <tbody>${detailTableRows}</tbody>
</table>
<p>Refer the PO document attached.</p>
<br/>
<p>Thanks and Regards,<br/>${c1?.company_name || 'ACUMED DEVICES'}</p>`;

            setMailData({
                to: vendor?.contact_email_id || '',
                cc: 'acumed.devices@gmail.com',
                subject: `Purchase Order ${order.po_no} from ${c1?.company_short_name || c1?.company_name || ''}`,
                body: bodyHtml,
            });
            setSelectedOrder(order);
            setIsMailModalOpen(true);
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to prepare mail", variant: "destructive" });
        }
    };

    const handleSendMail = async () => {
        if (!mailData.to) {
            toast({ title: "No recipient", description: "Vendor has no email address on record.", variant: "destructive" });
            return;
        }
        setMailSending(true);
        try {
            await sendMailAPI.send({ to: mailData.to, cc: mailData.cc, subject: mailData.subject, html: mailData.body });
            if (selectedOrder) {
                await purchaseOrderAPI.update(selectedOrder.po_no, { mail_sent_status: 'Y' });
                setOrders(prev => prev.map(o => o.po_no === selectedOrder.po_no ? { ...o, mail_sent_status: 'Y' } : o));
            }
            toast({ title: "Mail Sent", description: `Mail sent to ${mailData.to}` });
            setIsMailModalOpen(false);
        } catch (err: any) {
            toast({ title: "Mail Error", description: err.message || "Failed to send mail", variant: "destructive" });
        } finally {
            setMailSending(false);
        }
    };

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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Purchase Orders</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Manage purchase order headers</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">New Purchase Order</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search + Filter bar */}
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
                                        placeholder="Search by PO No or Vendor ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredOrders.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredOrders.length)} OF {filteredOrders.length}
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
                                                        { value: "A", label: "A - Active" },
                                                        { value: "X", label: "X - Cancelled" },
                                                        { value: "C", label: "C - Closed" },
                                                    ].map(opt => (
                                                        <div key={opt.value} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`filter-${opt.value}`}
                                                                name="statusFilter"
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
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => setFilterStatus("all")}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
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
                            <div className="overflow-auto max-h-[360px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-2 py-3 w-8"></th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">PO No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">PO Date</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">PO Time</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Vendor ID</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Vendor Ref. Doc. No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Vendor Ref. Doc. Date</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Delivery Text</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Shipping Instruction</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Terms of Payment</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Remarks</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Entered By</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Entered Date & Time</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Approval Remarks</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Approved By</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Approved Date & Time</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">Basic Amt</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">GST Amt</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">Total Amt</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Vendor Email</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Mail Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={18} className="px-4 py-8 text-center text-muted-foreground">
                                                    No purchase orders found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedOrders.map((order, index) => (
                                                <React.Fragment key={order._id || order.po_no}>
                                                    <motion.tr
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        className="hover:bg-muted/30 transition-colors"
                                                    >
                                                        {/* Expand arrow */}
                                                        <td className="px-2 py-3 text-center">
                                                            <button
                                                                onClick={() => handleToggleExpand(order.po_no)}
                                                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Show PO details"
                                                            >
                                                                <ChevronDown
                                                                    className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${expandedRows.has(order.po_no) ? 'rotate-0' : '-rotate-90'}`}
                                                                />
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-semibold">
                                                                {order.po_no}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{formatDate(order.po_date)}</td>
                                                        <td className="px-4 py-3 text-sm font-mono">{order.po_time || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                {getVendorDisplay(order.vendor_id)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{order.vendor_ref_doc_no || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">{formatDate(order.vendor_ref_doc_date)}</td>
                                                        <td className="px-4 py-3 text-sm">{order.delivery_text || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">{order.shipping_instruction || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">{order.terms_of_payment || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">{order.remarks || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {getUserName(order.entered_by_user_id)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{formatDateTime(order.entered_date_time)}</td>
                                                        <td className="px-4 py-3 text-sm">{order.approval_remarks || "-"}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {order.approved_by_user_id ? getUserName(order.approved_by_user_id) : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{formatDateTime(order.approved_date_time)}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{order.po_basic_amount != null ? `₹ ${Number(order.po_basic_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-right">{order.po_gst_amount != null ? `₹ ${Number(order.po_gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">{order.po_total_amount != null ? `₹ ${Number(order.po_total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{vendors.find(v => v.vendor_id === order.vendor_id)?.contact_email_id || '—'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-400">{order.mail_sent_status || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                                {STATUS_LABELS[order.status]?.label || order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={order.status === 'X'}
                                                                    onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                                                                    className={order.status === 'X' ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                                                                    title={order.status === 'X' ? "Cannot print a cancelled PO" : "Print PO"}
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={order.status !== 'E'}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (order.status !== 'E') return;
                                                                        handleEdit(order);
                                                                    }}
                                                                    className={`${order.status === 'E'
                                                                        ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                        : "text-gray-400 cursor-not-allowed"
                                                                    }`}
                                                                    title={order.status !== 'E' ? "Only Entered (E) POs can be edited" : "Edit"}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                {isSuperAdmin && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(order);
                                                                        }}
                                                                        className="text-gray-500 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>

                                                    {/* Expanded detail sub-row */}
                                                    {expandedRows.has(order.po_no) && (
                                                        <tr>
                                                            <td colSpan={18} className="p-0 bg-blue-50/40 border-b border-blue-100">
                                                                <div className="px-8 py-4">
                                                                    {detailsLoading.has(order.po_no) ? (
                                                                        <p className="text-sm text-muted-foreground py-2">Loading details...</p>
                                                                    ) : (expandedDetails[order.po_no] || []).length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground py-2">No detail items for this PO.</p>
                                                                    ) : (
                                                                        <table className="w-full text-xs border rounded-lg overflow-hidden">
                                                                            <thead>
                                                                                <tr className="bg-blue-100">
                                                                                    <th className="px-3 py-2 text-left font-semibold">SNO</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Material ID</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">PO Qty</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">UOM</th>
                                                                                    <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                                                                                    <th className="px-3 py-2 text-right font-semibold">Basic Amt</th>
                                                                                    <th className="px-3 py-2 text-right font-semibold">GST %</th>
                                                                                    <th className="px-3 py-2 text-right font-semibold">GST Amt</th>
                                                                                    <th className="px-3 py-2 text-right font-semibold">Total Amt</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Exp. Delivery</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Material Spec</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-blue-100">
                                                                                {(expandedDetails[order.po_no] || []).map(detail => (
                                                                                    <tr key={detail._id} className="bg-white hover:bg-blue-50/50">
                                                                                        <td className="px-3 py-2">{detail.sno}</td>
                                                                                        <td className="px-3 py-2 font-mono font-semibold text-blue-700">
                                                                                            {detail.material_id}
                                                                                            {(() => { const m = activeMaterials.find(m => m.material_id === detail.material_id); return m ? <span className="block text-xs font-normal font-sans text-gray-500">{m.material_name}</span> : null; })()}
                                                                                        </td>
                                                                                        <td className="px-3 py-2">{detail.po_qty != null ? Number(detail.po_qty).toLocaleString('en-IN') : '-'}</td>
                                                                                        <td className="px-3 py-2">{detail.uom}</td>
                                                                                        <td className="px-3 py-2 text-right">{detail.unit_price != null ? Number(detail.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                                                                        <td className="px-3 py-2 text-right">{detail.basic_amount != null ? Number(detail.basic_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                                                                        <td className="px-3 py-2 text-right text-gray-500">{detail.gst_percentage != null ? `${detail.gst_percentage}%` : '-'}</td>
                                                                                        <td className="px-3 py-2 text-right">{detail.gst_amount != null ? Number(detail.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                                                                        <td className="px-3 py-2 text-right font-semibold text-blue-700">{detail.total_amount != null ? Number(detail.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                                                                        <td className="px-3 py-2 whitespace-nowrap">{detail.expected_delivery_date ? new Date(detail.expected_delivery_date).toLocaleDateString('en-GB') : '-'}</td>
                                                                                        <td className="px-3 py-2 max-w-[180px] truncate text-gray-500" title={detail.material_spec}>{detail.material_spec || '-'}</td>
                                                                                        <td className="px-3 py-2">{detail.remarks || '-'}</td>
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
                                            ))
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
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4 mr-1" />Previous
                                    </Button>
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage >= totalPages}>
                                        Next<ChevronRight className="w-4 h-4 ml-1" />
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
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                                    <h2 className="text-2xl font-bold">New Purchase Order</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">PO Information</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO No. <span className="text-red-500">*</span></label>
                                            <Input name="po_no" value={formData.po_no} disabled className="bg-gray-50 font-mono" />
                                            <p className="text-xs text-muted-foreground mt-1">Auto-generated</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                                            <Input value="E - Entered" disabled className="bg-gray-50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO Date <span className="text-red-500">*</span></label>
                                            <Input type="date" name="po_date" value={formData.po_date} onChange={handleInputChange} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO Time <span className="text-red-500">*</span></label>
                                            <Input type="time" name="po_time" value={formData.po_time} onChange={handleInputChange} required step="1" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor ID <span className="text-red-500">*</span></label>
                                            <select name="vendor_id" value={formData.vendor_id} onChange={handleVendorChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none" required>
                                                <option value="">Select a vendor</option>
                                                {vendors.filter(v => v.active !== false).map(v => (
                                                    <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_id} - {v.vendor_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Vendor Reference</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. No.</label>
                                            <Input name="vendor_ref_doc_no" value={formData.vendor_ref_doc_no} onChange={handleInputChange} placeholder="REF001" maxLength={10} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. Date</label>
                                            <Input type="date" name="vendor_ref_doc_date" value={formData.vendor_ref_doc_date} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Delivery & Terms</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Delivery Text</label>
                                            <Input name="delivery_text" value={formData.delivery_text} onChange={handleInputChange} placeholder="Ex works" maxLength={100} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Shipping Instruction</label>
                                            <Input  name="shipping_instruction" value={formData.shipping_instruction} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Terms of Payment</label>
                                            <Input name="terms_of_payment" value={formData.terms_of_payment} onChange={handleInputChange} placeholder="NET30" maxLength={100} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                            <Input name="remarks" value={formData.remarks} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Entered By</label>
                                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/40">
                                                <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-xs font-semibold">
                                                    {formData.entered_by_user_id}
                                                </span>
                                                {sessionUserName && (
                                                    <span className="text-sm text-foreground font-medium">{sessionUserName}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* PO Totals (display only) */}
                                        <div className="col-span-2 grid grid-cols-5 gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Basic Amount</p>
                                                <p className="text-sm font-semibold text-gray-800">₹ {poBasicAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">GST Amount</p>
                                                <p className="text-sm font-semibold text-gray-800">₹ {poGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Amount</p>
                                                <p className="text-base font-bold text-blue-700">₹ {poTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Vendor Email</p>
                                                <p className="text-sm text-foreground">
                                                    {vendors.find(v => v.vendor_id === formData.vendor_id)?.contact_email_id || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Mail Sent Status</p>
                                                <p className="text-sm text-gray-400">—</p>
                                            </div>
                                        </div>

                                        {/* PO Details table */}
                                        <PODetailTable
                                            detailRows={detailRows}
                                            activeMaterials={activeMaterials}
                                            selectedVendor={vendors.find(v => v.vendor_id === formData.vendor_id)}
                                            onAddRow={handleAddDetailRow}
                                            onMaterialChange={handleDetailMaterialChange}
                                            onChange={handleDetailChange}
                                            onRemoveRow={handleRemoveDetailRow}
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Purchase Order</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Edit Modal ── */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                                    <h2 className="text-2xl font-bold">Edit Purchase Order — {selectedOrder?.po_no}</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">PO Information</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO No.</label>
                                            <Input value={formData.po_no} disabled className="bg-gray-50 font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Status <span className="text-red-500">*</span></label>
                                            <select name="status" value={formData.status} onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none" required>
                                                <option value="E">E - Entered</option>
                                                <option value="A">A - Active</option>
                                                <option value="X">X - Cancelled</option>
                                                <option value="C">C - Closed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO Date <span className="text-red-500">*</span></label>
                                            <Input type="date" name="po_date" value={formData.po_date} onChange={handleInputChange} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO Time <span className="text-red-500">*</span></label>
                                            <Input type="time" name="po_time" value={formData.po_time} onChange={handleInputChange} required step="1" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor ID <span className="text-red-500">*</span></label>
                                            <select name="vendor_id" value={formData.vendor_id} onChange={handleVendorChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none" required>
                                                <option value="">Select a vendor</option>
                                                {vendors.filter(v => v.active !== false).map(v => (
                                                    <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_id} - {v.vendor_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Vendor Reference</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. No.</label>
                                            <Input name="vendor_ref_doc_no" value={formData.vendor_ref_doc_no} onChange={handleInputChange} maxLength={10} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. Date</label>
                                            <Input type="date" name="vendor_ref_doc_date" value={formData.vendor_ref_doc_date} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">Delivery & Terms</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Delivery Text</label>
                                            <Input name="delivery_text" value={formData.delivery_text} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                            <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Shipping Instruction</label>
                                            <Input  name="shipping_instruction" value={formData.shipping_instruction} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Terms of Payment</label>
                                            <Input name="terms_of_payment" value={formData.terms_of_payment} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                            <Input name="remarks" value={formData.remarks} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                        {/* PO Totals (display only) */}
                                        <div className="col-span-2 grid grid-cols-5 gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Basic Amount</p>
                                                <p className="text-sm font-semibold text-gray-800">₹ {poBasicAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">GST Amount</p>
                                                <p className="text-sm font-semibold text-gray-800">₹ {poGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Amount</p>
                                                <p className="text-base font-bold text-blue-700">₹ {poTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Vendor Email</p>
                                                <p className="text-sm text-foreground">
                                                    {vendors.find(v => v.vendor_id === formData.vendor_id)?.contact_email_id || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Mail Sent Status</p>
                                                <p className="text-sm text-gray-400">—</p>
                                            </div>
                                        </div>

                                        {/* PO Details table */}
                                        <PODetailTable
                                            detailRows={detailRows}
                                            activeMaterials={activeMaterials}
                                            selectedVendor={vendors.find(v => v.vendor_id === formData.vendor_id)}
                                            readOnly
                                            onAddRow={handleAddDetailRow}
                                            onMaterialChange={handleDetailMaterialChange}
                                            onChange={handleDetailChange}
                                            onRemoveRow={handleRemoveDetailRow}
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Purchase Order</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete Confirmation ── */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                                <h3 className="text-lg font-bold text-foreground mb-2">Delete Purchase Order</h3>
                                <p className="text-muted-foreground mb-6">
                                    Are you sure you want to permanently delete <span className="font-semibold text-foreground">{orderToDelete?.po_no}</span>? This will also delete all associated PO detail items. This cannot be undone.
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

            {/* ── Send Mail Modal ── */}
            <AnimatePresence>
                {isMailModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsMailModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between px-6 py-4 border-b">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Mail className="w-5 h-5 text-green-600" /> Send Purchase Order Mail</h2>
                                    <button onClick={() => setIsMailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="px-6 py-4 space-y-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600 uppercase">To</Label>
                                        <Input value={mailData.to} onChange={e => setMailData(p => ({ ...p, to: e.target.value }))}
                                            className="mt-1 text-sm" placeholder="Recipient email" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600 uppercase">CC</Label>
                                        <Input value={mailData.cc} onChange={e => setMailData(p => ({ ...p, cc: e.target.value }))}
                                            className="mt-1 text-sm" placeholder="CC email" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600 uppercase">Subject</Label>
                                        <Input value={mailData.subject} onChange={e => setMailData(p => ({ ...p, subject: e.target.value }))}
                                            className="mt-1 text-sm" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-600 uppercase">Body Preview</Label>
                                        <div className="mt-1 border rounded-lg p-4 text-sm bg-gray-50 max-h-60 overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: mailData.body }} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                                    <Button variant="outline" onClick={() => setIsMailModalOpen(false)}>Cancel</Button>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSendMail} disabled={mailSending}>
                                        {mailSending ? 'Sending...' : 'Send Mail'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
