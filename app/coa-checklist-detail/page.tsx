'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, X, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { coaChecklistDetailAPI, coaChecklistAPI } from "@/services/api";

interface ChecklistDetailRecord {
    id: string;
    checklistId: string;
    checklistSno: number;
    checklistParameter: string;
    expectedResult: string;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

export default function COAChecklistDetailPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [detailToCancel, setDetailToCancel] = useState<ChecklistDetailRecord | null>(null);
    const [cancelledDetails, setCancelledDetails] = useState<Set<string>>(new Set());
    const [selectedDetail, setSelectedDetail] = useState<ChecklistDetailRecord | null>(null);
    const [filterChecklistId, setFilterChecklistId] = useState<string>("all");
    const [records, setRecords] = useState<ChecklistDetailRecord[]>([]);
    const [checklists, setChecklists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        checklistId: "",
        checklistSno: "",
        checklistParameter: "",
        expectedResult: "",
    });

    // Helper function to convert snake_case to camelCase
    const toCamelCase = (data: any): ChecklistDetailRecord => {
        return {
            id: data._id || `${data.checklist_id}-${data.checklist_sno}`,
            checklistId: data.checklist_id,
            checklistSno: data.checklist_sno,
            checklistParameter: data.checklist_parameter,
            expectedResult: data.expected_result,
            lastModifiedUserId: data.last_modified_user_id || "",
            lastModifiedDateTime: data.last_modified_date_time ? new Date(data.last_modified_date_time).toLocaleString() : "",
            active: data.active !== false,
        };
    };

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (data: any) => {
        return {
            checklist_id: data.checklistId,
            checklist_sno: Number(data.checklistSno),
            checklist_parameter: data.checklistParameter,
            expected_result: data.expectedResult,
            active: data.active !== false,
        };
    };

    // Load data from API
    useEffect(() => {
        loadChecklists();
        loadRecords();
    }, []);

    const loadChecklists = async () => {
        try {
            const data = await coaChecklistAPI.getAll();
            setChecklists(data);
        } catch (error: any) {
            console.error('Failed to load checklists:', error);
        }
    };

    const loadRecords = async () => {
        try {
            setLoading(true);
            const data = await coaChecklistDetailAPI.getAll();
            setRecords(data.map(toCamelCase));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load COA checklist details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                checklistId: filterChecklistId !== "all" ? filterChecklistId : "",
                checklistSno: "",
                checklistParameter: "",
                expectedResult: "",
            });
        }
    }, [isAddModalOpen, filterChecklistId]);

    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.checklistParameter.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.checklistId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesChecklist = filterChecklistId === "all" || item.checklistId === filterChecklistId;
        
        return matchesSearch && matchesChecklist;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = toSnakeCase(formData);
            await coaChecklistDetailAPI.create(dataToSend);
            toast({
                title: "Success",
                description: "COA checklist detail created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                checklistId: "",
                checklistSno: "",
                checklistParameter: "",
                expectedResult: "",
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create COA checklist detail",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (detail: ChecklistDetailRecord) => {
        setSelectedDetail(detail);
        setFormData({
            checklistId: detail.checklistId,
            checklistSno: detail.checklistSno.toString(),
            checklistParameter: detail.checklistParameter,
            expectedResult: detail.expectedResult,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDetail) return;
        try {
            const dataToSend = toSnakeCase(formData);
            await coaChecklistDetailAPI.update(selectedDetail.checklistId, selectedDetail.checklistSno, dataToSend);
            toast({
                title: "Success",
                description: "COA checklist detail updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedDetail(null);
            setFormData({
                checklistId: "",
                checklistSno: "",
                checklistParameter: "",
                expectedResult: "",
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update COA checklist detail",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (detail: ChecklistDetailRecord) => {
        setDetailToCancel(detail);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!detailToCancel) return;
        
        // Use composite key for tracking cancelled items
        const detailKey = `${detailToCancel.checklistId}-${detailToCancel.checklistSno}`;
        const isCancelled = cancelledDetails.has(detailKey);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await coaChecklistDetailAPI.update(detailToCancel.checklistId, detailToCancel.checklistSno, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledDetails(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(detailKey);
                    toast({
                        title: "Restored",
                        description: `COA checklist detail ${detailToCancel.checklistId}-${detailToCancel.checklistSno} has been restored`,
                    });
                } else {
                    newSet.add(detailKey);
                    toast({
                        title: "Cancelled",
                        description: `COA checklist detail ${detailToCancel.checklistId}-${detailToCancel.checklistSno} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadRecords(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setDetailToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} COA checklist detail`,
                variant: "destructive",
            });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">COA Checklist Detail</h1>
                                <p className="text-muted-foreground">Manage and configure COA checklist parameters and expected results</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Parameter
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6"
                    >
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Parameter or Checklist ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer w-40 justify-between">
                                            <span className="text-sm font-medium">
                                                {filterChecklistId === "all" ? "All Checklists" : filterChecklistId}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56" align="start">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Checklist ID</Label>
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="checklist-all" 
                                                            name="checklistFilter"
                                                            checked={filterChecklistId === "all"}
                                                            onChange={() => setFilterChecklistId("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="checklist-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {checklists.map((checklist) => (
                                                        <div key={checklist.checklist_id} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`checklist-${checklist.checklist_id}`}
                                                                name="checklistFilter"
                                                                checked={filterChecklistId === checklist.checklist_id}
                                                                onChange={() => setFilterChecklistId(checklist.checklist_id)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`checklist-${checklist.checklist_id}`} className="text-sm font-normal cursor-pointer">
                                                                {checklist.checklist_id}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => setFilterChecklistId("all")}
                                            >
                                                Clear Filter
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {loading ? "LOADING..." : `SHOWING 1-${filteredRecords.length} OF ${records.length} RECORDS`}
                                </span>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>COA</span>
                                                    <span>checklist_id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">checklist Sno</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">checklist parameter</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">expected result</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                    No checklist details found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRecords.map((item, index) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-6 align-middle">
                                                        <span className="text-sm font-semibold text-blue-600">
                                                            {item.checklistId}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 text-center align-middle">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {item.checklistSno}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.checklistParameter}</span>
                                                    </td>
                                                    <td className="px-6 py-6 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.expectedResult}</span>
                                                    </td>
                                                    <td className="px-6 py-6 text-center align-middle">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(item);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(item);
                                                                }}
                                                                className={`${cancelledDetails.has(`${item.checklistId}-${item.checklistSno}`) ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={cancelledDetails.has(`${item.checklistId}-${item.checklistSno}`) ? "Restore COA checklist detail" : "Cancel COA checklist detail"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time Data Sync • ACUMED Manufacturing Cloud v4.2
                        </p>
                    </motion.div>
                </div>
            </main>

            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsAddModalOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Parameter</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Checklist ID <span className="text-red-500">*</span></label>
                                        <select
                                            name="checklistId"
                                            value={formData.checklistId}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            required
                                        >
                                            <option value="">Select Checklist ID</option>
                                            {checklists.map((checklist) => (
                                                <option key={checklist.checklist_id} value={checklist.checklist_id}>
                                                    {checklist.checklist_id} - {checklist.checklist_description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Checklist Sno <span className="text-red-500">*</span></label>
                                        <Input type="number" name="checklistSno" value={formData.checklistSno} onChange={handleInputChange} placeholder="e.g., 1, 2, 3" min="1" required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Checklist Parameter <span className="text-red-500">*</span></label>
                                        <Input name="checklistParameter" value={formData.checklistParameter} onChange={handleInputChange} placeholder="e.g., Perforation, Color, Weight" required />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Expected Result <span className="text-red-500">*</span></label>
                                        <Input name="expectedResult" value={formData.expectedResult} onChange={handleInputChange} placeholder="e.g., Ok, Pass" required />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsEditModalOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Parameter</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Checklist ID <span className="text-red-500">*</span></label>
                                        <Input name="checklistId" value={formData.checklistId} onChange={handleInputChange} disabled />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Checklist Sno <span className="text-red-500">*</span></label>
                                        <Input type="number" name="checklistSno" value={formData.checklistSno} onChange={handleInputChange} disabled />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Checklist Parameter <span className="text-red-500">*</span></label>
                                        <Input name="checklistParameter" value={formData.checklistParameter} onChange={handleInputChange} required />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Expected Result <span className="text-red-500">*</span></label>
                                        <Input name="expectedResult" value={formData.expectedResult} onChange={handleInputChange} required />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCancelItemDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                                <div className={`${cancelledDetails.has(`${detailToCancel?.checklistId || ''}-${detailToCancel?.checklistSno || ''}`) ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledDetails.has(`${detailToCancel?.checklistId || ''}-${detailToCancel?.checklistSno || ''}`) ? "Restore COA Checklist Detail" : "Cancel COA Checklist Detail"}
                                    </h2>
                                    <button
                                        onClick={() => setIsCancelItemDialogOpen(false)}
                                        className="text-white hover:opacity-80 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to {cancelledDetails.has(`${detailToCancel?.checklistId || ''}-${detailToCancel?.checklistSno || ''}`) ? 'restore' : 'cancel'} parameter <strong>{detailToCancel?.checklistParameter}</strong> from checklist <strong>{detailToCancel?.checklistId}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledDetails.has(`${detailToCancel?.checklistId || ''}-${detailToCancel?.checklistSno || ''}`) 
                                            ? "This will restore the COA checklist detail and set its active status to true."
                                            : "This will cancel the COA checklist detail and set its active status to false."}
                                    </p>

                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsCancelItemDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmCancelItem}
                                            className={`${cancelledDetails.has(`${detailToCancel?.checklistId || ''}-${detailToCancel?.checklistSno || ''}`) ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledDetails.has(`${detailToCancel?.checklistId || ''}-${detailToCancel?.checklistSno || ''}`) ? "Restore" : "Cancel"}
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

