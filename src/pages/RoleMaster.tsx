import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Role {
    id: string;
    description: string;
    remarks: string;
}

const RoleMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        roleId: "",
        roleDescription: "",
        remarks: "",
        status: "Active",
    });

    const roles: Role[] = [
        {
            id: "ROL-001",
            description: "ADMIN",
            remarks: "Full access to system configuration, user management, and audit logs.",
        },
        {
            id: "ROL-002",
            description: "SUPERVISOR",
            remarks: "Manages production schedules, approves batches, and oversees operators.",
        },
        {
            id: "ROL-003",
            description: "OPERATOR",
            remarks: "Executes production floor tasks, logs material usage, and records outputs.",
        },
        {
            id: "ROL-004",
            description: "INVENTORY MANAGER",
            remarks: "Responsible for stock levels, warehouse management, and raw material procurement.",
        },
        {
            id: "ROL-005",
            description: "QUALITY ANALYST",
            remarks: "Performs quality inspections, manages rejection reports, and ensures compliance.",
        },
    ];

    const filteredRoles = roles.filter((role) =>
        role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.remarks.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
            roleId: "",
            roleDescription: "",
            remarks: "",
            status: "Active",
        });
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

                    {/* Search and Filter Bar */}
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
                                        placeholder="Search roles by description or ID..."
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                ROLE ID
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-64">
                                                ROLE DESCRIPTION
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                REMARKS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredRoles.map((role, index) => (
                                            <motion.tr
                                                key={role.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                        {role.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">
                                                        {role.description}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {role.remarks}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 3</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
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

            {/* Add Role Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsAddModalOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                {/* Modal Header */}
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Role</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {/* Role ID */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Role ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="roleId"
                                            value={formData.roleId}
                                            onChange={handleInputChange}
                                            placeholder="ROL-XXX"
                                            required
                                        />
                                    </div>

                                    {/* Role Description */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Role Description <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="roleDescription"
                                            value={formData.roleDescription}
                                            onChange={handleInputChange}
                                            placeholder="e.g., ADMIN, SUPERVISOR, OPERATOR"
                                            required
                                        />
                                    </div>

                                    {/* Remarks */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Remarks <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Describe the role's responsibilities and permissions..."
                                            rows={4}
                                            required
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-3">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="Active"
                                                    checked={formData.status === "Active"}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Active</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="Inactive"
                                                    checked={formData.status === "Inactive"}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Inactive</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
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
        </div>
    );
};

export default RoleMaster;
