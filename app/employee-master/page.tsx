'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { employeeAPI } from "@/services/api";
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

interface EmployeeRecord {
    id: string;
    empId: string;
    empName: string;
    location: string;
    deptId: string;
    gender: string;
    gradeId: string;
    team: string;
    category: string;
    pfNo?: string;
    esiNo?: string;
    doj?: string;
    dol?: string;
    remarks?: string;
    address?: string;
    mobileNo?: string;
    dob?: string;
    age?: number;
    married?: boolean;
    bloodGroup?: string;
    education?: string;
    empPhoto?: string;
    status: string;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

// Helper function to format dates consistently (prevents hydration errors)
function formatDateTime(date: Date | string | undefined): string {
    if (!date) return "-";
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

export default function EmployeeMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [employeeToCancel, setEmployeeToCancel] = useState<EmployeeRecord | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterActive, setFilterActive] = useState<string>("all");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [records, setRecords] = useState<EmployeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: EmployeeRecord } | null>(null);
    const [cancelledEmployees, setCancelledEmployees] = useState<Set<string>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        empId: "",
        empName: "",
        location: "",
        deptId: "",
        gender: "M",
        gradeId: "",
        team: "",
        category: "",
        pfNo: "",
        esiNo: "",
        doj: "",
        dol: "",
        remarks: "",
        address: "",
        mobileNo: "",
        dob: "",
        age: "",
        married: false,
        bloodGroup: "",
        education: "",
        status: "Active",
        active: true,
    });

    // Helper function to convert snake_case to camelCase
    const toCamelCase = (data: any): EmployeeRecord => {
        const formatDate = (date: Date | string | undefined) => {
            if (!date) return "";
            const d = new Date(date);
            if (isNaN(d.getTime())) return "";
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        };

        return {
            id: data._id || data.emp_id,
            empId: data.emp_id,
            empName: data.emp_name,
            location: data.location,
            deptId: data.dept_id,
            gender: data.gender,
            gradeId: data.grade_id,
            team: data.team,
            category: data.category,
            pfNo: data.pf_no || "",
            esiNo: data.esi_no || "",
            doj: formatDate(data.doj),
            dol: formatDate(data.dol),
            remarks: data.remarks || "",
            address: data.address || "",
            mobileNo: data.mobile_no || "",
            dob: formatDate(data.dob),
            age: data.age,
            married: data.married || false,
            bloodGroup: data.blood_group || "",
            education: data.education || "",
            empPhoto: data.emp_photo || "",
            status: data.status,
            lastModifiedUserId: data.last_modified_user_id || "",
            lastModifiedDateTime: data.last_modified_date_time ? formatDateTime(data.last_modified_date_time) : "",
            active: data.active !== false,
        };
    };

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (data: any) => {
        const parseDate = (dateStr: string | undefined) => {
            if (!dateStr || dateStr === '') return undefined;
            if (dateStr.includes('-') && dateStr.length === 10) {
                const [day, month, year] = dateStr.split('-');
                return new Date(`${year}-${month}-${day}`);
            }
            return new Date(dateStr);
        };

        return {
            emp_id: data.empId,
            emp_name: data.empName,
            location: data.location,
            dept_id: data.deptId,
            gender: data.gender,
            grade_id: data.gradeId,
            team: data.team,
            category: data.category,
            pf_no: data.pfNo || "",
            esi_no: data.esiNo || "",
            doj: parseDate(data.doj),
            dol: parseDate(data.dol),
            remarks: data.remarks || "",
            address: data.address || "",
            mobile_no: data.mobileNo || "",
            dob: parseDate(data.dob),
            age: data.age ? Number(data.age) : undefined,
            married: data.married === true || data.married === 'TRUE' || data.married === 'true',
            blood_group: data.bloodGroup || "",
            education: data.education || "",
            emp_photo: data.empPhoto || "",
            status: data.status,
            active: data.active !== false,
        };
    };

    // Load data from API
    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const data = await employeeAPI.getAll();
            setRecords(data.map(toCamelCase));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load employees",
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
                empId: "",
                empName: "",
                location: "",
                deptId: "",
                gender: "M",
                gradeId: "",
                team: "",
                category: "",
                pfNo: "",
                esiNo: "",
                doj: "",
                dol: "",
                remarks: "",
                address: "",
                mobileNo: "",
                dob: "",
                age: "",
                married: false,
                bloodGroup: "",
                education: "",
                status: "Active",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.empId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && item.active === true) ||
            (filterActive === "inactive" && item.active === false);
        const matchesDepartment = filterDepartment === "all" || item.deptId === filterDepartment;
        
        return matchesSearch && matchesStatus && matchesActive && matchesDepartment;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, filterActive, filterDepartment, rowsPerPage]);

    const uniqueDepartments = Array.from(new Set(records.map(r => r.deptId)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = toSnakeCase(formData);
            await employeeAPI.create(dataToSend);
            toast({
                title: "Success",
                description: "Employee created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                empId: "",
                empName: "",
                location: "",
                deptId: "",
                gender: "M",
                gradeId: "",
                team: "",
                category: "",
                pfNo: "",
                esiNo: "",
                doj: "",
                dol: "",
                remarks: "",
                address: "",
                mobileNo: "",
                dob: "",
                age: "",
                married: false,
                bloodGroup: "",
                education: "",
                status: "Active",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create employee",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (employee: EmployeeRecord) => {
        setSelectedEmployee(employee);
        setFormData({
            empId: employee.empId,
            empName: employee.empName,
            location: employee.location,
            deptId: employee.deptId,
            gender: employee.gender,
            gradeId: employee.gradeId,
            team: employee.team,
            category: employee.category,
            pfNo: employee.pfNo || "",
            esiNo: employee.esiNo || "",
            doj: employee.doj || "",
            dol: employee.dol || "",
            remarks: employee.remarks || "",
            address: employee.address || "",
            mobileNo: employee.mobileNo || "",
            dob: employee.dob || "",
            age: employee.age?.toString() || "",
            married: employee.married || false,
            bloodGroup: employee.bloodGroup || "",
            education: employee.education || "",
            status: employee.status,
            active: employee.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        
        // Store previous state for undo
        const previousData = { ...selectedEmployee };
        
        try {
            const dataToSend = toSnakeCase(formData);
            await employeeAPI.update(selectedEmployee.empId, dataToSend);
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Employee updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            setFormData({
                empId: "",
                empName: "",
                location: "",
                deptId: "",
                gender: "M",
                gradeId: "",
                team: "",
                category: "",
                pfNo: "",
                esiNo: "",
                doj: "",
                dol: "",
                remarks: "",
                address: "",
                mobileNo: "",
                dob: "",
                age: "",
                married: false,
                bloodGroup: "",
                education: "",
                status: "Active",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update employee",
                variant: "destructive",
            });
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            if (lastAction.type === 'edit') {
                // Restore previous data
                const dataToSend = toSnakeCase(lastAction.data);
                await employeeAPI.update(lastAction.data.empId, dataToSend);
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
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
            setFormData({
                empId: "",
                empName: "",
                location: "",
                deptId: "",
                gender: "M",
                gradeId: "",
                team: "",
                category: "",
                pfNo: "",
                esiNo: "",
                doj: "",
                dol: "",
                remarks: "",
                address: "",
                mobileNo: "",
                dob: "",
                age: "",
                married: false,
                bloodGroup: "",
                education: "",
                status: "Active",
                active: true,
            });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            setFormData({
                empId: "",
                empName: "",
                location: "",
                deptId: "",
                gender: "M",
                gradeId: "",
                team: "",
                category: "",
                pfNo: "",
                esiNo: "",
                doj: "",
                dol: "",
                remarks: "",
                address: "",
                mobileNo: "",
                dob: "",
                age: "",
                married: false,
                bloodGroup: "",
                education: "",
                status: "Active",
                active: true,
            });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    const handleCancel = (employee: EmployeeRecord) => {
        setEmployeeToCancel(employee);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!employeeToCancel) return;
        
        const isCancelled = cancelledEmployees.has(employeeToCancel.empId);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await employeeAPI.update(employeeToCancel.empId, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledEmployees(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(employeeToCancel.empId);
                    toast({
                        title: "Restored",
                        description: `Employee ${employeeToCancel.empName} has been restored`,
                    });
                } else {
                    newSet.add(employeeToCancel.empId);
                    toast({
                        title: "Cancelled",
                        description: `Employee ${employeeToCancel.empName} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadRecords(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setEmployeeToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} employee`,
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Employee Master</h1>
                                <p className="text-muted-foreground">Directory of personnel, assignments and status management</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Employee
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
                                        placeholder="Search Emp ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors pointer-events-none w-40 justify-between">
                                        <span className="text-sm font-medium">All Departments</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer w-32 justify-between">
                                                <span className="text-sm font-medium">
                                                    {filterStatus === "all" ? "All Status" : filterStatus}
                                                </span>
                                                <Filter className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-4xl p-4" align="start">
                                            <div className="flex flex-wrap gap-6 items-start">
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold text-foreground">Status</Label>
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="emp-status-all" 
                                                                name="empStatus"
                                                                checked={filterStatus === "all"}
                                                                onChange={() => setFilterStatus("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="emp-status-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="emp-status-active" 
                                                                name="empStatus"
                                                                checked={filterStatus === "Active"}
                                                                onChange={() => setFilterStatus("Active")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="emp-status-active" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="emp-status-exited" 
                                                                name="empStatus"
                                                                checked={filterStatus === "Exited"}
                                                                onChange={() => setFilterStatus("Exited")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="emp-status-exited" className="text-sm font-normal cursor-pointer text-foreground">Exited</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold text-foreground">Active</Label>
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="emp-active-all" 
                                                                name="empActiveStatus"
                                                                checked={filterActive === "all"}
                                                                onChange={() => setFilterActive("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="emp-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="emp-active-true" 
                                                                name="empActiveStatus"
                                                                checked={filterActive === "active"}
                                                                onChange={() => setFilterActive("active")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="emp-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="emp-active-false" 
                                                                name="empActiveStatus"
                                                                checked={filterActive === "inactive"}
                                                                onChange={() => setFilterActive("inactive")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="emp-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold text-foreground">Department</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="dept-all" 
                                                                name="departmentFilter"
                                                                checked={filterDepartment === "all"}
                                                                onChange={() => setFilterDepartment("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="dept-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueDepartments.map((dept) => (
                                                            <div key={dept} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`dept-${dept}`} 
                                                                    name="departmentFilter"
                                                                    checked={filterDepartment === dept}
                                                                    onChange={() => setFilterDepartment(dept)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`dept-${dept}`} className="text-sm font-normal cursor-pointer text-foreground">{dept || "N/A"}</Label>
                                                            </div>
                                                        ))}
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
                                            <div className="p-4 border-t border-border bg-muted/30">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="w-full"
                                                    onClick={() => {
                                                        setFilterStatus("all");
                                                        setFilterActive("all");
                                                        setFilterDepartment("all");
                                                    }}
                                                >
                                                    Clear Filter
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {loading ? "LOADING..." : `SHOWING ${startIndex + 1}-${Math.min(endIndex, filteredRecords.length)} OF ${filteredRecords.length} RECORDS`}
                                </span>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <div className="space-y-1">
                                            <div className="w-4 h-0.5 bg-current"></div>
                                            <div className="w-3 h-0.5 bg-current ml-auto"></div>
                                            <div className="w-2 h-0.5 bg-current ml-auto"></div>
                                        </div>
                                    </Button>
                                </div>
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
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">emp id</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">emp name</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">location</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">dept id</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">gender</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">grade id</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Team</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">category</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">PF No.</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">ESI No.</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">DOJ</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">DOL</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">remarks</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Address</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">mobile no</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">DOB</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Age</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Married</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Blood Group</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Education</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">emp photo</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">status</th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>user id</span>
                                                </div>
                                            </th>
                                            <th className="px-3 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>date & time</span>
                                                </div>
                                            </th>
                                            <th className="px-3 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={25} className="px-6 py-8 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={25} className="px-6 py-8 text-center text-muted-foreground">
                                                    No employees found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRecords.map((item, index) => {
                                                const isCancelled = cancelledEmployees.has(item.empId);
                                                return (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-blue-600">
                                                            {item.empId}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.empName}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.location}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.deptId}</span>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.gender}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.gradeId}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.team}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.category}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.pfNo || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.esiNo || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.doj || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.dol || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.remarks || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.address || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.mobileNo || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.dob || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.age || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                            item.married ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"
                                                        }`}>
                                                            {item.married ? "TRUE" : "FALSE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.bloodGroup || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.education || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.empPhoto || "-"}</span>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                            item.status === "Active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        {item.lastModifiedUserId ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-mono text-foreground">{item.lastModifiedUserId}</span>
                                                                <span className="text-xs text-muted-foreground">{item.lastModifiedUserId}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-4 align-middle">
                                                        <span className="text-sm text-foreground">
                                                            {item.lastModifiedDateTime || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(item);
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
                                                                    handleCancel(item);
                                                                }}
                                                                className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={isCancelled ? "Restore employee" : "Cancel employee"}
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
                                    <h2 className="text-2xl font-bold">Add New Employee</h2>
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
                                            Emp ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="empId"
                                            value={formData.empId}
                                            onChange={handleInputChange}
                                            placeholder="e.g., E1001, E1002"
                                            required
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Emp Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="empName"
                                            value={formData.empName}
                                            onChange={handleInputChange}
                                            placeholder="Enter employee name"
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location
                                        </label>
                                        <Input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Corporate, Factory"
                                            maxLength={50}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Dept ID
                                        </label>
                                        <Input
                                            name="deptId"
                                            value={formData.deptId}
                                            onChange={handleInputChange}
                                            placeholder="e.g., MGT, ADM, PR1"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Gender
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="M">M</option>
                                            <option value="F">F</option>
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Grade ID
                                        </label>
                                        <Input
                                            name="gradeId"
                                            value={formData.gradeId}
                                            onChange={handleInputChange}
                                            placeholder="e.g., DIR, MGR, OPR"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Team
                                        </label>
                                        <Input
                                            name="team"
                                            value={formData.team}
                                            onChange={handleInputChange}
                                            placeholder="e.g., EX, T1, T2"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Category
                                        </label>
                                        <Input
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Regular, Contract"
                                            maxLength={20}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Exited">Exited</option>
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={formData.active !== false}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                        >
                                            Save Employee
                                        </Button>
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
                                    <h2 className="text-2xl font-bold">Edit Employee</h2>
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
                                            Emp ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="empId"
                                            value={formData.empId}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Emp Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="empName"
                                            value={formData.empName}
                                            onChange={handleInputChange}
                                            placeholder="Enter employee name"
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location
                                        </label>
                                        <Input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Corporate, Factory"
                                            maxLength={50}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Dept ID
                                        </label>
                                        <Input
                                            name="deptId"
                                            value={formData.deptId}
                                            onChange={handleInputChange}
                                            placeholder="e.g., MGT, ADM, PR1"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Gender
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="M">M</option>
                                            <option value="F">F</option>
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Grade ID
                                        </label>
                                        <Input
                                            name="gradeId"
                                            value={formData.gradeId}
                                            onChange={handleInputChange}
                                            placeholder="e.g., DIR, MGR, OPR"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Team
                                        </label>
                                        <Input
                                            name="team"
                                            value={formData.team}
                                            onChange={handleInputChange}
                                            placeholder="e.g., EX, T1, T2"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Category
                                        </label>
                                        <Input
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Regular, Contract"
                                            maxLength={20}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Exited">Exited</option>
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={formData.active !== false}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                        >
                                            Save Employee
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Modal Dialog */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel? Any unsaved changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelDialogOpen(false)}>No, Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">Yes, Cancel</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Item Dialog */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {employeeToCancel && cancelledEmployees.has(employeeToCancel.empId) 
                                ? "Restore Employee?" 
                                : "Cancel Employee?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {employeeToCancel && cancelledEmployees.has(employeeToCancel.empId)
                                ? `Are you sure you want to restore ${employeeToCancel.empName}?`
                                : `Are you sure you want to cancel ${employeeToCancel?.empName}? This will mark the employee as cancelled.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelItemDialogOpen(false)}>No</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-blue-600 hover:bg-blue-700">Yes</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}



