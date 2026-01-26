import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2, Clock } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { userLoginHistoryAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface LoginHistory {
    _id?: string;
    user_id: string;
    login_date: string;
    login_time: string;
    logout_date?: string;
    logout_time?: string;
}

const UserLoginHistory = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<LoginHistory | null>(null);
    const [loginHistories, setLoginHistories] = useState<LoginHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        user_id: "",
        login_date: "",
        login_time: "",
        logout_date: "",
        logout_time: "",
    });

    useEffect(() => {
        loadLoginHistories();
    }, []);

    const loadLoginHistories = async () => {
        try {
            setLoading(true);
            const data = await userLoginHistoryAPI.getAll();
            setLoginHistories(data.map((h: any) => ({
                _id: h._id,
                user_id: h.user_id,
                login_date: h.Date_login_Date ? h.Date_login_Date.split('T')[0] : '',
                login_time: h.Time_login_Time || '',
                logout_date: h.Date_Logout_Date ? h.Date_Logout_Date.split('T')[0] : undefined,
                logout_time: h.Time_Logout_Time || undefined,
            })));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load login histories",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredHistories = loginHistories.filter((history) =>
        history.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        history.login_date.includes(searchQuery)
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userLoginHistoryAPI.create({
                user_id: formData.user_id,
                Date_login_Date: formData.login_date,
                Time_login_Time: formData.login_time,
                Date_Logout_Date: formData.logout_date || undefined,
                Time_Logout_Time: formData.logout_time || undefined,
            });
            toast({
                title: "Success",
                description: "Login history created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ user_id: "", login_date: "", login_time: "", logout_date: "", logout_time: "" });
            loadLoginHistories();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create login history",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (history: LoginHistory) => {
        setSelectedHistory(history);
        setFormData({
            user_id: history.user_id,
            login_date: history.login_date,
            login_time: history.login_time,
            logout_date: history.logout_date || "",
            logout_time: history.logout_time || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHistory || !selectedHistory._id) return;
        try {
            await userLoginHistoryAPI.update(selectedHistory._id, {
                Date_login_Date: formData.login_date,
                Time_login_Time: formData.login_time,
                Date_Logout_Date: formData.logout_date || undefined,
                Time_Logout_Time: formData.logout_time || undefined,
            });
            toast({
                title: "Success",
                description: "Login history updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedHistory(null);
            setFormData({ user_id: "", login_date: "", login_time: "", logout_date: "", logout_time: "" });
            loadLoginHistories();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update login history",
                variant: "destructive",
            });
        }
    };

    const handleDelete = (history: LoginHistory) => {
        setSelectedHistory(history);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedHistory || !selectedHistory._id) return;
        try {
            await userLoginHistoryAPI.delete(selectedHistory._id);
            toast({
                title: "Success",
                description: "Login history deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedHistory(null);
            loadLoginHistories();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete login history",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">User Login History</h1>
                                <p className="text-muted-foreground">Track and manage user login and logout activities</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add Login Record
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
                                        placeholder="Search by user ID or date..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredHistories.length} OF {loginHistories.length}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">LOGIN DATE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">LOGIN TIME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">LOGOUT DATE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">LOGOUT TIME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredHistories.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No login histories found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistories.map((history, index) => (
                                            <motion.tr
                                                key={history._id || `${history.user_id}-${history.login_date}-${history.login_time}`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-foreground">{history.user_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{history.login_date}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{history.login_time}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{history.logout_date || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{history.logout_time || "-"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(history);
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
                                                                handleDelete(history);
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
                                    <h2 className="text-2xl font-bold">Add Login Record</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">User ID <span className="text-red-500">*</span></label>
                                        <Input name="user_id" value={formData.user_id} onChange={handleInputChange} placeholder="e.g., AD, OP1" required maxLength={10} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Login Date <span className="text-red-500">*</span></label>
                                        <Input type="date" name="login_date" value={formData.login_date} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Login Time <span className="text-red-500">*</span></label>
                                        <Input type="time" name="login_time" value={formData.login_time} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Logout Date</label>
                                        <Input type="date" name="logout_date" value={formData.logout_date} onChange={handleInputChange} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Logout Time</label>
                                        <Input type="time" name="logout_time" value={formData.logout_time} onChange={handleInputChange} />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Record</Button>
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
                                    <h2 className="text-2xl font-bold">Edit Login Record</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">User ID <span className="text-red-500">*</span></label>
                                        <Input name="user_id" value={formData.user_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Login Date <span className="text-red-500">*</span></label>
                                        <Input type="date" name="login_date" value={formData.login_date} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Login Time <span className="text-red-500">*</span></label>
                                        <Input type="time" name="login_time" value={formData.login_time} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Logout Date</label>
                                        <Input type="date" name="logout_date" value={formData.logout_date} onChange={handleInputChange} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Logout Time</label>
                                        <Input type="time" name="logout_time" value={formData.logout_time} onChange={handleInputChange} />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Record</Button>
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
                                    <p className="text-foreground mb-4">Are you sure you want to delete login record for user <strong>{selectedHistory?.user_id}</strong>?</p>
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

export default UserLoginHistory;

