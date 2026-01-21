import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuAccess {
    id: string;
    role: string;
    userInitials: string;
    userName: string;
    accessList: string[];
}

const RoleWiseMenuAccess = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        role: "",
        user: "",
        selectedMenus: [] as string[],
    });

    const accessData: MenuAccess[] = [
        {
            id: "1",
            role: "ADMIN",
            userInitials: "JD",
            userName: "John Doe",
            accessList: ["Dashboard", "Company Master", "Role Master", "+4 more"],
        },
        {
            id: "2",
            role: "SUPERVISOR",
            userInitials: "SS",
            userName: "Sarah Smith",
            accessList: ["Dashboard", "Product Status", "Material Status"],
        },
        {
            id: "3",
            role: "OPERATOR",
            userInitials: "MK",
            userName: "Mike Knight",
            accessList: ["Dashboard", "Material Status"],
        },
        {
            id: "4",
            role: "INVENTORY MANAGER",
            userInitials: "RB",
            userName: "Robert Brown",
            accessList: ["Inventory", "Material Rejection", "Product Rejection"],
        },
        {
            id: "5",
            role: "QUALITY ANALYST",
            userInitials: "EJ",
            userName: "Emily Johnson",
            accessList: ["Dashboard", "Product Status", "Product Rejection"],
        },
    ];

    const filteredAccess = accessData.filter((item) =>
        item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const menuOptions = [
        "Dashboard", "Company Master", "Role Master", "Product Master",
        "Material Master", "Production Capacity", "Product Status", "Material Status"
    ];

    const toggleMenuSelection = (menu: string) => {
        if (formData.selectedMenus.includes(menu)) {
            setFormData({
                ...formData,
                selectedMenus: formData.selectedMenus.filter(m => m !== menu)
            });
        } else {
            setFormData({
                ...formData,
                selectedMenus: [...formData.selectedMenus, menu]
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        // Reset
        setFormData({ role: "", user: "", selectedMenus: [] });
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Role wise Menu Access</h1>
                                <p className="text-muted-foreground">Assign and manage navigation access for different roles and users</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Assign New Access
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search Bar */}
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
                                        placeholder="Search by role or user name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredAccess.length} OF {accessData.length}
                                </span>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    FILTER
                                </Button>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">ROLE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-64">USER</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">MENU ACCESS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAccess.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">
                                                        {item.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                                            {item.userInitials}
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground">{item.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.accessList.map((access, i) => (
                                                            <span
                                                                key={i}
                                                                className={`px-3 py-1 rounded-md text-xs font-medium ${access.startsWith('+')
                                                                        ? 'bg-muted text-muted-foreground'
                                                                        : 'bg-muted/50 text-foreground border border-border'
                                                                    }`}
                                                            >
                                                                {access}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 4</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>Previous</Button>
                                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">Next</Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Footer */}
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
                            Real-time Data Sync • ACUMED DEVICES Manufacturing Cloud v4.2
                        </p>
                    </motion.div>

                </div>
            </main>

            {/* Assign Access Modal */}
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
                                    <h2 className="text-2xl font-bold">Assign New Access</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Role <span className="text-red-500">*</span></label>
                                            <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2 border border-border rounded-lg" required>
                                                <option value="">Select Role</option>
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="SUPERVISOR">SUPERVISOR</option>
                                                <option value="OPERATOR">OPERATOR</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">User <span className="text-red-500">*</span></label>
                                            <select name="user" value={formData.user} onChange={handleInputChange} className="w-full px-3 py-2 border border-border rounded-lg" required>
                                                <option value="">Select User</option>
                                                <option value="John Doe">John Doe</option>
                                                <option value="Sarah Smith">Sarah Smith</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-3">Menu Permissions</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {menuOptions.map((menu) => (
                                                <label key={menu} className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.selectedMenus.includes(menu)}
                                                        onChange={() => toggleMenuSelection(menu)}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm">{menu}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Assign Access</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoleWiseMenuAccess;
