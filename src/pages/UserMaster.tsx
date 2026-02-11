import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2, User } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { userAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface User {
    user_id: string;
    employee_id: string;
    active: boolean;
    last_login?: string;
}

const UserMaster = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        user_id: "",
        employee_id: "",
        password: "",
        password_expiry_days: 90,
        active: true,
    });

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await userAPI.getAll();
            setUsers(data.map((u: any) => ({
                user_id: u.user_id,
                employee_id: u.employee_id,
                active: u.active,
                last_login: u.Date_last_login_date ? `${u.Date_last_login_date.split('T')[0]} ${u.Time_last_login_time || ''}` : undefined,
            })));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load users",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filteredUsers = users.filter((user) =>
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userAPI.create({
                user_id: formData.user_id,
                employee_id: formData.employee_id,
                password: formData.password,
                N_password_expiry_days: formData.password_expiry_days,
                active: formData.active,
            });
            toast({
                title: "Success",
                description: "User created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ user_id: "", employee_id: "", password: "", password_expiry_days: 90, active: true });
            loadUsers();
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
            password: "",
            password_expiry_days: 90,
            active: user.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            const updateData: any = {
                employee_id: formData.employee_id,
                active: formData.active,
            };
            if (formData.password) {
                updateData.password = formData.password;
            }
            if (formData.password_expiry_days) {
                updateData.N_password_expiry_days = formData.password_expiry_days;
            }
            await userAPI.update(selectedUser.user_id, updateData);
            toast({
                title: "Success",
                description: "User updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setFormData({ user_id: "", employee_id: "", password: "", password_expiry_days: 90, active: true });
            loadUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update user",
                variant: "destructive",
            });
        }
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await userAPI.delete(selectedUser.user_id);
            toast({
                title: "Success",
                description: "User deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            loadUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete user",
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
                                        placeholder="Search users by ID or employee ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredUsers.length} OF {users.length}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">USER ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">EMPLOYEE ID</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">STATUS</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">LAST LOGIN</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                                                    No users found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user, index) => (
                                            <motion.tr
                                                key={user.user_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-foreground">{user.user_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{user.employee_id}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        user.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {user.active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground">{user.last_login || "Never"}</span>
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
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(user);
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New User</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">User ID <span className="text-red-500">*</span></label>
                                        <Input name="user_id" value={formData.user_id} onChange={handleInputChange} placeholder="e.g., AD, OP1" required maxLength={10} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Employee ID <span className="text-red-500">*</span></label>
                                        <Input name="employee_id" value={formData.employee_id} onChange={handleInputChange} placeholder="e.g., E1001" required maxLength={5} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Password <span className="text-red-500">*</span></label>
                                        <Input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Password Expiry Days</label>
                                        <Input type="number" name="password_expiry_days" value={formData.password_expiry_days} onChange={handleInputChange} min="0" max="999" />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save User</Button>
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit User</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">User ID <span className="text-red-500">*</span></label>
                                        <Input name="user_id" value={formData.user_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Employee ID <span className="text-red-500">*</span></label>
                                        <Input name="employee_id" value={formData.employee_id} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                                        <Input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current password" />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Password Expiry Days</label>
                                        <Input type="number" name="password_expiry_days" value={formData.password_expiry_days} onChange={handleInputChange} min="0" max="999" />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update User</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Dialog */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsDeleteDialogOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Confirm Delete</h2>
                                    <button onClick={() => setIsDeleteDialogOpen(false)} className="text-white hover:bg-red-700 rounded-lg p-2"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="p-6">
                                    <p className="text-foreground mb-4">Are you sure you want to delete user <strong>{selectedUser?.user_id}</strong>?</p>
                                    <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
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
};

export default UserMaster;

