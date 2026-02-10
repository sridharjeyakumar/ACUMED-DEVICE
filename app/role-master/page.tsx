'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { roleAPI } from "@/services/api";
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

interface Role {
    roll_id: string;
    roll_description: string;
    remarks: string;
    active: boolean;
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date | string; // Date
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

export default function RoleMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: Role } | null>(null);
    const [cancelledRoles, setCancelledRoles] = useState<Set<string>>(new Set());
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [roleToCancel, setRoleToCancel] = useState<Role | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        roll_id: "",
        roll_description: "",
        remarks: "",
        active: true,
    });

    useEffect(() => {
        loadRoles();
    }, []);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ roll_id: "", roll_description: "", remarks: "", active: true });
        }
    }, [isAddModalOpen]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await roleAPI.getAll();
            setRoles(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load roles",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredRoles = roles.filter((role) => {
        const matchesSearch = role.roll_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            role.roll_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (role.remarks && role.remarks.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && role.active === true) ||
            (filterActive === "inactive" && role.active === false);
        
        return matchesSearch && matchesActive;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRoles.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roleAPI.create(formData);
            toast({
                title: "Success",
                description: "Role created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ roll_id: "", roll_description: "", remarks: "", active: true });
            loadRoles();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create role",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setFormData({
            roll_id: role.roll_id,
            roll_description: role.roll_description,
            remarks: role.remarks || "",
            active: role.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        
        // Store previous state for undo
        const previousData = { ...selectedRole };
        
        try {
            await roleAPI.update(selectedRole.roll_id, {
                roll_description: formData.roll_description,
                remarks: formData.remarks,
                active: formData.active,
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Role updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedRole(null);
            setFormData({ roll_id: "", roll_description: "", remarks: "", active: true });
            loadRoles();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update role",
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
            setFormData({ roll_id: "", roll_description: "", remarks: "", active: true });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedRole(null);
            setFormData({ roll_id: "", roll_description: "", remarks: "", active: true });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };
    
    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            if (lastAction.type === 'edit') {
                // Restore previous data
                await roleAPI.update(lastAction.data.roll_id, {
                    roll_description: lastAction.data.roll_description,
                    remarks: lastAction.data.remarks,
                    active: lastAction.data.active,
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadRoles();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };


    const handleCancel = (role: Role) => {
        setRoleToCancel(role);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!roleToCancel) return;
        
        const isCancelled = cancelledRoles.has(roleToCancel.roll_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await roleAPI.update(roleToCancel.roll_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledRoles(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(roleToCancel.roll_id);
                    toast({
                        title: "Restored",
                        description: `Role ${roleToCancel.roll_description} has been restored`,
                    });
                } else {
                    newSet.add(roleToCancel.roll_id);
                    toast({
                        title: "Cancelled",
                        description: `Role ${roleToCancel.roll_description} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadRoles(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setRoleToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} role`,
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Role Master</h1>
                                <p className="text-muted-foreground">Define and manage organizational user roles and permissions</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Role
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
                                        placeholder="Search roles by ID or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredRoles.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredRoles.length)} OF {filteredRoles.length}
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
                                                            id="role-active-all" 
                                                            name="roleActiveStatus"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="role-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="role-active-true" 
                                                            name="roleActiveStatus"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="role-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="role-active-false" 
                                                            name="roleActiveStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="role-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
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
                                                onClick={() => setFilterActive("all")}
                                            >
                                                Clear Filter
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">roll id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">roll description</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">remarks</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">active</th>
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
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredRoles.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                                                    No roles found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRoles.map((role, index) => {
                                                const isCancelled = cancelledRoles.has(role.roll_id);
                                                return (
                                            <motion.tr
                                                key={role.roll_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={`hover:bg-muted/30 transition-colors cursor-pointer ${isCancelled ? 'opacity-40' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                        {role.roll_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">
                                                        {role.roll_description}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {role.remarks || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        role.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {role.active ? "TRUE" : "FALSE"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {role.last_modified_user_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-mono text-foreground">{role.last_modified_user_id}</span>
                                                            <span className="text-xs text-muted-foreground">{role.last_modified_user_id}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {role.last_modified_date_time 
                                                            ? formatDateTime(role.last_modified_date_time)
                                                            : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(role);
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
                                                                handleCancel(role);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore role" : "Cancel role"}
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

                    {/* Add Role Modal */}
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
                                            <h2 className="text-2xl font-bold">Add New Role</h2>
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
                                                    Role ID <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="roll_id"
                                                    value={formData.roll_id}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., R01, R02, R03"
                                                    required
                                                    maxLength={3}
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Role Description <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="roll_description"
                                                    value={formData.roll_description}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., ADMIN, SUPERVISOR, OPERATOR"
                                                    required
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Remarks
                                                </label>
                                                <textarea
                                                    name="remarks"
                                                    value={formData.remarks}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the role's responsibilities and permissions..."
                                                    rows={4}
                                                    maxLength={100}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="active"
                                                        checked={formData.active}
                                                        onChange={handleInputChange}
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
                                                    Save Role
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Edit Role Modal */}
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
                                            <h2 className="text-2xl font-bold">Edit Role</h2>
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
                                                    Role ID <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="roll_id"
                                                    value={formData.roll_id}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., R01, R02, R03"
                                                    required
                                                    disabled
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Role Description <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="roll_description"
                                                    value={formData.roll_description}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., ADMIN, SUPERVISOR, OPERATOR"
                                                    required
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Remarks
                                                </label>
                                                <textarea
                                                    name="remarks"
                                                    value={formData.remarks}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the role's responsibilities and permissions..."
                                                    rows={4}
                                                    maxLength={100}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="active"
                                                        checked={formData.active}
                                                        onChange={handleInputChange}
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
                                                    Update Role
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
                            {roleToCancel && cancelledRoles.has(roleToCancel.roll_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {roleToCancel && cancelledRoles.has(roleToCancel.roll_id)
                                ? `Are you sure you want to restore role "${roleToCancel.roll_description}"?`
                                : `Are you sure you want to cancel role "${roleToCancel?.roll_description}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setRoleToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={roleToCancel && cancelledRoles.has(roleToCancel.roll_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {roleToCancel && cancelledRoles.has(roleToCancel.roll_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

                </div>
            </main>
        </div>
    );
}



