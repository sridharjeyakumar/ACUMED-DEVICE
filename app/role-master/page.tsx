'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { roleAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Role {
    roll_id: string;
    roll_description: string;
    remarks: string;
    active: boolean;
}

export default function RoleMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        roll_id: "",
        roll_description: "",
        remarks: "",
        active: true,
    });

    useEffect(() => {
        loadRoles();
    }, []);

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

    const filteredRoles = roles.filter((role) =>
        role.roll_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.roll_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.remarks && role.remarks.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
        try {
            await roleAPI.update(selectedRole.roll_id, {
                roll_description: formData.roll_description,
                remarks: formData.remarks,
                active: formData.active,
            });
            toast({
                title: "Success",
                description: "Role updated successfully",
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

    const handleDelete = (role: Role) => {
        setSelectedRole(role);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedRole) return;
        try {
            await roleAPI.delete(selectedRole.roll_id);
            toast({
                title: "Success",
                description: "Role deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedRole(null);
            loadRoles();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete role",
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
                                    SHOWING 1-{filteredRoles.length} OF {roles.length}
                                </span>
                                <Button variant="outline" size="icon">
                                    <Filter className="w-4 h-4" />
                                </Button>
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
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                ROLE ID
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-64">
                                                ROLE DESCRIPTION
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                REMARKS
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                STATUS
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                ACTIONS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredRoles.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                                                    No roles found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRoles.map((role, index) => (
                                            <motion.tr
                                                key={role.roll_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
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
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        role.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {role.active ? "Active" : "Inactive"}
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
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(role);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" disabled>
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
                                    onClick={() => setIsAddModalOpen(false)}
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
                                                onClick={() => setIsAddModalOpen(false)}
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
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsAddModalOpen(false)}
                                                    className="px-6"
                                                >
                                                    Cancel
                                                </Button>
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
                                    onClick={() => setIsEditModalOpen(false)}
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
                                                onClick={() => setIsEditModalOpen(false)}
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
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsEditModalOpen(false)}
                                                    className="px-6"
                                                >
                                                    Cancel
                                                </Button>
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

                    {/* Delete Confirmation Dialog */}
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
                                                Are you sure you want to delete <strong>{selectedRole?.roll_description}</strong> role?
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
            </main>
        </div>
    );
}


