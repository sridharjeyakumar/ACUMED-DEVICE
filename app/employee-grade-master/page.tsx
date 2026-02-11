'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Award } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { employeeGradeAPI } from "@/services/api";
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

interface EmployeeGrade {
    grade_id: string; // Char(3) - PK
    grade_name: string; // Char(25)
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date; // Date
}

// Helper function to format dates consistently (prevents hydration errors)
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

export default function EmployeeGradeMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [gradeToCancel, setGradeToCancel] = useState<EmployeeGrade | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<EmployeeGrade | null>(null);
    const isSubmittingRef = useRef(false);
    const [grades, setGrades] = useState<EmployeeGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: EmployeeGrade } | null>(null);
    const [cancelledGrades, setCancelledGrades] = useState<Set<string>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        loadGrades();
    }, []);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ grade_id: "", grade_name: "" });
        }
    }, [isAddModalOpen]);

    const loadGrades = async () => {
        try {
            setLoading(true);
            const data = await employeeGradeAPI.getAll();
            setGrades(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load employee grades",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    const [formData, setFormData] = useState({
        grade_id: "",
        grade_name: "",
    });

    const filteredGrades = grades.filter((grade) =>
        grade.grade_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grade.grade_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredGrades.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedGrades = filteredGrades.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, rowsPerPage]);

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
            await employeeGradeAPI.create({
                grade_id: formData.grade_id,
                grade_name: formData.grade_name,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Employee grade created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                grade_id: "",
                grade_name: "",
            });
            loadGrades();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create employee grade",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (grade: EmployeeGrade) => {
        setSelectedGrade(grade);
        setFormData({
            grade_id: grade.grade_id,
            grade_name: grade.grade_name,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedGrade) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedGrade };
        
        try {
            await employeeGradeAPI.update(selectedGrade.grade_id, {
                grade_name: formData.grade_name,
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Employee grade updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedGrade(null);
            setFormData({
                grade_id: "",
                grade_name: "",
            });
            loadGrades();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update employee grade",
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
                // Restore previous data
                await employeeGradeAPI.update(lastAction.data.grade_id, {
                    grade_name: lastAction.data.grade_name,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            } else if (lastAction.type === 'delete') {
                // Restore deleted grade
                await employeeGradeAPI.create({
                    grade_id: lastAction.data.grade_id,
                    grade_name: lastAction.data.grade_name,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Employee grade has been restored",
                });
            }
            setLastAction(null);
            loadGrades();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (grade: EmployeeGrade) => {
        setGradeToCancel(grade);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!gradeToCancel) return;
        
        const isCancelled = cancelledGrades.has(gradeToCancel.grade_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await employeeGradeAPI.update(gradeToCancel.grade_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledGrades(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(gradeToCancel.grade_id);
                    toast({
                        title: "Restored",
                        description: `Employee grade ${gradeToCancel.grade_name} has been restored`,
                    });
                } else {
                    newSet.add(gradeToCancel.grade_id);
                    toast({
                        title: "Cancelled",
                        description: `Employee grade ${gradeToCancel.grade_name} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadGrades(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setGradeToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} employee grade`,
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
            setFormData({ grade_id: "", grade_name: "" });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedGrade(null);
            setFormData({ grade_id: "", grade_name: "" });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto ml-64">
                <div className="p-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Employee Grade Master</h1>
                                <p className="text-muted-foreground">Manage employee grade information and details</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Grade
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-4"
                    >
                        <Card className="p-3">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search grades..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredGrades.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredGrades.length)} OF {filteredGrades.length}
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">grade_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">grade name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>user id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>date & time</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">active</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading employee grades...
                                                </td>
                                            </tr>
                                        ) : filteredGrades.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No grades found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedGrades.map((grade, index) => {
                                                const isCancelled = cancelledGrades.has(grade.grade_id);
                                                return (
                                                <motion.tr
                                                    key={grade.grade_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                            {grade.grade_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{grade.grade_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {grade.last_modified_user_id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-mono text-foreground">{grade.last_modified_user_id}</span>
                                                                <span className="text-xs text-muted-foreground">{grade.last_modified_user_id}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {grade.last_modified_date_time 
                                                                ? formatDateTime(grade.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            !isCancelled ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {!isCancelled ? "TRUE" : "FALSE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(grade);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                disabled={isCancelled}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(grade);
                                                                }}
                                                                className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={isCancelled ? "Restore grade" : "Cancel grade"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                                );
                                            })
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

            {/* Add Grade Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Employee Grade</h2>
                                    <button
                                        onClick={() => handleCancelClick('add')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Grade ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="grade_id"
                                            value={formData.grade_id}
                                            onChange={handleInputChange}
                                            placeholder="e.g., DIR, MGR, SUP"
                                            required
                                            maxLength={3}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Grade Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="grade_name"
                                            value={formData.grade_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter grade name (e.g., Director, Manager)"
                                            required
                                            maxLength={25}
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Save Grade
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Grade Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Employee Grade</h2>
                                    <button
                                        onClick={() => handleCancelClick('edit')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Grade ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="grade_id"
                                            value={formData.grade_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Grade Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="grade_name"
                                            value={formData.grade_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter grade name (e.g., Director, Manager)"
                                            required
                                            maxLength={25}
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Update Grade
                                        </Button>
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

            {/* Cancel Item Confirmation Dialog (for table actions) */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {gradeToCancel && cancelledGrades.has(gradeToCancel.grade_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {gradeToCancel && cancelledGrades.has(gradeToCancel.grade_id)
                                ? `Are you sure you want to restore employee grade "${gradeToCancel.grade_name}"?`
                                : `Are you sure you want to cancel employee grade "${gradeToCancel?.grade_name}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setGradeToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={gradeToCancel && cancelledGrades.has(gradeToCancel.grade_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {gradeToCancel && cancelledGrades.has(gradeToCancel.grade_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

