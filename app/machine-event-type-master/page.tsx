'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { machineEventTypeAPI, batchStatusAPI } from "@/services/api";
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

interface MachineEventType {
    machine_event_type_id: string;              // Char(2) - PK
    machine_event_type_name: string;            // Char(25)
    remarks?: string;                           // Char(100)
    seq_no: number;                             // N(2)
    batch_status_id?: string;                   // Char(1) - FK
    prerequisite_machine_event_type_id?: string; // Char(2)
    accept_material?: string;                   // Char(1)
    accept_open_qty?: string;                   // Char(1)
    accept_close_qty?: string;                  // Char(1)
    accept_reason?: string;                     // Char(1)
    allow_event_time_edited?: string;           // Char(1)
    active: boolean;
    last_modified_user_id?: string;             // Char(5)
    last_modified_date_time?: Date;
}

interface BatchStatus {
    batch_status_id: string;
    batch_status_name: string;
}

const emptyForm = {
    machine_event_type_id: "",
    machine_event_type_name: "",
    remarks: "",
    seq_no: "",
    batch_status_id: "",
    prerequisite_machine_event_type_id: "",
    accept_material: "",
    accept_open_qty: "",
    accept_close_qty: "",
    accept_reason: "",
    allow_event_time_edited: "N",
    active: true,
};

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

export default function MachineEventTypeMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [typeToCancel, setTypeToCancel] = useState<MachineEventType | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<MachineEventType | null>(null);
    const [selectedType, setSelectedType] = useState<MachineEventType | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const isSubmittingRef = useRef(false);
    const [filterActive, setFilterActive] = useState<string>("active");
    const [types, setTypes] = useState<MachineEventType[]>([]);
    const [batchStatuses, setBatchStatuses] = useState<BatchStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: MachineEventType } | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({ ...emptyForm });

    useEffect(() => {
        if (isAddModalOpen) setFormData({ ...emptyForm });
    }, [isAddModalOpen]);

    const loadTypes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await machineEventTypeAPI.getAll();
            setTypes(data.map((t: any) => ({ ...t, active: t.active !== undefined ? t.active : true })));
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load machine event types", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const loadBatchStatuses = useCallback(async () => {
        try {
            const data = await batchStatusAPI.getAll();
            setBatchStatuses(data.filter((s: any) => s.active !== false));
        } catch {
            // non-blocking
        }
    }, []);

    useEffect(() => {
        loadTypes();
        loadBatchStatuses();
    }, [loadTypes, loadBatchStatuses]);

    const filteredTypes = types.filter((t) => {
        const matchesSearch =
            t.machine_event_type_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.machine_event_type_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesActive =
            filterActive === "all" ||
            (filterActive === "active" && t.active === true) ||
            (filterActive === "inactive" && t.active === false);
        return matchesSearch && matchesActive;
    });

    const totalPages = Math.ceil(filteredTypes.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTypes = filteredTypes.slice(startIndex, endIndex);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const buildPayload = (data: typeof formData, isNew = false) => ({
        machine_event_type_id: data.machine_event_type_id,
        machine_event_type_name: data.machine_event_type_name,
        remarks: data.remarks || '',
        seq_no: parseInt(data.seq_no) || 0,
        batch_status_id: data.batch_status_id || '',
        prerequisite_machine_event_type_id: data.prerequisite_machine_event_type_id || '',
        accept_material: data.accept_material || '',
        accept_open_qty: data.accept_open_qty || '',
        accept_close_qty: data.accept_close_qty || '',
        accept_reason: data.accept_reason || '',
        allow_event_time_edited: data.allow_event_time_edited || '',
        active: isNew ? true : data.active,
        last_modified_user_id: "ADMIN",
    });

    const doCreate = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await machineEventTypeAPI.create(buildPayload(formData, true));
            toast({ title: "Success", description: "Machine event type created successfully" });
            setIsAddModalOpen(false);
            setFormData({ ...emptyForm });
            loadTypes();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create machine event type", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const isDuplicate = types.some(
            t => t.machine_event_type_id.toUpperCase() === formData.machine_event_type_id.toUpperCase()
        );
        if (isDuplicate) {
            toast({ title: "Duplicate Event Type ID", description: `Event Type ID "${formData.machine_event_type_id}" already exists. Please use a different ID.`, variant: "destructive" });
            return;
        }
        await doCreate();
    };

    const handleDelete = (type: MachineEventType) => {
        setTypeToDelete(type);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!typeToDelete) return;
        try {
            await machineEventTypeAPI.delete(typeToDelete.machine_event_type_id);
            toast({ title: "Deleted", description: "Machine event type permanently deleted" });
            setIsDeleteDialogOpen(false);
            setTypeToDelete(null);
            loadTypes();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete machine event type", variant: "destructive" });
        }
    };

    const handleEdit = (type: MachineEventType) => {
        if (!type.active && !isSuperAdmin) {
            toast({ title: "Cannot Edit", description: "Cancelled event types cannot be edited", variant: "destructive" });
            return;
        }
        setSelectedType(type);
        setFormData({
            machine_event_type_id: type.machine_event_type_id,
            machine_event_type_name: type.machine_event_type_name,
            remarks: type.remarks || "",
            seq_no: type.seq_no.toString(),
            batch_status_id: type.batch_status_id || "",
            prerequisite_machine_event_type_id: type.prerequisite_machine_event_type_id || "",
            accept_material: type.accept_material || "",
            accept_open_qty: type.accept_open_qty || "",
            accept_close_qty: type.accept_close_qty || "",
            accept_reason: type.accept_reason || "",
            allow_event_time_edited: type.allow_event_time_edited || "N",
            active: type.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedType) return;

        if (!selectedType.active && !isSuperAdmin) {
            toast({ title: "Cannot Edit", description: "This event type has been cancelled and cannot be edited", variant: "destructive" });
            setIsEditModalOpen(false);
            return;
        }

        isSubmittingRef.current = true;
        const previousData = { ...selectedType };

        try {
            await machineEventTypeAPI.update(selectedType.machine_event_type_id, buildPayload(formData));
            setLastAction({ type: 'edit', data: previousData });
            toast({
                title: "Success",
                description: "Machine event type updated successfully",
                action: <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>,
            });
            setIsEditModalOpen(false);
            setSelectedType(null);
            setFormData({ ...emptyForm });
            loadTypes();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update machine event type", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        try {
            if (lastAction.type === 'edit') {
                const d = lastAction.data;
                await machineEventTypeAPI.update(d.machine_event_type_id, {
                    machine_event_type_name: d.machine_event_type_name,
                    remarks: d.remarks || '',
                    seq_no: d.seq_no,
                    batch_status_id: d.batch_status_id || '',
                    prerequisite_machine_event_type_id: d.prerequisite_machine_event_type_id || '',
                    accept_material: d.accept_material || '',
                    accept_open_qty: d.accept_open_qty || '',
                    accept_close_qty: d.accept_close_qty || '',
                    accept_reason: d.accept_reason || '',
                    allow_event_time_edited: d.allow_event_time_edited || '',
                    active: d.active,
                    last_modified_user_id: "ADMIN",
                });
                toast({ title: "Undone", description: "Changes have been reverted" });
            }
            setLastAction(null);
            loadTypes();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to undo action", variant: "destructive" });
        }
    };

    const handleCancel = (type: MachineEventType) => {
        if (!type.active) {
            toast({ title: "Already Cancelled", description: "This event type is already cancelled", variant: "destructive" });
            return;
        }
        setTypeToCancel(type);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!typeToCancel) return;
        try {
            await machineEventTypeAPI.update(typeToCancel.machine_event_type_id, {
                machine_event_type_name: typeToCancel.machine_event_type_name,
                remarks: typeToCancel.remarks || '',
                seq_no: typeToCancel.seq_no,
                batch_status_id: typeToCancel.batch_status_id || '',
                prerequisite_machine_event_type_id: typeToCancel.prerequisite_machine_event_type_id || '',
                accept_material: typeToCancel.accept_material || '',
                accept_open_qty: typeToCancel.accept_open_qty || '',
                accept_close_qty: typeToCancel.accept_close_qty || '',
                accept_reason: typeToCancel.accept_reason || '',
                allow_event_time_edited: typeToCancel.allow_event_time_edited || '',
                active: false,
                last_modified_user_id: "ADMIN",
            });
            await loadTypes();
            toast({ title: "Cancelled", description: `Machine event type "${typeToCancel.machine_event_type_name}" has been cancelled` });
            setIsCancelItemDialogOpen(false);
            setTypeToCancel(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to cancel machine event type", variant: "destructive" });
        }
    };

    const handleCancelClick = (modalType: 'add' | 'edit') => {
        setCancelModalType(modalType);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (cancelModalType === 'add') setIsAddModalOpen(false);
        else if (cancelModalType === 'edit') { setIsEditModalOpen(false); setSelectedType(null); }
        setFormData({ ...emptyForm });
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    // Reusable form fields
    const renderFormFields = (isEdit = false) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Event Type ID <span className="text-red-500">*</span>
                </label>
                <Input
                    name="machine_event_type_id"
                    value={formData.machine_event_type_id}
                    onChange={handleInputChange}
                    required
                    maxLength={2}
                    placeholder="e.g. NB"
                    disabled={isEdit}
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Event Type Name <span className="text-red-500">*</span>
                </label>
                <Input
                    name="machine_event_type_name"
                    value={formData.machine_event_type_name}
                    onChange={handleInputChange}
                    required
                    maxLength={25}
                    placeholder="e.g. New Batch Start"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Seq No. <span className="text-red-500">*</span>
                </label>
                <Input
                    name="seq_no"
                    type="number"
                    value={formData.seq_no}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={99}
                    placeholder="e.g. 1"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Batch Status ID <span className="text-muted-foreground text-xs">(FK)</span>
                </label>
                <select
                    name="batch_status_id"
                    value={formData.batch_status_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Select --</option>
                    {batchStatuses.map((s) => (
                        <option key={s.batch_status_id} value={s.batch_status_id}>
                            {s.batch_status_id} - {s.batch_status_name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Prerequisite Event Type
                </label>
                <select
                    name="prerequisite_machine_event_type_id"
                    value={formData.prerequisite_machine_event_type_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- None --</option>
                    {types
                        .filter((t) => t.active && t.machine_event_type_id !== formData.machine_event_type_id)
                        .map((t) => (
                            <option key={t.machine_event_type_id} value={t.machine_event_type_id}>
                                {t.machine_event_type_id} - {t.machine_event_type_name}
                            </option>
                        ))}
                </select>
            </div>
            {isEdit && (
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Active Status</label>
                    <div className="flex items-center gap-4 pt-2">
                        {[true, false].map((val) => (
                            <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="active"
                                    checked={formData.active === val}
                                    onChange={() => setFormData({ ...formData, active: val })}
                                    className="text-blue-600"
                                />
                                <span className="text-sm">{val ? "Yes" : "No"}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            {/* Accept flags - Y or empty */}
            <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-3">Accept Flags</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: "accept_material", label: "Accept Material" },
                        { name: "accept_open_qty", label: "Accept Open Qty" },
                        { name: "accept_close_qty", label: "Accept Close Qty" },
                        { name: "accept_reason", label: "Accept Reason" },
                    ].map(({ name, label }) => (
                        <div key={name} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`${name}-${isEdit ? 'edit' : 'add'}`}
                                checked={formData[name as keyof typeof formData] === "Y"}
                                onChange={(e) =>
                                    setFormData({ ...formData, [name]: e.target.checked ? "Y" : "" })
                                }
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`${name}-${isEdit ? 'edit' : 'add'}`} className="text-sm font-medium text-foreground cursor-pointer">
                                {label}
                            </label>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`allow_event_time_edited-${isEdit ? 'edit' : 'add'}`}
                            checked={formData.allow_event_time_edited === "Y"}
                            onChange={(e) =>
                                setFormData({ ...formData, allow_event_time_edited: e.target.checked ? "Y" : "N" })
                            }
                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`allow_event_time_edited-${isEdit ? 'edit' : 'add'}`} className="text-sm font-medium text-foreground cursor-pointer">
                            Allow Event Time Edit
                        </label>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                <Input
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="Optional remarks..."
                />
            </div>
        </div>
    );

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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Machine Event Type Master</h1>
                                <p className="text-muted-foreground">Define and manage machine event types for production tracking</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Event Type
                            </Button>
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
                                        placeholder="Search by Event Type ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredTypes.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredTypes.length)} OF {filteredTypes.length}
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
                                                    {[
                                                        { value: "all", label: "All" },
                                                        { value: "active", label: "Active" },
                                                        { value: "inactive", label: "Inactive" },
                                                    ].map(({ value, label }) => (
                                                        <div key={value} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`met-active-${value}`}
                                                                name="metActiveStatus"
                                                                checked={filterActive === value}
                                                                onChange={() => setFilterActive(value)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`met-active-${value}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">No. of rows per screen</Label>
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => setFilterActive("all")}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card>
                    </motion.div>

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
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Event Type Id</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Event Type Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Seq No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Prerequisite</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Matl</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Open Qty</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Close Qty</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Reason</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Allow Event Time Edit</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>Last Modified</span><span>User Id</span></div>
                                            </th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>Last Modified</span><span>Date & Time</span></div>
                                            </th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={15} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading machine event types...
                                                </td>
                                            </tr>
                                        ) : filteredTypes.length === 0 ? (
                                            <tr>
                                                <td colSpan={15} className="px-6 py-4 text-center text-muted-foreground">
                                                    No machine event types found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedTypes.map((type, index) => (
                                                <motion.tr
                                                    key={type.machine_event_type_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${!type.active ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-mono text-muted-foreground">{type.machine_event_type_id}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-foreground">{type.machine_event_type_name}</span>
                                                    </td>
                                                    <td className="px-4 py-4 max-w-[150px]">
                                                        <span className="text-sm text-foreground truncate block" title={type.remarks}>{type.remarks || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-foreground">{type.seq_no}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-mono text-foreground">{type.batch_status_id || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-mono text-foreground">{type.prerequisite_machine_event_type_id || "-"}</span>
                                                    </td>
                                                    {["accept_material", "accept_open_qty", "accept_close_qty", "accept_reason"].map((field) => (
                                                        <td key={field} className="px-4 py-4 text-center">
                                                            {type[field as keyof MachineEventType] === "Y" ? (
                                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold">Y</span>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-4 text-center">
                                                        {type.allow_event_time_edited === "Y" ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold">Y</span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${type.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {type.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-mono text-foreground">{type.last_modified_user_id || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {type.last_modified_date_time ? formatDateTime(type.last_modified_date_time) : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(type); }}
                                                                className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${!type.active && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                disabled={!type.active && !isSuperAdmin}
                                                                title={!type.active && !isSuperAdmin ? "Cannot edit cancelled event types" : "Edit event type"}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); handleCancel(type); }}
                                                                className={`${type.active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`}
                                                                disabled={!type.active}
                                                                title={type.active ? "Cancel event type" : "Already cancelled"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(type); }}
                                                                    className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                                    title="Permanently delete"
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

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => handleCancelClick('add')} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add Machine Event Type</h2>
                                    <button onClick={() => handleCancelClick('add')} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderFormFields(false)}
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Event Type</Button>
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => handleCancelClick('edit')} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Machine Event Type</h2>
                                    <button onClick={() => handleCancelClick('edit')} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderFormFields(true)}
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Event Type</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation Dialog (modals) */}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Machine Event Type</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete &quot;{typeToDelete?.machine_event_type_name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setTypeToDelete(null); }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Item Confirmation Dialog */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel machine event type {typeToCancel?.machine_event_type_name}?
                            This will make it inactive and it cannot be edited or used in the future.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsCancelItemDialogOpen(false); setTypeToCancel(null); }}>No, Keep Active</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-red-600 hover:bg-red-700">Yes, Cancel Event Type</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
