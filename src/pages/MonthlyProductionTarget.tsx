import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Calendar, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductionTarget {
    id: string;
    monthYear: string;
    batchNo: string;
    productId: string;
    productName: string;
    packSizeId: string;
    targetQty: number;
    actualQty: number;
    remarks: string;
    finalRemarks: string;
}

const MonthlyProductionTarget = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        monthYear: "",
        batchNo: "",
        productId: "",
        packSizeId: "",
        targetQty: "",
        remarks: "",
    });

    const targets: ProductionTarget[] = [
        {
            id: "1",
            monthYear: "202312",
            batchNo: "BT-2023-001",
            productId: "ST-A200",
            productName: "STENT A-SERIES",
            packSizeId: "PK-10-UNIT",
            targetQty: 5000,
            actualQty: 5050,
            remarks: "Standard batch",
            finalRemarks: "Exceeded target by 1%",
        },
        {
            id: "2",
            monthYear: "202312",
            batchNo: "BT-2023-002",
            productId: "CT-G005",
            productName: "CATHETER G-SERIES",
            packSizeId: "PK-25-UNIT",
            targetQty: 2500,
            actualQty: 2100,
            remarks: "Raw material delay",
            finalRemarks: "Pending completion",
        },
        {
            id: "3",
            monthYear: "202312",
            batchNo: "BT-2023-003",
            productId: "VL-M010",
            productName: "VALVE M-SERIES",
            packSizeId: "PK-05-UNIT",
            targetQty: 1200,
            actualQty: 1200,
            remarks: "Holiday schedule",
            finalRemarks: "Target met exactly",
        },
        {
            id: "4",
            monthYear: "202311",
            batchNo: "BT-2023-098",
            productId: "ST-A200",
            productName: "STENT A-SERIES",
            packSizeId: "PK-10-UNIT",
            targetQty: 4500,
            actualQty: 4500,
            remarks: "Full capacity",
            finalRemarks: "Closed batch",
        },
    ];

    const filteredTargets = targets.filter((target) =>
        target.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        target.productId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
            monthYear: "",
            batchNo: "",
            productId: "",
            packSizeId: "",
            targetQty: "",
            remarks: "",
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const getActualQtyColor = (actual: number, target: number) => {
        if (actual >= target) return "text-green-600";
        if (actual < target) return "text-orange-500";
        return "text-foreground";
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Monthly Production Target</h1>
                                <p className="text-muted-foreground">Define and track monthly manufacturing targets against actual production</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add Target
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
                                        placeholder="Search Batch or Product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>

                                {/* Month Year Filter */}
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                        <span className="text-sm font-medium">Month Year (All)</span>
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Product Filter */}
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-40 justify-between">
                                        <span className="text-sm font-medium">All Products</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredTargets.length} OF {targets.length}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">MONTH YEAR</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PRODUCT ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PACK SIZE ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">TARGET QTY</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ACTUAL QTY</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">REMARKS</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">FINAL REMARKS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTargets.map((target, index) => (
                                            <motion.tr
                                                key={target.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {target.monthYear}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">
                                                        {target.batchNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{target.productId}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{target.productName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {target.packSizeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {formatNumber(target.targetQty)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${getActualQtyColor(target.actualQty, target.targetQty)}`}>
                                                        {formatNumber(target.actualQty)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground italic">
                                                        {target.remarks}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {target.finalRemarks}
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
                                    <Button variant="outline" size="sm" disabled>
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" disabled>
                                        Next
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

            {/* Add Target Modal */}
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
                                    <h2 className="text-2xl font-bold">Add Target</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Month Year <span className="text-red-500">*</span></label>
                                            <Input name="monthYear" value={formData.monthYear} onChange={handleInputChange} placeholder="YYYYMM" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-YYYY-XXX" required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID <span className="text-red-500">*</span></label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="Select Pack Size" required />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Target Quantity <span className="text-red-500">*</span></label>
                                        <Input type="number" name="targetQty" value={formData.targetQty} onChange={handleInputChange} placeholder="0" required />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                        <textarea
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Optional remarks..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Target</Button>
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

export default MonthlyProductionTarget;
