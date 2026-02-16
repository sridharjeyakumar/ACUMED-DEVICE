'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Building2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { departmentAPI } from "@/services/api";
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

interface Department {
    dept_id: string; // Char(3) - PK
    department_name: string; // Char(25)
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

export default function DepartmentMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [departmentToCancel, setDepartmentToCancel] = useState<Department | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const isSubmittingRef = useRef(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: Department } | null>(null);
    const [cancelledDepartments, setCancelledDepartments] = useState<Set<string>>(new Set());
    const [filterActive, setFilterActive] = useState<string>("all");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ dept_id: "", department_name: "" });
        }
    }, [isAddModalOpen]);

    const loadDepartments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await departmentAPI.getAll();
            setDepartments(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load departments",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);
    const [formData, setFormData] = useState({
        dept_id: "",
        department_name: "",
    });

    const filteredDepartments = departments.filter((dept) => {
        const matchesSearch = dept.dept_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dept.department_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && !cancelledDepartments.has(dept.dept_id)) ||
            (filterActive === "inactive" && cancelledDepartments.has(dept.dept_id));
        
        return matchesSearch && matchesActive;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredDepartments.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
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
            await departmentAPI.create({
                dept_id: formData.dept_id,
                department_name: formData.department_name,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Department created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                dept_id: "",
                department_name: "",
            });
            loadDepartments();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create department",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (department: Department) => {
        setSelectedDepartment(department);
        setFormData({
            dept_id: department.dept_id,
            department_name: department.department_name,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedDepartment) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedDepartment };
        
        try {
            await departmentAPI.update(selectedDepartment.dept_id, {
                department_name: formData.department_name,
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Department updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
            setFormData({
                dept_id: "",
                department_name: "",
            });
            loadDepartments();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update department",
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
                await departmentAPI.update(lastAction.data.dept_id, {
                    department_name: lastAction.data.department_name,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            } else if (lastAction.type === 'delete') {
                // Restore deleted department
                await departmentAPI.create({
                    dept_id: lastAction.data.dept_id,
                    department_name: lastAction.data.department_name,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Department has been restored",
                });
            }
            setLastAction(null);
            loadDepartments();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (department: Department) => {
        setDepartmentToCancel(department);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!departmentToCancel) return;
        
        const isCancelled = cancelledDepartments.has(departmentToCancel.dept_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await departmentAPI.update(departmentToCancel.dept_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledDepartments(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(departmentToCancel.dept_id);
                    toast({
                        title: "Restored",
                        description: `Department ${departmentToCancel.department_name} has been restored`,
                    });
                } else {
                    newSet.add(departmentToCancel.dept_id);
                    toast({
                        title: "Cancelled",
                        description: `Department ${departmentToCancel.department_name} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadDepartments(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setDepartmentToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} department`,
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
            setFormData({ dept_id: "", department_name: "" });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
            setFormData({ dept_id: "", department_name: "" });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Department Master</h1>
                                <p className="text-muted-foreground">Manage department information and details</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Department
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
                                        placeholder="Search by Department ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredDepartments.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredDepartments.length)} OF {filteredDepartments.length}
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
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="dept-status-all" 
                                                            name="deptStatusFilter"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="dept-status-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="dept-status-active" 
                                                            name="deptStatusFilter"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="dept-status-active" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="dept-status-inactive" 
                                                            name="deptStatusFilter"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="dept-status-inactive" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
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
                                                onClick={() => {
                                                    setFilterActive("all");
                                                }}
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Dept Id</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Department Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>User Id</span>
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>Date & Time</span>
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Active</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">
                                                    Loading departments...
                                                </td>
                                            </tr>
                                        ) : filteredDepartments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-3 text-center text-muted-foreground">
                                                    No departments found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedDepartments.map((department, index) => {
                                                const isCancelled = cancelledDepartments.has(department.dept_id);
                                                return (
                                                <motion.tr
                                                    key={department.dept_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-muted-foreground font-mono">{department.dept_id}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-foreground">{department.department_name}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {department.last_modified_user_id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-mono text-foreground">{department.last_modified_user_id}</span>
                                                                <span className="text-xs text-muted-foreground">{department.last_modified_user_id}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-foreground">
                                                            {department.last_modified_date_time 
                                                                ? formatDateTime(department.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            !isCancelled ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {!isCancelled ? "TRUE" : "FALSE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(department);
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
                                                                handleCancel(department);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore department" : "Cancel department"}
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

                            <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/20">
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

            {/* Add Department Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Department</h2>
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
                                            Department ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="dept_id"
                                            value={formData.dept_id}
                                            onChange={handleInputChange}
                                            placeholder="e.g., MGT, ADM, PRD"
                                            required
                                            maxLength={3}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Department Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="department_name"
                                            value={formData.department_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter department name"
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
                                            Save Department
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Department Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Department</h2>
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
                                            Department ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="dept_id"
                                            value={formData.dept_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Department Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="department_name"
                                            value={formData.department_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter department name"
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
                                            Update Department
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
                            {departmentToCancel && cancelledDepartments.has(departmentToCancel.dept_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {departmentToCancel && cancelledDepartments.has(departmentToCancel.dept_id)
                                ? `Are you sure you want to restore department "${departmentToCancel.department_name}"?`
                                : `Are you sure you want to cancel department "${departmentToCancel?.department_name}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setDepartmentToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={departmentToCancel && cancelledDepartments.has(departmentToCancel.dept_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {departmentToCancel && cancelledDepartments.has(departmentToCancel.dept_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

