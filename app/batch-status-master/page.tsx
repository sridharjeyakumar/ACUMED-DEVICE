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
import { batchStatusAPI } from "@/services/api";
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

interface BatchStatus {
    batch_status_id: string;        // Char(1) - PK
    batch_status_name: string;      // Char(25)
    remarks?: string;               // Char(100)
    seq_no: number;                 // N(2)
    status_seq_no?: number;            // N(2)
    machine_event_allowed:string;      // Char(1) - 'Y' or 'N'
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

export default function BatchStatusMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [statusToCancel, setStatusToCancel] = useState<BatchStatus | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<BatchStatus | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const [selectedStatus, setSelectedStatus] = useState<BatchStatus | null>(null);
    const isSubmittingRef = useRef(false);
    const [filterActive, setFilterActive] = useState<string>("active");
    const [statuses, setStatuses] = useState<BatchStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: BatchStatus } | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        batch_status_id: "",
        batch_status_name: "",
        remarks: "",
        seq_no: "",
        status_seq_no: "",
        machine_event_allowed: "N",
        active: true,
    });

    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                batch_status_id: "",
                batch_status_name: "",
                remarks: "",
                seq_no: "",
                status_seq_no: "",
                machine_event_allowed: "N",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const loadStatuses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await batchStatusAPI.getAll();
            const statusesWithActive = data.map((status: any) => ({
                ...status,
                active: status.active !== undefined ? status.active : true
            }));
            setStatuses(statusesWithActive);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load batch statuses",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadStatuses();
    }, [loadStatuses]);

    const filteredStatuses = statuses.filter((status) => {
        const matchesSearch =
            status.batch_status_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            status.batch_status_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesActive =
            filterActive === "all" ||
            (filterActive === "active" && status.active === true) ||
            (filterActive === "inactive" && status.active === false);

        return matchesSearch && matchesActive;
    });

    const totalPages = Math.ceil(filteredStatuses.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedStatuses = filteredStatuses.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await batchStatusAPI.create({
                batch_status_id: formData.batch_status_id,
                batch_status_name: formData.batch_status_name,
                remarks: formData.remarks || '',
                seq_no: parseInt(formData.seq_no) || 0,
                status_seq_no: parseInt(formData.status_seq_no) || 0,
                machine_event_allowed: formData.machine_event_allowed,
                active: true,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Batch status created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ batch_status_id: "", batch_status_name: "", remarks: "", seq_no: "", status_seq_no: "", machine_event_allowed: "N", active: true });
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create batch status",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (status: BatchStatus) => {
        setStatusToDelete(status);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!statusToDelete) return;
        try {
            await batchStatusAPI.delete(statusToDelete.batch_status_id);
            toast({ title: "Deleted", description: "Batch status permanently deleted" });
            setIsDeleteDialogOpen(false);
            setStatusToDelete(null);
            loadStatuses();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete batch status", variant: "destructive" });
        }
    };

    const handleEdit = (status: BatchStatus) => {
        if (!status.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "Cancelled statuses cannot be edited",
                variant: "destructive",
            });
            return;
        }
        setSelectedStatus(status);
        setFormData({
            batch_status_id: status.batch_status_id,
            batch_status_name: status.batch_status_name,
            remarks: status.remarks || "",
            seq_no: status.seq_no.toString(),
            active: status.active,
            status_seq_no: status.status_seq_no ? status.status_seq_no.toString() : "",
            machine_event_allowed: status.machine_event_allowed || "N",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedStatus) return;

        if (!selectedStatus.active && !isSuperAdmin) {
            toast({
                title: "Cannot Edit",
                description: "This status has been cancelled and cannot be edited",
                variant: "destructive",
            });
            setIsEditModalOpen(false);
            return;
        }

        isSubmittingRef.current = true;
        const previousData = { ...selectedStatus };

        try {
            await batchStatusAPI.update(selectedStatus.batch_status_id, {
                batch_status_name: formData.batch_status_name,
                remarks: formData.remarks || '',
                seq_no: parseInt(formData.seq_no) || 0,
                status_seq_no: parseInt(formData.status_seq_no) || 0,
                machine_event_allowed: formData.machine_event_allowed,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            });

            setLastAction({ type: 'edit', data: previousData });

            toast({
                title: "Success",
                description: "Batch status updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({ batch_status_id: "", batch_status_name: "", remarks: "", seq_no: "", status_seq_no: "", machine_event_allowed: "N", active: true });
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update batch status",
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
                await batchStatusAPI.update(lastAction.data.batch_status_id, {
                    batch_status_name: lastAction.data.batch_status_name,
                    remarks: lastAction.data.remarks || '',
                    seq_no: lastAction.data.seq_no,
                    status_seq_no: lastAction.data.status_seq_no || 0,
                    machine_event_allowed: lastAction.data.machine_event_allowed || "N",
                    active: lastAction.data.active,
                    last_modified_user_id: "ADMIN",
                });
                toast({ title: "Undone", description: "Changes have been reverted" });
            }
            setLastAction(null);
            loadStatuses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (status: BatchStatus) => {
        if (!status.active) {
            toast({
                title: "Already Cancelled",
                description: "This status is already cancelled",
                variant: "destructive",
            });
            return;
        }
        setStatusToCancel(status);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!statusToCancel) return;
        try {
            await batchStatusAPI.update(statusToCancel.batch_status_id, {
                batch_status_name: statusToCancel.batch_status_name,
                remarks: statusToCancel.remarks || '',
                seq_no: statusToCancel.seq_no,
                status_seq_no: statusToCancel.status_seq_no || 0,
                machine_event_allowed: statusToCancel.machine_event_allowed || "N",
                active: false,
                last_modified_user_id: "ADMIN",
            });
            await loadStatuses();
            toast({
                title: "Cancelled",
                description: `Batch status "${statusToCancel.batch_status_name}" has been cancelled`,
            });
            setIsCancelItemDialogOpen(false);
            setStatusToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel batch status",
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
            setFormData({ batch_status_id: "", batch_status_name: "", remarks: "", seq_no: "", status_seq_no: "", machine_event_allowed: "N", active: true });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({ batch_status_id: "", batch_status_name: "", remarks: "", seq_no: "", status_seq_no: "", machine_event_allowed: "N", active: true });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Batch Status Master</h1>
                                <p className="text-muted-foreground">Define and manage various statuses for production batches</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Batch Status
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
                                        placeholder="Search by Status ID or Batch Status Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredStatuses.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredStatuses.length)} OF {filteredStatuses.length}
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
                                                                id={`bs-active-${value}`}
                                                                name="bsActiveStatus"
                                                                checked={filterActive === value}
                                                                onChange={() => setFilterActive(value)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`bs-active-${value}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch Status Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch Status Name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Seq No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status Seq No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Machine Event Allowed</th>
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
                                                    Loading batch statuses...
                                                </td>
                                            </tr>
                                        ) : filteredStatuses.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    No batch statuses found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedStatuses.map((status, index) => (
                                                <motion.tr
                                                    key={status.batch_status_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${!status.active ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground font-mono">{status.batch_status_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.batch_status_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.remarks || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.seq_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.status_seq_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.machine_event_allowed}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            status.active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                            {status.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono text-foreground">{status.last_modified_user_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {status.last_modified_date_time
                                                                ? formatDateTime(status.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(status); }}
                                                                className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${!status.active && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                disabled={!status.active && !isSuperAdmin}
                                                                title={!status.active && !isSuperAdmin ? "Cannot edit cancelled statuses" : "Edit status"}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); handleCancel(status); }}
                                                                className={`${status.active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'opacity-50 cursor-not-allowed'}`}
                                                                disabled={!status.active}
                                                                title={status.active ? "Cancel status" : "Already cancelled"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(status); }}
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
                                    <h2 className="text-2xl font-bold">Add Batch Status</h2>
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
                                                Batch Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="batch_status_id"
                                                value={formData.batch_status_id}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={1}
                                                placeholder="e.g. P"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch Status Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="batch_status_name"
                                                value={formData.batch_status_name}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={25}
                                                placeholder="e.g. Planned"
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
                                                Status Seq No. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="status_seq_no"
                                                type="number"
                                                value={formData.status_seq_no}
                                                onChange={handleInputChange}
                                                required
                                                min={0}
                                                max={99}
                                                placeholder="e.g. 1"
                                            />
                                        </div>
<div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine Event Allowed <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-4 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="machine_event_allowed"
                                                        checked={formData.machine_event_allowed === "Y"}
                                                        onChange={() => setFormData({ ...formData, machine_event_allowed: "Y" })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="machine_event_allowed"
                                                        checked={formData.machine_event_allowed === "N"}
                                                        onChange={() => setFormData({ ...formData, machine_event_allowed: "N" })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
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
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Status</Button>
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
                                    <h2 className="text-2xl font-bold">Edit Batch Status</h2>
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
                                                Batch Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="batch_status_id"
                                                value={formData.batch_status_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch Status Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="batch_status_name"
                                                value={formData.batch_status_name}
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status Seq No. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="status_seq_no"
                                                type="number"
                                                value={formData.status_seq_no}
                                                onChange={handleInputChange}
                                                required
                                                min={0}
                                                max={99}
                                                placeholder="e.g. 1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine Event Allowed <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-4 pt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="machine_event_allowed"
                                                        checked={formData.machine_event_allowed === "Y"}
                                                        onChange={() => setFormData({ ...formData, machine_event_allowed: "Y" })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="machine_event_allowed"
                                                        checked={formData.machine_event_allowed === "N"}
                                                        onChange={() => setFormData({ ...formData, machine_event_allowed: "N" })}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
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
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Status</Button>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Batch Status</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete &quot;{statusToDelete?.batch_status_name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setStatusToDelete(null); }}>
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
                            Are you sure you want to cancel batch status {statusToCancel?.batch_status_name}?
                            This will make it inactive and it cannot be edited or used in the future.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsCancelItemDialogOpen(false); setStatusToCancel(null); }}>
                            No, Keep Active
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-red-600 hover:bg-red-700">
                            Yes, Cancel Status
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
