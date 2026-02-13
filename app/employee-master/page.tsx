'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, ChevronDown, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { employeeAPI } from "@/services/api";

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
    pfNo: string;
    esiNo: string;
    doj: string;
    dol: string;
    remarks: string;
    address: string;
    mobileNo: string;
    dob: string;
    age: string;
    married: string;
    bloodGroup: string;
    education: string;
    empPhoto: string;
    status: "Active" | "Exited";
}

export default function EmployeeMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<EmployeeRecord[]>([]);
    const [formData, setFormData] = useState({
        emp_id: "",
        emp_name: "",
        location: "",
        dept_id: "",
        gender: "M",
        grade_id: "",
        team: "",
        category: "",
        pf_no: "",
        esi_no: "",
        doj: "",
        dol: "",
        remarks: "",
        address: "",
        mobile_no: "",
        dob: "",
        age: "",
        married: false,
        blood_group: "",
        education: "",
        emp_photo: "",
        status: "Active",
        active: true,
    });

    const loadEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const employeesData = await employeeAPI.getAll();
            // Map API response (emp_id) to EmployeeRecord interface (empId)
            const mappedRecords: EmployeeRecord[] = employeesData.map((emp: any, index: number) => ({
                id: String(index + 1),
                empId: emp.emp_id || "",
                empName: emp.emp_name || "",
                location: emp.location || "",
                deptId: emp.dept_id || "",
                gender: emp.gender || "M",
                gradeId: emp.grade_id || "",
                team: emp.team || "",
                category: emp.category || "",
                pfNo: emp.pf_no || "",
                esiNo: emp.esi_no || "",
                doj: emp.doj ? (emp.doj instanceof Date ? emp.doj.toLocaleDateString('en-GB') : new Date(emp.doj).toLocaleDateString('en-GB')) : "",
                dol: emp.dol ? (emp.dol instanceof Date ? emp.dol.toLocaleDateString('en-GB') : new Date(emp.dol).toLocaleDateString('en-GB')) : "",
                remarks: emp.remarks || "",
                address: emp.address || "",
                mobileNo: emp.mobile_no || "",
                dob: emp.dob ? (emp.dob instanceof Date ? emp.dob.toLocaleDateString('en-GB') : new Date(emp.dob).toLocaleDateString('en-GB')) : "",
                age: emp.age?.toString() || "",
                married: emp.married ? "TRUE" : "FALSE",
                bloodGroup: emp.blood_group || "",
                education: emp.education || "",
                empPhoto: emp.emp_photo || "",
                status: emp.active !== false ? "Active" : "Exited",
            }));
            setRecords(mappedRecords);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load employees",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Load employees from API
    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.empId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        const matchesDepartment = filterDepartment === "all" || item.deptId === filterDepartment;
        
        return matchesSearch && matchesStatus && matchesDepartment;
    });

    const uniqueDepartments = Array.from(new Set(records.map(r => r.deptId)));

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                emp_id: "",
                emp_name: "",
                location: "",
                dept_id: "",
                gender: "M",
                grade_id: "",
                team: "",
                category: "",
                pf_no: "",
                esi_no: "",
                doj: "",
                dol: "",
                remarks: "",
                address: "",
                mobile_no: "",
                dob: "",
                age: "",
                married: false,
                blood_group: "",
                education: "",
                emp_photo: "",
                status: "Active",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Format data for API
            const formattedData: any = {
                emp_id: formData.emp_id,
                emp_name: formData.emp_name,
                location: formData.location || undefined,
                dept_id: formData.dept_id || undefined,
                gender: formData.gender,
                grade_id: formData.grade_id || undefined,
                team: formData.team || undefined,
                category: formData.category || undefined,
                pf_no: formData.pf_no || undefined,
                esi_no: formData.esi_no || undefined,
                doj: formData.doj || undefined,
                dol: formData.dol || undefined,
                remarks: formData.remarks || undefined,
                address: formData.address || undefined,
                mobile_no: formData.mobile_no || undefined,
                dob: formData.dob || undefined,
                age: formData.age ? Number(formData.age) : undefined,
                married: Boolean(formData.married),
                blood_group: formData.blood_group || undefined,
                education: formData.education || undefined,
                emp_photo: formData.emp_photo || undefined,
                status: formData.status,
                active: Boolean(formData.active),
                last_modified_user_id: "ADMIN",
            };

            await employeeAPI.create(formattedData);
            toast({
                title: "Success",
                description: "Employee created successfully",
            });
            setIsAddModalOpen(false);
            loadEmployees();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create employee",
                variant: "destructive",
            });
        }
    };

    const handleEdit = async (employee: EmployeeRecord) => {
        try {
            setLoading(true);
            const empData = await employeeAPI.getById(employee.empId);
            setSelectedEmployee(employee);
            setFormData({
                emp_id: empData.emp_id || "",
                emp_name: empData.emp_name || "",
                location: empData.location || "",
                dept_id: empData.dept_id || "",
                gender: empData.gender || "M",
                grade_id: empData.grade_id || "",
                team: empData.team || "",
                category: empData.category || "",
                pf_no: empData.pf_no || "",
                esi_no: empData.esi_no || "",
                doj: empData.doj ? new Date(empData.doj).toISOString().split('T')[0] : "",
                dol: empData.dol ? new Date(empData.dol).toISOString().split('T')[0] : "",
                remarks: empData.remarks || "",
                address: empData.address || "",
                mobile_no: empData.mobile_no || "",
                dob: empData.dob ? new Date(empData.dob).toISOString().split('T')[0] : "",
                age: empData.age?.toString() || "",
                married: empData.married || false,
                blood_group: empData.blood_group || "",
                education: empData.education || "",
                emp_photo: empData.emp_photo || "",
                status: empData.status || "Active",
                active: empData.active !== undefined ? empData.active : true,
            });
            setIsEditModalOpen(true);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load employee data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        try {
            // Format data for API
            const formattedData: any = {
                emp_name: formData.emp_name,
                location: formData.location || undefined,
                dept_id: formData.dept_id || undefined,
                gender: formData.gender,
                grade_id: formData.grade_id || undefined,
                team: formData.team || undefined,
                category: formData.category || undefined,
                pf_no: formData.pf_no || undefined,
                esi_no: formData.esi_no || undefined,
                doj: formData.doj || undefined,
                dol: formData.dol || undefined,
                remarks: formData.remarks || undefined,
                address: formData.address || undefined,
                mobile_no: formData.mobile_no || undefined,
                dob: formData.dob || undefined,
                age: formData.age ? Number(formData.age) : undefined,
                married: Boolean(formData.married),
                blood_group: formData.blood_group || undefined,
                education: formData.education || undefined,
                emp_photo: formData.emp_photo || undefined,
                status: formData.status,
                active: Boolean(formData.active),
                last_modified_user_id: "ADMIN",
            };

            await employeeAPI.update(selectedEmployee.empId, formattedData);
            toast({
                title: "Success",
                description: "Employee updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            loadEmployees();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update employee",
                variant: "destructive",
            });
        }
    };

    const handleDelete = (employee: EmployeeRecord) => {
        setSelectedEmployee(employee);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        console.log("Deleting employee:", selectedEmployee);
        setIsDeleteDialogOpen(false);
        setSelectedEmployee(null);
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
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search by Emp ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredRecords.length > 0 ? 1 : 0}-{filteredRecords.length} OF {filteredRecords.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                        <div className="flex flex-wrap gap-6 items-start">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Label className="text-sm font-semibold">Status</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="emp-status-all" 
                                                            name="empStatus"
                                                            checked={filterStatus === "all"}
                                                            onChange={() => setFilterStatus("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="emp-status-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="emp-status-active" 
                                                            name="empStatus"
                                                            checked={filterStatus === "Active"}
                                                            onChange={() => setFilterStatus("Active")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="emp-status-active" className="text-sm font-normal cursor-pointer">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="emp-status-resigned" 
                                                            name="empStatus"
                                                            checked={filterStatus === "Resigned"}
                                                            onChange={() => setFilterStatus("Resigned")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="emp-status-resigned" className="text-sm font-normal cursor-pointer">Resigned</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Label className="text-sm font-semibold">Department</Label>
                                                <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="dept-all" 
                                                            name="departmentFilter"
                                                            checked={filterDepartment === "all"}
                                                            onChange={() => setFilterDepartment("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="dept-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {uniqueDepartments.map((dept) => (
                                                        <div key={dept} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`dept-${dept}`} 
                                                                name="departmentFilter"
                                                                checked={filterDepartment === dept}
                                                                onChange={() => setFilterDepartment(dept)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`dept-${dept}`} className="text-sm font-normal cursor-pointer">{dept}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => {
                                                    setFilterStatus("all");
                                                    setFilterDepartment("all");
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Emp Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Emp Name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Location</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Dept Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Gender</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Grade Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Team</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Category</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">PF No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">ESI No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">DOJ</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">DOL</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Address</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Mobile No</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">DOB</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Age</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Married</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Blood Group</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Education</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Emp Photo</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredRecords.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {item.empId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.empName}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.location}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.deptId}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.gender}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.gradeId}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.team}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.category}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.pfNo || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.esiNo || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{item.doj || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{item.dol || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.remarks || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.address || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{item.mobileNo || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{item.dob || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.age}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.married}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.bloodGroup || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.education || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.empPhoto || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
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
                                                                handleDelete(item);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 25</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-muted-foreground">Previous</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 bg-blue-50">Next</Button>
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
                                    <h2 className="text-2xl font-bold">Add New Employee</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Personal Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Personal Information
                                            </h3>
                                        </div>

                                        {/* Emp ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Emp ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="emp_id" 
                                                value={formData.emp_id} 
                                                onChange={handleInputChange} 
                                                placeholder="E1001" 
                                                required 
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Employee Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Employee Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="emp_name" 
                                                value={formData.emp_name} 
                                                onChange={handleInputChange} 
                                                required 
                                                maxLength={200}
                                            />
                                        </div>

                                        {/* Gender */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                required
                                            >
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                            </select>
                                        </div>

                                        {/* Date of Birth */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Date of Birth
                                            </label>
                                            <Input 
                                                type="date" 
                                                name="dob" 
                                                value={formData.dob} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>

                                        {/* Age */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Age
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="age" 
                                                value={formData.age} 
                                                onChange={handleInputChange} 
                                                min="0"
                                                max="150"
                                            />
                                        </div>

                                        {/* Blood Group */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Blood Group
                                            </label>
                                            <Input 
                                                name="blood_group" 
                                                value={formData.blood_group} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. O+"
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Married */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="married_add"
                                                name="married"
                                                checked={formData.married}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="married_add" className="text-sm font-semibold text-foreground">
                                                Married
                                            </label>
                                        </div>

                                        {/* Education */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Education
                                            </label>
                                            <Input 
                                                name="education" 
                                                value={formData.education} 
                                                onChange={handleInputChange} 
                                                maxLength={200}
                                            />
                                        </div>

                                        {/* Employee Photo */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Employee Photo URL
                                            </label>
                                            <Input 
                                                name="emp_photo" 
                                                value={formData.emp_photo} 
                                                onChange={handleInputChange} 
                                                placeholder="URL or path"
                                            />
                                        </div>

                                        {/* Employment Details Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Employment Details
                                            </h3>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Location <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="location" 
                                                value={formData.location} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Corporate, Factory"
                                                required
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* Department ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Department ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="dept_id" 
                                                value={formData.dept_id} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. MGT, ADM, PR1"
                                                required
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Grade ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Grade ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="grade_id" 
                                                value={formData.grade_id} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. DIR, MGR, OPR"
                                                required
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Team */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Team <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="team" 
                                                value={formData.team} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. EX, T2, T1"
                                                required
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="category" 
                                                value={formData.category} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Regular, Contract"
                                                required
                                                maxLength={20}
                                            />
                                        </div>

                                        {/* Date of Joining */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Date of Joining
                                            </label>
                                            <Input 
                                                type="date" 
                                                name="doj" 
                                                value={formData.doj} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>

                                        {/* Date of Leaving */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Date of Leaving
                                            </label>
                                            <Input 
                                                type="date" 
                                                name="dol" 
                                                value={formData.dol} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                required
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Exited">Exited</option>
                                                <option value="Resigned">Resigned</option>
                                            </select>
                                        </div>

                                        {/* Contact Information Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Contact Information
                                            </h3>
                                        </div>

                                        {/* Address */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                maxLength={500}
                                            />
                                        </div>

                                        {/* Mobile No */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Mobile No
                                            </label>
                                            <Input 
                                                name="mobile_no" 
                                                value={formData.mobile_no} 
                                                onChange={handleInputChange} 
                                                placeholder="+91 XXXXX XXXXX"
                                                maxLength={15}
                                            />
                                        </div>

                                        {/* Additional Information Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Additional Information
                                            </h3>
                                        </div>

                                        {/* PF No */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                PF No.
                                            </label>
                                            <Input 
                                                name="pf_no" 
                                                value={formData.pf_no} 
                                                onChange={handleInputChange} 
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* ESI No */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                ESI No.
                                            </label>
                                            <Input 
                                                name="esi_no" 
                                                value={formData.esi_no} 
                                                onChange={handleInputChange} 
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* Remarks */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <textarea
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                maxLength={500}
                                            />
                                        </div>

                                        {/* Status Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Status
                                            </h3>
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_add"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_add" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
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
                                    <h2 className="text-2xl font-bold">Edit Employee</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Personal Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Personal Information
                                            </h3>
                                        </div>

                                        {/* Emp ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Emp ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="emp_id" 
                                                value={formData.emp_id} 
                                                onChange={handleInputChange} 
                                                disabled
                                            />
                                        </div>

                                        {/* Employee Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Employee Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="emp_name" 
                                                value={formData.emp_name} 
                                                onChange={handleInputChange} 
                                                required 
                                                maxLength={200}
                                            />
                                        </div>

                                        {/* Gender */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                required
                                            >
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                            </select>
                                        </div>

                                        {/* Date of Birth */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Date of Birth
                                            </label>
                                            <Input 
                                                type="date" 
                                                name="dob" 
                                                value={formData.dob} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>

                                        {/* Age */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Age
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="age" 
                                                value={formData.age} 
                                                onChange={handleInputChange} 
                                                min="0"
                                                max="150"
                                            />
                                        </div>

                                        {/* Blood Group */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Blood Group
                                            </label>
                                            <Input 
                                                name="blood_group" 
                                                value={formData.blood_group} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. O+"
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Married */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="married_edit"
                                                name="married"
                                                checked={formData.married}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="married_edit" className="text-sm font-semibold text-foreground">
                                                Married
                                            </label>
                                        </div>

                                        {/* Education */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Education
                                            </label>
                                            <Input 
                                                name="education" 
                                                value={formData.education} 
                                                onChange={handleInputChange} 
                                                maxLength={200}
                                            />
                                        </div>

                                        {/* Employee Photo */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Employee Photo URL
                                            </label>
                                            <Input 
                                                name="emp_photo" 
                                                value={formData.emp_photo} 
                                                onChange={handleInputChange} 
                                                placeholder="URL or path"
                                            />
                                        </div>

                                        {/* Employment Details Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Employment Details
                                            </h3>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Location <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="location" 
                                                value={formData.location} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Corporate, Factory"
                                                required
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* Department ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Department ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="dept_id" 
                                                value={formData.dept_id} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. MGT, ADM, PR1"
                                                required
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Grade ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Grade ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="grade_id" 
                                                value={formData.grade_id} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. DIR, MGR, OPR"
                                                required
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Team */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Team <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="team" 
                                                value={formData.team} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. EX, T2, T1"
                                                required
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="category" 
                                                value={formData.category} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Regular, Contract"
                                                required
                                                maxLength={20}
                                            />
                                        </div>

                                        {/* Date of Joining */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Date of Joining
                                            </label>
                                            <Input 
                                                type="date" 
                                                name="doj" 
                                                value={formData.doj} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>

                                        {/* Date of Leaving */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Date of Leaving
                                            </label>
                                            <Input 
                                                type="date" 
                                                name="dol" 
                                                value={formData.dol} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                required
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Exited">Exited</option>
                                                <option value="Resigned">Resigned</option>
                                            </select>
                                        </div>

                                        {/* Contact Information Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Contact Information
                                            </h3>
                                        </div>

                                        {/* Address */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Address
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                maxLength={500}
                                            />
                                        </div>

                                        {/* Mobile No */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Mobile No
                                            </label>
                                            <Input 
                                                name="mobile_no" 
                                                value={formData.mobile_no} 
                                                onChange={handleInputChange} 
                                                placeholder="+91 XXXXX XXXXX"
                                                maxLength={15}
                                            />
                                        </div>

                                        {/* Additional Information Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Additional Information
                                            </h3>
                                        </div>

                                        {/* PF No */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                PF No.
                                            </label>
                                            <Input 
                                                name="pf_no" 
                                                value={formData.pf_no} 
                                                onChange={handleInputChange} 
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* ESI No */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                ESI No.
                                            </label>
                                            <Input 
                                                name="esi_no" 
                                                value={formData.esi_no} 
                                                onChange={handleInputChange} 
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* Remarks */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <textarea
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                                maxLength={500}
                                            />
                                        </div>

                                        {/* Status Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Status
                                            </h3>
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_edit"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_edit" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Update Employee
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Confirm Delete</h2>
                                    <button
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        className="text-white hover:bg-red-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to delete <strong>{selectedEmployee?.empName}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        This action cannot be undone.
                                    </p>

                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDeleteDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmDelete}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Delete
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



