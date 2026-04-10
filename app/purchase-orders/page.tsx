'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { purchaseOrderAPI, vendorAPI } from "@/services/api";
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
}

interface Vendor {
    vendor_id: string;
    vendor_name: string;
    active?: boolean;
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
    const prefix = `M${yy}`;
    const thisYear = existing.filter(o => o.po_no.startsWith(prefix));
    const maxSerial = thisYear.reduce((max, o) => {
        const serial = parseInt(o.po_no.slice(3)) || 0;
        return Math.max(max, serial);
    }, 0);
    return `${prefix}${String(maxSerial + 1).padStart(5, '0')}`;
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

    const [formData, setFormData] = useState({ ...emptyForm });

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
                const data = await vendorAPI.getAll();
                setVendors(data);
            } catch {
                console.error("Failed to load vendors");
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
        }
    }, [isAddModalOpen, orders]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await purchaseOrderAPI.create({
                ...formData,
                po_date: formData.po_date ? new Date(formData.po_date) : new Date(),
                vendor_ref_doc_date: formData.vendor_ref_doc_date || undefined,
                shipping_instruction: formData.shipping_instruction || undefined,
                approved_date_time: formData.approved_date_time || undefined,
                entered_date_time: new Date(),
            });
            toast({ title: "Success", description: `Purchase Order ${formData.po_no} created successfully` });
            setIsAddModalOpen(false);
            loadOrders();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create purchase order", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setFormData({
            po_no: order.po_no,
            po_date: toDateInput(order.po_date),
            po_time: order.po_time || "",
            vendor_id: order.vendor_id,
            vendor_ref_doc_no: order.vendor_ref_doc_no || "",
            vendor_ref_doc_date: toDateInput(order.vendor_ref_doc_date),
            delivery_text: order.delivery_text || "",
            shipping_instruction: toDateInput(order.shipping_instruction),
            terms_of_payment: order.terms_of_payment || "",
            remarks: order.remarks || "",
            entered_by_user_id: order.entered_by_user_id,
            approval_remarks: order.approval_remarks || "",
            approved_by_user_id: order.approved_by_user_id || "",
            approved_date_time: toDateInput(order.approved_date_time),
            status: order.status,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingRef.current || !selectedOrder) return;
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
                approved_by_user_id: formData.approved_by_user_id || undefined,
                approved_date_time: formData.approved_date_time || undefined,
                status: formData.status,
            });
            toast({ title: "Success", description: "Purchase order updated successfully" });
            setIsEditModalOpen(false);
            setSelectedOrder(null);
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
// Helper function for Vendor
const getVendorDisplay = (vendorId: string) => {
    if (!vendorId) return "-";
    const vendor = vendors.find(v => v.vendor_id === vendorId);
    return vendor ? `${vendor.vendor_id} - ${vendor.vendor_name}` : vendorId;
};
    const confirmDelete = async () => {
        if (!orderToDelete) return;
        try {
            await purchaseOrderAPI.delete(orderToDelete.po_no);
            toast({ title: "Deleted", description: `${orderToDelete.po_no} permanently deleted` });
            setIsDeleteDialogOpen(false);
            setOrderToDelete(null);
            loadOrders();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setFilterStatus("all")}
                                            >
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
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={17} className="px-4 py-8 text-center text-muted-foreground">
                                                    No purchase orders found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedOrders.map((order, index) => (
                                                <motion.tr
                                                    key={order._id || order.po_no}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
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
                                                    <td className="px-4 py-3 text-sm">{formatDate(order.shipping_instruction)}</td>
                                                    <td className="px-4 py-3 text-sm">{order.terms_of_payment || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{order.remarks || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                            {order.entered_by_user_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{formatDateTime(order.entered_date_time)}</td>
                                                    <td className="px-4 py-3 text-sm">{order.approval_remarks || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {order.approved_by_user_id ? (
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                {order.approved_by_user_id}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{formatDateTime(order.approved_date_time)}</td>
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
                                                                disabled={order.status === 'X' || order.status === 'C'}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (order.status === 'X' || order.status === 'C') return;
                                                                    handleEdit(order);
                                                                }}
                                                                className={`${
                                                                    order.status !== 'X' && order.status !== 'C'
                                                                        ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                        : "text-gray-400 cursor-not-allowed"
                                                                }`}
                                                                title={order.status === 'X' || order.status === 'C' ? "Cannot edit cancelled/closed PO" : "Edit"}
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
                </div>
            </main>

            {/* Add Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">New Purchase Order</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Section Header */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                PO Information
                                            </h3>
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
                                            <select
                                                name="vendor_id"
                                                value={formData.vendor_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="">Select a vendor</option>
                                                {vendors.filter(v => v.active !== false).map(v => (
                                                    <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_id} - {v.vendor_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Section Header */}
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Vendor Reference
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. No.</label>
                                            <Input name="vendor_ref_doc_no" value={formData.vendor_ref_doc_no} onChange={handleInputChange} placeholder="REF001" maxLength={10} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. Date</label>
                                            <Input type="date" name="vendor_ref_doc_date" value={formData.vendor_ref_doc_date} onChange={handleInputChange} />
                                        </div>

                                        {/* Section Header */}
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Delivery & Terms
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Delivery Text</label>
                                            <Input name="delivery_text" value={formData.delivery_text} onChange={handleInputChange} placeholder="Ex works" maxLength={10} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Shipping Instruction</label>
                                            <Input type="date" name="shipping_instruction" value={formData.shipping_instruction} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Terms of Payment</label>
                                            <Input name="terms_of_payment" value={formData.terms_of_payment} onChange={handleInputChange} placeholder="NET30" maxLength={5} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                            <Input name="remarks" value={formData.remarks} onChange={handleInputChange} maxLength={5} />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Entered By User ID <span className="text-red-500">*</span></label>
                                            <Input name="entered_by_user_id" value={formData.entered_by_user_id} onChange={handleInputChange} maxLength={5} required />
                                        </div>
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

            {/* Edit Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Purchase Order — {selectedOrder?.po_no}</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Section Header */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                PO Information
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">PO No.</label>
                                            <Input value={formData.po_no} disabled className="bg-gray-50 font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Status <span className="text-red-500">*</span></label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
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
                                            <select
                                                name="vendor_id"
                                                value={formData.vendor_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="">Select a vendor</option>
                                                {vendors.filter(v => v.active !== false).map(v => (
                                                    <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_id} - {v.vendor_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Section Header */}
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Vendor Reference
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. No.</label>
                                            <Input name="vendor_ref_doc_no" value={formData.vendor_ref_doc_no} onChange={handleInputChange} maxLength={10} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Vendor Ref. Doc. Date</label>
                                            <Input type="date" name="vendor_ref_doc_date" value={formData.vendor_ref_doc_date} onChange={handleInputChange} />
                                        </div>

                                        {/* Section Header */}
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Delivery & Terms
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Delivery Text</label>
                                            <Input name="delivery_text" value={formData.delivery_text} onChange={handleInputChange} maxLength={10} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Shipping Instruction</label>
                                            <Input type="date" name="shipping_instruction" value={formData.shipping_instruction} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Terms of Payment</label>
                                            <Input name="terms_of_payment" value={formData.terms_of_payment} onChange={handleInputChange} maxLength={5} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                            <Input name="remarks" value={formData.remarks} onChange={handleInputChange} maxLength={5} />
                                        </div>

                                        {/* Section Header */}
                                        <div className="col-span-2 mt-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Approval Information
                                            </h3>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Approval Remarks</label>
                                            <Input name="approval_remarks" value={formData.approval_remarks} onChange={handleInputChange} maxLength={100} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Approved By User ID</label>
                                            <Input name="approved_by_user_id" value={formData.approved_by_user_id} onChange={handleInputChange} maxLength={5} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Approved Date</label>
                                            <Input type="date" name="approved_date_time" value={formData.approved_date_time} onChange={handleInputChange} />
                                        </div>
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

            {/* Delete Confirmation */}
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
                                    Are you sure you want to permanently delete <span className="font-semibold text-foreground">{orderToDelete?.po_no}</span>? This cannot be undone.
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
