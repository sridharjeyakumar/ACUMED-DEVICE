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
import { machineStopReasonAPI } from "@/services/api";
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

interface MachineStopReason {
    reason_id: string;              // Char(1) - PK
    reason_name: string;            // Char(25)
    remarks?: string;               // Char(100)
    seq_no: number;                 // N(2)
    active: boolean;
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date;
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

export default function MachineStopReasonMasterPage() {
    const { toast } = useToast();
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState<MachineStopReason | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [reasonToCancel, setReasonToCancel] = useState<MachineStopReason | null>(null);
    const [selectedReason, setSelectedReason] = useState<MachineStopReason | null>(null);
    const isSubmittingRef = useRef(false);
    const [filterActive, setFilterActive] = useState<string>("active");
    const [reasons, setReasons] = useState<MachineStopReason[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: MachineStopReason } | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        reason_id: "",
        reason_name: "",
        remarks: "",
        seq_no: "",
        active: true,
    });

    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ reason_id: "", reason_name: "", remarks: "", seq_no: "", active: true });
        }
    }, [isAddModalOpen]);

    const loadReasons = useCallback(async () => {
        try {
            setLoading(true);
            const data = await machineStopReasonAPI.getAll();
            const reasonsWithActive = data.map((r: any) => ({
                ...r,
                active: r.active !== undefined ? r.active : true
            }));
            setReasons(reasonsWithActive);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load machine stop reasons",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadReasons();
    }, [loadReasons]);

    const filteredReasons = reasons.filter((r) => {
        const matchesSearch =
            r.reason_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reason_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesActive =
            filterActive === "all" ||
            (filterActive === "active" && r.active === true) ||
            (filterActive === "inactive" && r.active === false);

        return matchesSearch && matchesActive;
    });

    const totalPages = Math.ceil(filteredReasons.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedReasons = filteredReasons.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await machineStopReasonAPI.create({
                reason_id: formData.reason_id,
                reason_name: formData.reason_name,
                remarks: formData.remarks || '',
                seq_no: parseInt(formData.seq_no) || 0,
                active: true,
                last_modified_user_id: "ADMIN",
            });
            toast({ title: "Success", description: "Machine stop reason created successfully" });
            setIsAddModalOpen(false);
            setFormData({ reason_id: "", reason_name: "", remarks: "", seq_no: "", active: true });
            loadReasons();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create machine stop reason",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (reason: MachineStopReason) => {
        setReasonToDelete(reason);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!reasonToDelete) return;
        try {
            await machineStopReasonAPI.delete(reasonToDelete.reason_id);
            setReasons(prev => prev.filter(r => r.reason_id !== reasonToDelete.reason_id));
            toast({ title: "Deleted", description: `Reason "${reasonToDelete.reason_name}" has been deleted.` });
            setIsDeleteDialogOpen(false);
            setReasonToDelete(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || 'Failed to delete reason', variant: "destructive" });
        }
    };

    const handleEdit = (reason: MachineStopReason) => {
        if (!reason.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "Cancelled reasons cannot be edited",
                variant: "destructive",
            });
            return;
        }
        setSelectedReason(reason);
        setFormData({
            reason_id: reason.reason_id,
            reason_name: reason.reason_name,
            remarks: reason.remarks || "",
            seq_no: reason.seq_no.toString(),
            active: reason.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedReason) return;

        if (!selectedReason.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "This reason has been cancelled and cannot be edited",
                variant: "destructive",
            });
            setIsEditModalOpen(false);
            return;
        }

        isSubmittingRef.current = true;
        const previousData = { ...selectedReason };

        try {
            await machineStopReasonAPI.update(selectedReason.reason_id, {
                reason_name: formData.reason_name,
                remarks: formData.remarks || '',
                seq_no: parseInt(formData.seq_no) || 0,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });

            setLastAction({ type: 'edit', data: previousData });

            toast({
                title: "Success",
                description: "Machine stop reason updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedReason(null);
            setFormData({ reason_id: "", reason_name: "", remarks: "", seq_no: "", active: true });
            loadReasons();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update machine stop reason",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        try {
            if (lastAction.type === 'edit') {
                await machineStopReasonAPI.update(lastAction.data.reason_id, {
                    reason_name: lastAction.data.reason_name,
                    remarks: lastAction.data.remarks || '',
                    seq_no: lastAction.data.seq_no,
                    active: lastAction.data.active,
                    last_modified_user_id: "ADMIN",
                });
                toast({ title: "Undone", description: "Changes have been reverted" });
            }
            setLastAction(null);
            loadReasons();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (reason: MachineStopReason) => {
        if (!reason.active) {
            toast({
                title: "Already Cancelled",
                description: "This reason is already cancelled",
                variant: "destructive",
            });
            return;
        }
        setReasonToCancel(reason);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!reasonToCancel) return;
        try {
            await machineStopReasonAPI.update(reasonToCancel.reason_id, {
                reason_name: reasonToCancel.reason_name,
                remarks: reasonToCancel.remarks || '',
                seq_no: reasonToCancel.seq_no,
                active: false,
                last_modified_user_id: "ADMIN",
            });
            await loadReasons();
            toast({
                title: "Cancelled",
                description: `Machine stop reason "${reasonToCancel.reason_name}" has been cancelled`,
            });
            setIsCancelItemDialogOpen(false);
            setReasonToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel machine stop reason",
                variant: "destructive",
            });
        }
    };

    const handleCancelClick = (modalType: 'add' | 'edit') => {
        setCancelModalType(modalType);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (cancelModalType === 'add') {
            setIsAddModalOpen(false);
            setFormData({ reason_id: "", reason_name: "", remarks: "", seq_no: "", active: true });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedReason(null);
            setFormData({ reason_id: "", reason_name: "", remarks: "", seq_no: "", active: true });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Machine Stop Reason Master</h1>
                                <p className="text-muted-foreground">Define and manage reasons for machine stoppages</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Reason
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
                                        placeholder="Search by Reason ID or Reason Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredReasons.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredReasons.length)} OF {filteredReasons.length}
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
                                                                id={`msr-active-${value}`}
                                                                name="msrActiveStatus"
                                                                checked={filterActive === value}
                                                                onChange={() => setFilterActive(value)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`msr-active-${value}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
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
                                                onClick={() => setFilterActive("all")}
                                            >
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Reason Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Reason Name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Seq No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>User Id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>Date & Time</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading machine stop reasons...
                                                </td>
                                            </tr>
                                        ) : filteredReasons.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    No machine stop reasons found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedReasons.map((reason, index) => (
                                                <motion.tr
                                                    key={reason.reason_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${!reason.active ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground font-mono">{reason.reason_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{reason.reason_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{reason.remarks || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{reason.seq_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            reason.active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                            {reason.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-foreground">{reason.last_modified_user_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {reason.last_modified_date_time
                                                                ? formatDateTime(reason.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => { e.stopPropagation(); if (!reason.active && !isSuperAdmin) return; handleEdit(reason); }}
                                                                className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${!reason.active && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                disabled={!reason.active && !isSuperAdmin}
                                                                title={!reason.active && !isSuperAdmin ? "Cannot edit cancelled reasons" : "Edit reason"}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); handleCancel(reason); }}
                                                                className={`${reason.active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`}
                                                                disabled={!reason.active}
                                                                title={reason.active ? "Cancel reason" : "Already cancelled"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(reason); }}
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
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE {currentPage} OF {totalPages || 1}</span>
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => handleCancelClick('add')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add Machine Stop Reason</h2>
                                    <button
                                        onClick={() => handleCancelClick('add')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Reason ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="reason_id"
                                                value={formData.reason_id}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={1}
                                                placeholder="e.g. L"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Reason Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="reason_name"
                                                value={formData.reason_name}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={25}
                                                placeholder="e.g. Lunch / Tea Break"
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Active Status</label>
                                            <div className="flex items-center gap-4 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="active"
                                                        checked={formData.active === true}
                                                        onChange={() => setFormData({ ...formData, active: true })}
                                                        className="text-blue-600"
                                                        disabled
                                                    />
                                                    <span className="text-sm">Yes (default)</span>
                                                </label>
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
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Reason</Button>
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => handleCancelClick('edit')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Machine Stop Reason</h2>
                                    <button
                                        onClick={() => handleCancelClick('edit')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Reason ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="reason_id"
                                                value={formData.reason_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Reason Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="reason_name"
                                                value={formData.reason_name}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={25}
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
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Active Status</label>
                                            <div className="flex items-center gap-4 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="active"
                                                        checked={formData.active === true}
                                                        onChange={() => setFormData({ ...formData, active: true })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="active"
                                                        checked={formData.active === false}
                                                        onChange={() => setFormData({ ...formData, active: false })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                            <Input
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                maxLength={100}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Reason</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation Dialog (for modals) */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel? Any unsaved changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelDialogOpen(false)}>
                            No, Continue Editing
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
                            Yes, Cancel
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
                            Are you sure you want to cancel machine stop reason {reasonToCancel?.reason_name}?
                            This will make it inactive and it cannot be edited or used in the future.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsCancelItemDialogOpen(false); setReasonToCancel(null); }}>
                            No, Keep Active
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-red-600 hover:bg-red-700">
                            Yes, Cancel Reason
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reason</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete &quot;{reasonToDelete?.reason_name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setReasonToDelete(null); }}>
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
