'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, X, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { coaChecklistAPI, coaChecklistDetailAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { safeInteger } from "@/utils/numberUtils";

interface ChecklistRecord {
    id: string;
    checklistId: string;
    checklistDescription: string;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

interface ChecklistDetailRecord {
    id: string;
    checklistId: string;
    checklistSno: number;
    checklistParameter: string;
    expectedResult: string;
    expectedValue1?: number;
    expectedValue2?: number;
    expectedText?: string;
    active: boolean;
}

export default function COAChecklistMasterPage() {
    const { toast } = useToast();
    const isSuperAdmin = getSessionUser()?.super_admin === true;

    // Master state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [checklistToDelete, setChecklistToDelete] = useState<ChecklistRecord | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [checklistToCancel, setChecklistToCancel] = useState<ChecklistRecord | null>(null);
    const [cancelledChecklists, setCancelledChecklists] = useState<Set<string>>(new Set());
    const [filterActive, setFilterActive] = useState<string>("true");
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRecord | null>(null);
    const [records, setRecords] = useState<ChecklistRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        checklistId: "",
        checklistDescription: "",
        active: true,
    });

    // Detail state
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [detailRecords, setDetailRecords] = useState<ChecklistDetailRecord[]>([]);
    const [selectedDetailForEdit, setSelectedDetailForEdit] = useState<ChecklistDetailRecord | null>(null);
    const [detailFormData, setDetailFormData] = useState({
        checklistSno: "",
        checklistParameter: "",
        expectedResult: "",
        expectedValue1: "",
        expectedValue2: "",
        expectedText: "",
    });

    // Master helpers
    const toCamelCase = (data: any): ChecklistRecord => ({
        id: data._id || data.checklist_id,
        checklistId: data.checklist_id,
        checklistDescription: data.checklist_description,
        lastModifiedUserId: data.last_modified_user_id || "",
        lastModifiedDateTime: data.last_modified_date_time ? new Date(data.last_modified_date_time).toLocaleString() : "",
        active: data.active !== false,
    });

    const toSnakeCase = (data: any) => ({
        checklist_id: data.checklistId,
        checklist_description: data.checklistDescription,
        active: data.active !== false,
        last_modified_user_id: "ADMIN",
    });

    // Detail helpers
    const detailToCamelCase = (data: any): ChecklistDetailRecord => ({
        id: data._id || `${data.checklist_id}-${data.checklist_sno}`,
        checklistId: data.checklist_id,
        checklistSno: data.checklist_sno,
        checklistParameter: data.checklist_parameter,
        expectedResult: data.expected_result,
        expectedValue1: data.expected_value_1,
        expectedValue2: data.expected_value_2,
        expectedText: data.expected_text,
        active: data.active !== false,
    });

    const detailToSnakeCase = (checklistId: string, data: any) => ({
        checklist_id: checklistId,
        checklist_sno: safeInteger(data.checklistSno) || 1,
        checklist_parameter: data.checklistParameter,
        expected_result: data.expectedResult,
        expected_value_1: data.expectedValue1 !== "" ? Number(data.expectedValue1) : undefined,
        expected_value_2: data.expectedValue2 !== "" ? Number(data.expectedValue2) : undefined,
        expected_text: data.expectedText,
        active: true,
    });

    // Load master records
    const loadRecords = useCallback(async () => {
        try {
            setLoading(true);
            const data = await coaChecklistAPI.getAll();
            setRecords(data.map(toCamelCase));
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load COA checklists", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Load detail records
    const loadDetailRecords = useCallback(async () => {
        try {
            const data = await coaChecklistDetailAPI.getAll();
            if (Array.isArray(data)) {
                setDetailRecords(data.map(detailToCamelCase));
            }
        } catch (error: any) {
            console.error('Failed to load detail records:', error);
        }
    }, []);

    useEffect(() => {
        loadRecords();
        loadDetailRecords();
    }, [loadRecords, loadDetailRecords]);

    // Reset forms when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ checklistId: "", checklistDescription: "", active: true });
            setDetailFormData({ checklistSno: "", checklistParameter: "", expectedResult: "", expectedValue1: "", expectedValue2: "", expectedText: "" });
        }
    }, [isAddModalOpen]);

    const toggleRow = (checklistId: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(checklistId)) next.delete(checklistId);
            else next.add(checklistId);
            return next;
        });
    };

    const filteredRecords = records.filter((item) => {
        const matchesSearch =
            item.checklistDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.checklistId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesActive =
            filterActive === "all" ||
            (filterActive === "true" && item.active === true) ||
            (filterActive === "false" && item.active === false);
        return matchesSearch && matchesActive;
    });

    const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDetailFormData({ ...detailFormData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await coaChecklistAPI.create(toSnakeCase(formData));
            await coaChecklistDetailAPI.create(detailToSnakeCase(formData.checklistId, detailFormData));
            toast({ title: "Success", description: "COA checklist created successfully" });
            setIsAddModalOpen(false);
            setFormData({ checklistId: "", checklistDescription: "", active: true });
            setDetailFormData({ checklistSno: "", checklistParameter: "", expectedResult: "", expectedValue1: "", expectedValue2: "", expectedText: "" });
            loadRecords();
            loadDetailRecords();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create COA checklist", variant: "destructive" });
        }
    };

    const handleEdit = (checklist: ChecklistRecord) => {
        setSelectedChecklist(checklist);
        setFormData({
            checklistId: checklist.checklistId,
            checklistDescription: checklist.checklistDescription,
            active: checklist.active !== undefined ? checklist.active : true,
        });
        const firstDetail = detailRecords.find(d => d.checklistId === checklist.checklistId);
        setSelectedDetailForEdit(firstDetail || null);
        setDetailFormData({
            checklistSno: firstDetail ? String(firstDetail.checklistSno) : "",
            checklistParameter: firstDetail?.checklistParameter || "",
            expectedResult: firstDetail?.expectedResult || "",
            expectedValue1: firstDetail?.expectedValue1 !== undefined ? String(firstDetail.expectedValue1) : "",
            expectedValue2: firstDetail?.expectedValue2 !== undefined ? String(firstDetail.expectedValue2) : "",
            expectedText: firstDetail?.expectedText || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChecklist) return;
        try {
            await coaChecklistAPI.update(selectedChecklist.checklistId, toSnakeCase(formData));
            if (selectedDetailForEdit) {
                await coaChecklistDetailAPI.update(
                    selectedDetailForEdit.checklistId,
                    selectedDetailForEdit.checklistSno,
                    detailToSnakeCase(selectedChecklist.checklistId, detailFormData)
                );
            } else if (detailFormData.checklistParameter) {
                await coaChecklistDetailAPI.create(detailToSnakeCase(selectedChecklist.checklistId, detailFormData));
            }
            toast({ title: "Success", description: "COA checklist updated successfully" });
            setIsEditModalOpen(false);
            setSelectedChecklist(null);
            setSelectedDetailForEdit(null);
            setFormData({ checklistId: "", checklistDescription: "", active: true });
            setDetailFormData({ checklistSno: "", checklistParameter: "", expectedResult: "", expectedValue1: "", expectedValue2: "", expectedText: "" });
            loadRecords();
            loadDetailRecords();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update COA checklist", variant: "destructive" });
        }
    };

    const handleDelete = (checklist: ChecklistRecord) => {
        setChecklistToDelete(checklist);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!checklistToDelete) return;
        try {
            const detailsToDelete = detailRecords.filter(d => d.checklistId === checklistToDelete.checklistId);
            for (const detail of detailsToDelete) {
                await coaChecklistDetailAPI.delete(detail.id);
            }
            await coaChecklistAPI.delete(checklistToDelete.checklistId);
            setRecords(prev => prev.filter(r => r.checklistId !== checklistToDelete.checklistId));
            setDetailRecords(prev => prev.filter(d => d.checklistId !== checklistToDelete.checklistId));
            toast({ title: "Deleted", description: `Checklist ${checklistToDelete.checklistDescription} has been deleted.` });
            setIsDeleteDialogOpen(false);
            setChecklistToDelete(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || 'Failed to delete checklist', variant: "destructive" });
        }
    };

    const handleCancel = (checklist: ChecklistRecord) => {
        setChecklistToCancel(checklist);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!checklistToCancel) return;
        const newActiveStatus = !checklistToCancel.active;
        try {
            await coaChecklistAPI.update(checklistToCancel.checklistId, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            setCancelledChecklists(prev => {
                const newSet = new Set(prev);
                if (newActiveStatus) {
                    newSet.delete(checklistToCancel.checklistId);
                    toast({ title: "Restored", description: `COA checklist ${checklistToCancel.checklistId} has been restored` });
                } else {
                    newSet.add(checklistToCancel.checklistId);
                    toast({ title: "Cancelled", description: `COA checklist ${checklistToCancel.checklistId} has been cancelled` });
                }
                return newSet;
            });
            loadRecords();
            setIsCancelItemDialogOpen(false);
            setChecklistToCancel(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || `Failed to ${checklistToCancel.active ? 'cancel' : 'restore'} COA checklist`, variant: "destructive" });
        }
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">COA Checklist Master</h1>
                                <p className="text-muted-foreground">Manage and configure COA (Certificate of Analysis) checklists</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Checklist
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
                                        placeholder="Search by Checklist ID or Description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredRecords.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredRecords.length)} OF {filteredRecords.length}
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
                                                    {[["all", "All"], ["true", "Active"], ["false", "Inactive"]].map(([val, label]) => (
                                                        <div key={val} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`coa-status-${val}`}
                                                                name="coaStatusFilter"
                                                                checked={filterActive === val}
                                                                onChange={() => setFilterActive(val)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`coa-status-${val}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
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
                                                    {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
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
                            <div className="overflow-auto max-h-[600px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-3 py-3 w-10"></th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>COA</span><span>Checklist ID</span></div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Checklist Description
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>Last Modified</span><span>User ID</span></div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col"><span>Last Modified</span><span>Date &amp; Time</span></div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Active</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading COA checklists...</td>
                                            </tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No COA checklists found</td>
                                            </tr>
                                        ) : (
                                            paginatedRecords.map((item, index) => {
                                                const isExpanded = expandedRows.has(item.checklistId);
                                                const details = detailRecords.filter(d => d.checklistId === item.checklistId);
                                                return (
                                                    <React.Fragment key={item.id}>
                                                        <motion.tr
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                                            className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/40' : ''}`}
                                                        >
                                                            <td className="px-3 py-4 text-center">
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); toggleRow(item.checklistId); }}
                                                                    className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                                                    title="Show Checklist Details"
                                                                >
                                                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-6 align-middle">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                    {item.checklistId}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-6 align-middle">
                                                                <span className="text-sm text-foreground">{item.checklistDescription}</span>
                                                            </td>
                                                            <td className="px-6 py-6 text-center text-sm font-mono text-gray-700 align-middle">
                                                                {item.lastModifiedUserId || "-"}
                                                            </td>
                                                            <td className="px-6 py-6 text-center text-sm text-foreground align-middle">
                                                                {item.lastModifiedDateTime || "-"}
                                                            </td>
                                                            <td className="px-6 py-6 text-left align-middle">
                                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${item.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                                                                    {item.active ? "ACTIVE" : "INACTIVE"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-6 text-center align-middle">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); if (!item.active && !isSuperAdmin) return; handleEdit(item); }}
                                                                        disabled={!item.active && !isSuperAdmin}
                                                                        className={item.active || isSuperAdmin ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-400 cursor-not-allowed"}
                                                                        title={item.active || isSuperAdmin ? "Edit COA checklist" : "Cannot edit inactive checklist"}
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleCancel(item); }}
                                                                        disabled={!item.active && !cancelledChecklists.has(item.checklistId)}
                                                                        className={`${item.active ? cancelledChecklists.has(item.checklistId) ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-gray-400 cursor-not-allowed"}`}
                                                                        title={cancelledChecklists.has(item.checklistId) ? "Restore COA checklist" : "Cancel COA checklist"}
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                    {isSuperAdmin && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                                            className="text-gray-500 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>

                                                        {/* Expanded detail row — view only */}
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={7} className="p-0 border-b border-slate-100">
                                                                    <div className="px-4 py-3 bg-slate-50/60">
                                                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                                                                            <div className="px-3 py-2 border-b border-slate-100 bg-white flex items-center gap-2">
                                                                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                                                                    Checklist Details — {item.checklistId}
                                                                                </span>
                                                                            </div>
                                                                            {details.length === 0 ? (
                                                                                <div className="px-4 py-5 text-sm text-slate-400 italic text-center">No detail records found.</div>
                                                                            ) : (
                                                                                <div className="overflow-auto">
                                                                                    <table className="w-full text-xs">
                                                                                        <thead>
                                                                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                                                                <th className="px-4 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sno</th>
                                                                                                <th className="px-4 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Parameter</th>
                                                                                                <th className="px-4 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Expected Result</th>
                                                                                                <th className="px-4 py-2 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Value 1</th>
                                                                                                <th className="px-4 py-2 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Value 2</th>
                                                                                                <th className="px-4 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Expected Text</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-slate-100">
                                                                                            {details.map((d, i) => (
                                                                                                <tr key={i} className="hover:bg-slate-50">
                                                                                                    <td className="px-4 py-2 font-mono">{d.checklistSno}</td>
                                                                                                    <td className="px-4 py-2">{d.checklistParameter}</td>
                                                                                                    <td className="px-4 py-2">{d.expectedResult}</td>
                                                                                                    <td className="px-4 py-2 text-center">{d.expectedValue1 !== undefined ? d.expectedValue1 : "-"}</td>
                                                                                                    <td className="px-4 py-2 text-center">{d.expectedValue2 !== undefined ? d.expectedValue2 : "-"}</td>
                                                                                                    <td className="px-4 py-2">{d.expectedText || "-"}</td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
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

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">ALL SYSTEMS OPERATIONAL</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Real-time Data Sync • ACUMED Manufacturing Cloud v4.2</p>
                    </motion.div>
                </div>
            </main>

            {/* Add Modal — combined master + detail */}
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
                                    <h2 className="text-2xl font-bold">Add New Checklist</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {/* Master Section */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-blue-100">Checklist Master</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist ID <span className="text-red-500">*</span></label>
                                                <Input name="checklistId" value={formData.checklistId} onChange={handleInputChange} placeholder="e.g., CL01" required maxLength={4} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist Description <span className="text-red-500">*</span></label>
                                                <Input name="checklistDescription" value={formData.checklistDescription} onChange={handleInputChange} placeholder="e.g., DUVET - QC - Checklist" required maxLength={50} />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <input
                                                    type="checkbox"
                                                    id="active_add"
                                                    name="active"
                                                    checked={formData.active}
                                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="active_add" className="text-sm font-semibold text-foreground">Active</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail Section */}
                                    <div className="mb-4">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-blue-100">Checklist Detail</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist Sno <span className="text-red-500">*</span></label>
                                                <Input type="number" name="checklistSno" value={detailFormData.checklistSno} onChange={handleDetailInputChange} placeholder="e.g., 1" min="1" required maxLength={2} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist Parameter <span className="text-red-500">*</span></label>
                                                <Input name="checklistParameter" value={detailFormData.checklistParameter} onChange={handleDetailInputChange} placeholder="e.g., Perforation, Color" required maxLength={50} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Result <span className="text-red-500">*</span></label>
                                                <Input name="expectedResult" value={detailFormData.expectedResult} onChange={handleDetailInputChange} placeholder="e.g., Ok, Pass" required maxLength={25} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Value 1</label>
                                                <Input type="number" step="0.001" name="expectedValue1" value={detailFormData.expectedValue1} onChange={handleDetailInputChange} placeholder="e.g., 1.500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Value 2</label>
                                                <Input type="number" step="0.001" name="expectedValue2" value={detailFormData.expectedValue2} onChange={handleDetailInputChange} placeholder="e.g., 2.500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Text</label>
                                                <Input name="expectedText" value={detailFormData.expectedText} onChange={handleDetailInputChange} placeholder="e.g., NLT 98.0%" maxLength={25} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Modal — combined master + detail */}
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
                                    <h2 className="text-2xl font-bold">Edit Checklist</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {/* Master Section */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-blue-100">Checklist Master</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist ID</label>
                                                <Input name="checklistId" value={formData.checklistId} disabled maxLength={4} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist Description <span className="text-red-500">*</span></label>
                                                <Input name="checklistDescription" value={formData.checklistDescription} onChange={handleInputChange} required maxLength={50} />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <input
                                                    type="checkbox"
                                                    id="active_edit"
                                                    name="active"
                                                    checked={formData.active}
                                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="active_edit" className="text-sm font-semibold text-foreground">Active</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail Section */}
                                    <div className="mb-4">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-blue-100">Checklist Detail</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist Sno <span className="text-red-500">*</span></label>
                                                <Input type="number" name="checklistSno" value={detailFormData.checklistSno} onChange={handleDetailInputChange} disabled maxLength={2} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Checklist Parameter <span className="text-red-500">*</span></label>
                                                <Input name="checklistParameter" value={detailFormData.checklistParameter} onChange={handleDetailInputChange} required maxLength={50} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Result <span className="text-red-500">*</span></label>
                                                <Input name="expectedResult" value={detailFormData.expectedResult} onChange={handleDetailInputChange} required maxLength={25} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Value 1</label>
                                                <Input type="number" step="0.001" name="expectedValue1" value={detailFormData.expectedValue1} onChange={handleDetailInputChange} placeholder="e.g., 1.500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Value 2</label>
                                                <Input type="number" step="0.001" name="expectedValue2" value={detailFormData.expectedValue2} onChange={handleDetailInputChange} placeholder="e.g., 2.500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Expected Text</label>
                                                <Input name="expectedText" value={detailFormData.expectedText} onChange={handleDetailInputChange} placeholder="e.g., NLT 98.0%" maxLength={25} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Dialog */}
            <AnimatePresence>
                {isCancelItemDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsCancelItemDialogOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className={`${cancelledChecklists.has(checklistToCancel?.checklistId || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledChecklists.has(checklistToCancel?.checklistId || '') ? "Restore COA Checklist" : "Cancel COA Checklist"}
                                    </h2>
                                    <button onClick={() => setIsCancelItemDialogOpen(false)} className="text-white hover:opacity-80 rounded-lg p-2 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to {cancelledChecklists.has(checklistToCancel?.checklistId || '') ? 'restore' : 'cancel'} <strong>{checklistToCancel?.checklistDescription}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledChecklists.has(checklistToCancel?.checklistId || '')
                                            ? "This will restore the COA checklist and set its active status to true."
                                            : "This will cancel the COA checklist and set its active status to false."}
                                    </p>
                                    <div className="flex items-center justify-end gap-4">
                                        <Button variant="outline" onClick={() => setIsCancelItemDialogOpen(false)}>Discard</Button>
                                        <Button
                                            onClick={confirmCancelItem}
                                            className={`${cancelledChecklists.has(checklistToCancel?.checklistId || '') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledChecklists.has(checklistToCancel?.checklistId || '') ? "Restore" : "Cancel"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Dialog */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                                <div className="flex items-center justify-between p-6 bg-red-600 rounded-t-xl">
                                    <h2 className="text-xl font-bold text-white">Delete Checklist</h2>
                                    <button onClick={() => setIsDeleteDialogOpen(false)} className="text-white hover:opacity-80 rounded-lg p-2 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-gray-700">
                                        Are you sure you want to permanently delete <span className="font-semibold">{checklistToDelete?.checklistDescription}</span>? This will also delete all associated checklist details. This action cannot be undone.
                                    </p>
                                    <div className="flex items-center justify-end gap-4">
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
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
