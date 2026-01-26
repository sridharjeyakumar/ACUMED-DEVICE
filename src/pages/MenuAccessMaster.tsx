import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2, Key } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { menuAccessAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface MenuAccess {
    rold_id: string;
    menu_id: string;
    access: boolean;
    can_add: boolean;
    can_edit: boolean;
    can_view: boolean;
    can_cancel: boolean;
}

const MenuAccessMaster = () => {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAccess, setSelectedAccess] = useState<MenuAccess | null>(null);
    const [menuAccesses, setMenuAccesses] = useState<MenuAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        rold_id: "",
        menu_id: "",
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
    });

    useEffect(() => {
        loadMenuAccesses();
    }, []);

    const loadMenuAccesses = async () => {
        try {
            setLoading(true);
            const data = await menuAccessAPI.getAll();
            setMenuAccesses(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load menu accesses",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredAccesses = menuAccesses.filter((access) =>
        access.rold_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        access.menu_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await menuAccessAPI.create(formData);
            toast({
                title: "Success",
                description: "Menu access created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ rold_id: "", menu_id: "", access: true, can_add: true, can_edit: true, can_view: true, can_cancel: true });
            loadMenuAccesses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create menu access",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (access: MenuAccess) => {
        setSelectedAccess(access);
        setFormData({
            rold_id: access.rold_id,
            menu_id: access.menu_id,
            access: access.access,
            can_add: access.can_add,
            can_edit: access.can_edit,
            can_view: access.can_view,
            can_cancel: access.can_cancel,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccess) return;
        try {
            await menuAccessAPI.update(selectedAccess.rold_id, selectedAccess.menu_id, {
                access: formData.access,
                can_add: formData.can_add,
                can_edit: formData.can_edit,
                can_view: formData.can_view,
                can_cancel: formData.can_cancel,
            });
            toast({
                title: "Success",
                description: "Menu access updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedAccess(null);
            setFormData({ rold_id: "", menu_id: "", access: true, can_add: true, can_edit: true, can_view: true, can_cancel: true });
            loadMenuAccesses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update menu access",
                variant: "destructive",
            });
        }
    };

    const handleDelete = (access: MenuAccess) => {
        setSelectedAccess(access);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedAccess) return;
        try {
            await menuAccessAPI.delete(selectedAccess.rold_id, selectedAccess.menu_id);
            toast({
                title: "Success",
                description: "Menu access deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedAccess(null);
            loadMenuAccesses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete menu access",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Menu Access Master</h1>
                                <p className="text-muted-foreground">Manage role-based menu access and permissions</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Access
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
                                        placeholder="Search by role ID or menu ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredAccesses.length} OF {menuAccesses.length}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ROLE ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">MENU ID</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ACCESS</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ADD</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">EDIT</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">VIEW</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">CANCEL</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredAccesses.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 text-center text-muted-foreground">
                                                    No menu accesses found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAccesses.map((access, index) => (
                                            <motion.tr
                                                key={`${access.rold_id}-${access.menu_id}`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-foreground">{access.rold_id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-foreground">{access.menu_id}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.access ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_add ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_edit ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_view ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_cancel ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(access);
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
                                                                handleDelete(access);
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
                                    <h2 className="text-2xl font-bold">Add Menu Access</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Role ID <span className="text-red-500">*</span></label>
                                        <Input name="rold_id" value={formData.rold_id} onChange={handleInputChange} placeholder="e.g., ADM, OPR" required maxLength={3} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Menu ID <span className="text-red-500">*</span></label>
                                        <Input name="menu_id" value={formData.menu_id} onChange={handleInputChange} placeholder="e.g., M00, T01" required maxLength={3} />
                                    </div>
                                    <div className="mb-6 space-y-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="access" checked={formData.access} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Access</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_add" checked={formData.can_add} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can Add</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_edit" checked={formData.can_edit} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can Edit</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_view" checked={formData.can_view} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can View</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_cancel" checked={formData.can_cancel} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can Cancel</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Access</Button>
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
                                    <h2 className="text-2xl font-bold">Edit Menu Access</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Role ID <span className="text-red-500">*</span></label>
                                        <Input name="rold_id" value={formData.rold_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Menu ID <span className="text-red-500">*</span></label>
                                        <Input name="menu_id" value={formData.menu_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6 space-y-3">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="access" checked={formData.access} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Access</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_add" checked={formData.can_add} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can Add</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_edit" checked={formData.can_edit} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can Edit</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_view" checked={formData.can_view} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can View</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_cancel" checked={formData.can_cancel} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can Cancel</span></label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Access</Button>
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
                                    <p className="text-foreground mb-4">Are you sure you want to delete access for Role <strong>{selectedAccess?.rold_id}</strong> - Menu <strong>{selectedAccess?.menu_id}</strong>?</p>
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

export default MenuAccessMaster;

