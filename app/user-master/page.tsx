'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, User } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { userAPI, roleAPI, employeeAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
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

interface User {
    user_id: string; // Char(10) - PK
    employee_id: string; // Char(5) - FK
    role_id?: string; // Char(3) - FK
    password_changed_date?: Date | string; // Date
    password_expiry_date?: Date | string; // Date
    password_expiry_days?: number; // N(3)
    last_login_date?: Date | string; // Date
    last_login_time?: string; // Time
    active: boolean; // Boolean
}

// Helper function to format dates consistently (prevents hydration errors)
function formatDate(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}

// Helper function to format time
function formatTime(time: string | undefined): string {
    if (!time) return "-";
    // If time is already in HH:MM:SS format, return as is
    // If time is in HH:MM format, add :00 for seconds
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return time;
    } else if (time.match(/^\d{2}:\d{2}$/)) {
        return `${time}:00`;
    }
    return time;
}

export default function UserMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [userToCancel, setUserToCancel] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: User } | null>(null);
    const [cancelledUsers, setCancelledUsers] = useState<Set<string>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        user_id: "",
        employee_id: "",
        role_id: "",
        password: "",
        password_expiry_days: 90,
        active: true,
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ user_id: "", employee_id: "", role_id: "", password: "", password_expiry_days: 90, active: true });
        }
    }, [isAddModalOpen]);

    const loadAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, rolesData, employeesData] = await Promise.all([
                userAPI.getAll(),
                roleAPI.getAll(),
                employeeAPI.getAll(),
            ]);
            setUsers(usersData.map((u: any) => ({
                user_id: u.user_id,
                employee_id: u.employee_id,
                role_id: u.role_id || u.roll_id,
                password_changed_date: u.password_changed_date || u.Date_password_changed_date,
                password_expiry_date: u.password_expiry_date || u.Date_password_expiry_date,
                password_expiry_days: u.password_expiry_days || u.N_password_expiry_days,
                last_login_date: u.last_login_date || u.Date_last_login_date,
                last_login_time: u.last_login_time || u.Time_last_login_time,
                active: u.active !== false,
            })));
            setRoles(rolesData);
            setEmployees(employeesData || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Create lookup map for roles
    const roleMap = new Map(roles.map(r => [r.roll_id, r.roll_description]));

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.role_id && user.role_id.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && user.active === true) ||
            (filterActive === "inactive" && user.active === false);
        
        const matchesRole = filterRole === "all" || user.role_id === filterRole;
        
        return matchesSearch && matchesActive && matchesRole;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, filterRole, rowsPerPage]);

    const uniqueRoles = Array.from(new Set(users.map(u => u.role_id).filter(r => r)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userAPI.create({
                user_id: formData.user_id,
                employee_id: formData.employee_id,
                role_id: formData.role_id,
                password: formData.password,
                N_password_expiry_days: formData.password_expiry_days,
                active: formData.active,
            });
            toast({
                title: "Success",
                description: "User created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ user_id: "", employee_id: "", role_id: "", password: "", password_expiry_days: 90, active: true });
            loadAllData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create user",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            user_id: user.user_id,
            employee_id: user.employee_id,
            role_id: user.role_id || "",
            password: "",
            password_expiry_days: user.password_expiry_days || 90,
            active: user.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        
        // Store previous state for undo
        const previousData = { ...selectedUser };
        
        try {
            const updateData: any = {
                employee_id: formData.employee_id,
                role_id: formData.role_id,
                active: formData.active,
            };
            if (formData.password) {
                updateData.password = formData.password;
            }
            if (formData.password_expiry_days) {
                updateData.N_password_expiry_days = formData.password_expiry_days;
            }
            await userAPI.update(selectedUser.user_id, updateData);
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "User updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setFormData({ user_id: "", employee_id: "", role_id: "", password: "", password_expiry_days: 90, active: true });
            loadAllData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update user",
                variant: "destructive",
            });
        }
    };
    
    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            // Restore previous data (note: password cannot be restored, so we skip it)
            const updateData: any = {
                employee_id: lastAction.data.employee_id,
                role_id: lastAction.data.role_id,
                active: lastAction.data.active,
            };
            if (lastAction.data.password_expiry_days) {
                updateData.N_password_expiry_days = lastAction.data.password_expiry_days;
            }
            await userAPI.update(lastAction.data.user_id, updateData);
            toast({
                title: "Undone",
                description: "Changes have been reverted",
            });
            setLastAction(null);
            loadAllData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (user: User) => {
        setUserToCancel(user);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!userToCancel) return;
        
        const isCancelled = cancelledUsers.has(userToCancel.user_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await userAPI.update(userToCancel.user_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledUsers(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(userToCancel.user_id);
                    toast({
                        title: "Restored",
                        description: `User ${userToCancel.user_id} has been restored`,
                    });
                } else {
                    newSet.add(userToCancel.user_id);
                    toast({
                        title: "Cancelled",
                        description: `User ${userToCancel.user_id} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadAllData(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setUserToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} user`,
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
            setFormData({ user_id: "", employee_id: "", role_id: "", password: "", password_expiry_days: 90, active: true });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setFormData({ user_id: "", employee_id: "", role_id: "", password: "", password_expiry_days: 90, active: true });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">User Master</h1>
                                <p className="text-muted-foreground">Manage user accounts and access credentials</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New User
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
                                        placeholder="Search users by ID, employee ID, or role ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredUsers.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredUsers.length)} OF {filteredUsers.length}
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
                                                            id="user-active-all" 
                                                            name="userActiveStatus"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="user-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="user-active-true" 
                                                            name="userActiveStatus"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="user-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="user-active-false" 
                                                            name="userActiveStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="user-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            {uniqueRoles.length > 0 && (
                                                <div className="space-y-3 pt-3 border-t border-border">
                                                    <Label className="text-sm font-semibold text-foreground">Role</Label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="user-role-all" 
                                                                name="userRoleFilter"
                                                                checked={filterRole === "all"}
                                                                onChange={() => setFilterRole("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="user-role-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueRoles.map((role) => (
                                                            <div key={role} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`user-role-${role}`} 
                                                                    name="userRoleFilter"
                                                                    checked={filterRole === role}
                                                                    onChange={() => setFilterRole(role)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`user-role-${role}`} className="text-sm font-normal cursor-pointer text-foreground">{role}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
                                                    setFilterRole("all");
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">User Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Employee Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Password</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Role Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Password Changed Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Password Expiry Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Password Expiry Days</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Last Login Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Last Login Time</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Active</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={11} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="px-6 py-4 text-center text-muted-foreground">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedUsers.map((user, index) => {
                                                const isCancelled = cancelledUsers.has(user.user_id);
                                                return (
                                            <motion.tr
                                                key={user.user_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-foreground">{user.user_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{user.employee_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">••••••••</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.role_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-mono text-foreground">{user.role_id}</span>
                                                            <span className="text-xs text-muted-foreground">{roleMap.get(user.role_id) || "-"}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatDate(user.password_changed_date)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatDate(user.password_expiry_date)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-foreground">{user.password_expiry_days || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatDate(user.last_login_date)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatTime(user.last_login_time)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        user.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {user.active ? "TRUE" : "FALSE"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(user);
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
                                                                handleCancel(user);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore user" : "Cancel user"}
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
                    </motion.div>
                </div>
            </main>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => handleCancelClick('add')} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New User</h2>
                                    <button onClick={() => handleCancelClick('add')} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                User ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="user_id" 
                                                value={formData.user_id} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g., E1001" 
                                                required 
                                                maxLength={10} 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Employee ID <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="employee_id"
                                                value={formData.employee_id}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="">Select Employee ID</option>
                                                {employees
                                                    .filter((emp: any) => emp.active !== false)
                                                    .map((emp: any) => (
                                                        <option key={emp.emp_id || emp._id} value={emp.emp_id}>
                                                            {emp.emp_id} - {emp.emp_name || emp.empName || ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Role ID <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="role_id"
                                                value={formData.role_id}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="">Select Role ID</option>
                                                {roles
                                                    .filter((role: any) => role.active !== false)
                                                    .map((role: any) => (
                                                        <option key={role.roll_id || role.role_id} value={role.roll_id || role.role_id}>
                                                            {role.roll_id || role.role_id} - {role.roll_description || role.role_description || ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Password <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="password" 
                                                name="password" 
                                                value={formData.password} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Password Expiry Days
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="password_expiry_days" 
                                                value={formData.password_expiry_days} 
                                                onChange={handleInputChange} 
                                                min="0" 
                                                max="999" 
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input 
                                                type="checkbox" 
                                                name="active" 
                                                checked={formData.active} 
                                                onChange={handleInputChange} 
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                                            />
                                            <label className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Save User
                                        </Button>
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit User</h2>
                                    <button onClick={() => handleCancelClick('edit')} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                User ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="user_id" 
                                                value={formData.user_id} 
                                                onChange={handleInputChange} 
                                                required 
                                                disabled 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Employee ID <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="employee_id"
                                                value={formData.employee_id}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="">Select Employee ID</option>
                                                {employees
                                                    .filter((emp: any) => emp.active !== false)
                                                    .map((emp: any) => (
                                                        <option key={emp.emp_id || emp._id} value={emp.emp_id}>
                                                            {emp.emp_id} - {emp.emp_name || emp.empName || ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Role ID <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="role_id"
                                                value={formData.role_id}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="">Select Role ID</option>
                                                {roles
                                                    .filter((role: any) => role.active !== false)
                                                    .map((role: any) => (
                                                        <option key={role.roll_id || role.role_id} value={role.roll_id || role.role_id}>
                                                            {role.roll_id || role.role_id} - {role.roll_description || role.role_description || ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                New Password
                                            </label>
                                            <Input 
                                                type="password" 
                                                name="password" 
                                                value={formData.password} 
                                                onChange={handleInputChange} 
                                                placeholder="Leave blank to keep current password" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Password Expiry Days
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="password_expiry_days" 
                                                value={formData.password_expiry_days} 
                                                onChange={handleInputChange} 
                                                min="0" 
                                                max="999" 
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input 
                                                type="checkbox" 
                                                name="active" 
                                                checked={formData.active} 
                                                onChange={handleInputChange} 
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                                            />
                                            <label className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Update User
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
                            {userToCancel && cancelledUsers.has(userToCancel.user_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToCancel && cancelledUsers.has(userToCancel.user_id)
                                ? `Are you sure you want to restore user "${userToCancel.user_id}"?`
                                : `Are you sure you want to cancel user "${userToCancel?.user_id}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setUserToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={userToCancel && cancelledUsers.has(userToCancel.user_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {userToCancel && cancelledUsers.has(userToCancel.user_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
