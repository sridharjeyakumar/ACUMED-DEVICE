import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Minus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RejectionType {
    id: string;
    name: string;
    description: string;
    effectType: "ERROR" | "SUBTRACT"; // ERROR = Bold Text, SUBTRACT = Red Minus
    seqNo: number;
    active: boolean;
}

const ProductRejectionTypeMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        effectType: "ERROR" as "ERROR" | "SUBTRACT",
        active: true,
    });

    const rejectionTypes: RejectionType[] = [
        {
            id: "PRJ-001",
            name: "Physical Damage",
            description: "VISIBLE CRACKS OR BREAKS",
            effectType: "ERROR",
            seqNo: 1,
            active: true,
        },
        {
            id: "PRJ-002",
            name: "Quality Fail",
            description: "PERFORMANCE BELOW THRESHOLD",
            effectType: "ERROR",
            seqNo: 2,
            active: true,
        },
        {
            id: "PRJ-003",
            name: "Packaging Issue",
            description: "EXTERNAL BOX DAMAGE",
            effectType: "SUBTRACT",
            seqNo: 3,
            active: true,
        },
        {
            id: "PRJ-004",
            name: "Label Mismatch",
            description: "INCORRECT BARCODE OR INFO",
            effectType: "SUBTRACT",
            seqNo: 4,
            active: true,
        },
        {
            id: "PRJ-005",
            name: "Scrapped",
            description: "BEYOND REPAIR",
            effectType: "ERROR",
            seqNo: 5,
            active: false,
        },
    ];

    const filteredTypes = rejectionTypes.filter((type) =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
            name: "",
            description: "",
            effectType: "ERROR",
            active: true,
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product Rejection Type Master</h1>
                                <p className="text-muted-foreground">Configure and categorize reasons for product rejection</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Rejection Type
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
                                        placeholder="Search rejection type or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>

                                {/* Impact Filter */}
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                        <span className="text-sm font-medium">Effect in Stock</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <span className="text-sm text-muted-foreground ml-2">
                                    SHOWING 1-{filteredTypes.length} OF {rejectionTypes.length}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PROD REJ TYPE ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PRODUCT REJECTION TYPE DESCRIPTION</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">EFFECT IN STOCK</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEQ NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ACTIVE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTypes.map((type, index) => (
                                            <motion.tr
                                                key={type.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                        {type.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{type.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">{type.description}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 pl-10">
                                                    {type.effectType === "ERROR" ? (
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                            ERROR
                                                        </span>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center -ml-2">
                                                            <Minus className="w-4 h-4 text-red-500" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-foreground ml-4">
                                                        {type.seqNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${type.active
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${type.active ? "bg-green-600" : "bg-red-600"}`} />
                                                        {type.active ? "YES" : "NO"}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>Previous</Button>
                                    <Button variant="outline" size="sm" disabled>Next</Button>
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

            {/* Add Rejection Type Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Rejection Type</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Rejection Type Name <span className="text-red-500">*</span></label>
                                        <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Physical Damage" required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                                        <Input name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. VISIBLE CRACKS OR BREAKS" required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Effect in Stock</label>
                                        <select
                                            name="effectType"
                                            value={formData.effectType}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                        >
                                            <option value="ERROR">ERROR</option>
                                            <option value="SUBTRACT">SUBTRACT (-)</option>
                                        </select>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Active Status</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="active"
                                                    checked={formData.active === true}
                                                    onChange={() => setFormData({ ...formData, active: true })}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm">Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="active"
                                                    checked={formData.active === false}
                                                    onChange={() => setFormData({ ...formData, active: false })}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm">No</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Rejection Type</Button>
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

export default ProductRejectionTypeMaster;
