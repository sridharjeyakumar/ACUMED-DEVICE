'use client';

import { useState, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ProductStatus {
    prod_status_id: string; // Char(3) - PK
    product_status: string; // Char(30)
    stock_movement: string; // Char(3) - dropdown (IN / OUT) - can be empty
    effect_in_stock: string; // Char(1) - dropdown (+ / -) - can be empty
    seq_no: number; // N(2)
    active: boolean;
    last_modified_user_id: string; // Char(5)
    last_modified_date_time: Date; // Date
}

// Helper function to format dates consistently (prevents hydration errors)
function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
}

export default function ProductStatusMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<ProductStatus | null>(null);
    const isSubmittingRef = useRef(false);
    const [statuses, setStatuses] = useState<ProductStatus[]>([
        {
            prod_status_id: "MFD",
            product_status: "Manufactured",
            stock_movement: "IN",
            effect_in_stock: "+",
            seq_no: 1,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "IQC",
            product_status: "in QC",
            stock_movement: "",
            effect_in_stock: "",
            seq_no: 2,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "PST",
            product_status: "Packed for Sterilization",
            stock_movement: "",
            effect_in_stock: "",
            seq_no: 3,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "SST",
            product_status: "Sent for Sterilization",
            stock_movement: "OUT",
            effect_in_stock: "-",
            seq_no: 4,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "RST",
            product_status: "Received from Sterilization",
            stock_movement: "IN",
            effect_in_stock: "+",
            seq_no: 5,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "PDS",
            product_status: "Packed for Dispatch",
            stock_movement: "",
            effect_in_stock: "",
            seq_no: 6,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "DSP",
            product_status: "Dispatched",
            stock_movement: "OUT",
            effect_in_stock: "-",
            seq_no: 7,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "ST+",
            product_status: "Stock Adjustment (Add)",
            stock_movement: "IN",
            effect_in_stock: "+",
            seq_no: 8,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "ST-",
            product_status: "Stock Adjustment (Reduce)",
            stock_movement: "OUT",
            effect_in_stock: "-",
            seq_no: 9,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
        {
            prod_status_id: "DMG",
            product_status: "Damaged",
            stock_movement: "",
            effect_in_stock: "",
            seq_no: 10,
            active: true,
            last_modified_user_id: "",
            last_modified_date_time: new Date(),
        },
    ]);
    const [formData, setFormData] = useState({
        prod_status_id: "",
        product_status: "",
        stock_movement: "",
        effect_in_stock: "",
        seq_no: "",
        active: true,
    });

    const filteredStatuses = statuses.filter((status) =>
        status.prod_status_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        status.product_status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            // TODO: Replace with actual API call
            const newStatus: ProductStatus = {
                prod_status_id: formData.prod_status_id,
                product_status: formData.product_status,
                stock_movement: formData.stock_movement,
                effect_in_stock: formData.effect_in_stock,
                seq_no: parseInt(formData.seq_no) || 0,
                active: formData.active,
                last_modified_user_id: "ADMIN", // TODO: Get from auth context
                last_modified_date_time: new Date(),
            };
            setStatuses([...statuses, newStatus]);
            toast({
                title: "Success",
                description: "Product status created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                prod_status_id: "",
                product_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create product status",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (status: ProductStatus) => {
        setSelectedStatus(status);
        setFormData({
            prod_status_id: status.prod_status_id,
            product_status: status.product_status,
            stock_movement: status.stock_movement,
            effect_in_stock: status.effect_in_stock,
            seq_no: status.seq_no.toString(),
            active: status.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedStatus) return;
        isSubmittingRef.current = true;
        try {
            // TODO: Replace with actual API call
            const updatedStatuses = statuses.map((s) =>
                s.prod_status_id === selectedStatus.prod_status_id
                    ? {
                        ...s,
                        product_status: formData.product_status,
                        stock_movement: formData.stock_movement,
                        effect_in_stock: formData.effect_in_stock,
                        seq_no: parseInt(formData.seq_no) || 0,
                        active: formData.active,
                        last_modified_user_id: "ADMIN",
                        last_modified_date_time: new Date(),
                    }
                    : s
            );
            setStatuses(updatedStatuses);
            toast({
                title: "Success",
                description: "Product status updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedStatus(null);
            setFormData({
                prod_status_id: "",
                product_status: "",
                stock_movement: "",
                effect_in_stock: "",
                seq_no: "",
                active: true,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update product status",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (status: ProductStatus) => {
        setSelectedStatus(status);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (isSubmittingRef.current) return;
        if (!selectedStatus) return;
        isSubmittingRef.current = true;
        try {
            // TODO: Replace with actual API call
            setStatuses(statuses.filter((s) => s.prod_status_id !== selectedStatus.prod_status_id));
            toast({
                title: "Success",
                description: "Product status deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedStatus(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete product status",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product Status Master</h1>
                                <p className="text-muted-foreground">Define and manage various statuses for manufactured products</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Product Status
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
                                        placeholder="Search by Status ID or Product Status..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredStatuses.length} OF {statuses.length}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">PROD STATUS ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[200px]">PRODUCT STATUS</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">STOCK MOVEMENT</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">EFFECT IN STOCK</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">SEQ NO.</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">ACTIVE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">LAST MODIFIED USER ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">LAST MODIFIED DATE & TIME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredStatuses.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-4 text-center text-muted-foreground">
                                                    No product statuses found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStatuses.map((status, index) => (
                                                <motion.tr
                                                    key={status.prod_status_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground font-mono">{status.prod_status_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.product_status}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.stock_movement || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-semibold">{status.effect_in_stock || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{status.seq_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                            status.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {status.active ? "TRUE" : "FALSE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-mono">{status.last_modified_user_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {status.last_modified_date_time 
                                                                ? formatDateTime(status.last_modified_date_time)
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
                                                                    handleEdit(status);
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
                                                                    handleDelete(status);
                                                                }}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
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
                </div>
            </main>

            {/* Add Status Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Product Status</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Prod Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="prod_status_id"
                                                value={formData.prod_status_id}
                                                onChange={handleInputChange}
                                                placeholder="e.g., MFD, IQC"
                                                required
                                                maxLength={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Status <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_status"
                                                value={formData.product_status}
                                                onChange={handleInputChange}
                                                placeholder="Enter product status"
                                                required
                                                maxLength={30}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Stock Movement
                                            </label>
                                            <select
                                                name="stock_movement"
                                                value={formData.stock_movement}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                <option value="IN">IN</option>
                                                <option value="OUT">OUT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Effect in Stock
                                            </label>
                                            <select
                                                name="effect_in_stock"
                                                value={formData.effect_in_stock}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                <option value="+">+</option>
                                                <option value="-">-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Seq No. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="seq_no"
                                                type="number"
                                                value={formData.seq_no}
                                                onChange={handleInputChange}
                                                placeholder="Enter sequence number"
                                                required
                                                min={1}
                                                max={99}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Active
                                            </label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="active"
                                                        checked={formData.active}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            </div>
                                        </div>
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
                                            disabled={isSubmittingRef.current}
                                        >
                                            Save Status
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Status Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Product Status</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Prod Status ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="prod_status_id"
                                                value={formData.prod_status_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Status <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_status"
                                                value={formData.product_status}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={30}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Stock Movement
                                            </label>
                                            <select
                                                name="stock_movement"
                                                value={formData.stock_movement}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                <option value="IN">IN</option>
                                                <option value="OUT">OUT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Effect in Stock
                                            </label>
                                            <select
                                                name="effect_in_stock"
                                                value={formData.effect_in_stock}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                <option value="+">+</option>
                                                <option value="-">-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Seq No. <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="seq_no"
                                                type="number"
                                                value={formData.seq_no}
                                                onChange={handleInputChange}
                                                required
                                                min={1}
                                                max={99}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Active
                                            </label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="active"
                                                        checked={formData.active}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            </div>
                                        </div>
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
                                            disabled={isSubmittingRef.current}
                                        >
                                            Update Status
                                        </Button>
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
                                        Are you sure you want to delete product status <strong>{selectedStatus?.product_status}</strong> ({selectedStatus?.prod_status_id})?
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
                                            disabled={isSubmittingRef.current}
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
