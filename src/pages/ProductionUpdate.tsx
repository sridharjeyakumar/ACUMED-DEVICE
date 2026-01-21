import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Settings2, Download, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductionUpdateRecord {
    id: string;
    batchNo: string;
    date: string;
    machineId: string;
    productId: string;
    binNo: string;
    tareWeight: number;
    grossWeight: number;
    netWeight: number;
    calcQty: number;
    countQty: number;
    status: "COMPLETED" | "IN PROGRESS";
    remarks: string;
}

const ProductionUpdate = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        batchNo: "",
        date: "",
        machineId: "",
        productId: "",
        binNo: "",
        tareWeight: "",
        grossWeight: "",
        countQty: "",
        status: "IN PROGRESS" as "COMPLETED" | "IN PROGRESS",
        remarks: "",
    });

    const records: ProductionUpdateRecord[] = [
        {
            id: "1",
            batchNo: "BT-2023-001",
            date: "12/10/23",
            machineId: "MCH-001",
            productId: "ST-A200",
            binNo: "BIN-A12",
            tareWeight: 1.25,
            grossWeight: 12.50,
            netWeight: 11.25,
            calcQty: 450,
            countQty: 452,
            status: "COMPLETED",
            remarks: "Shift A Morning",
        },
        {
            id: "2",
            batchNo: "BT-2023-002",
            date: "12/10/23",
            machineId: "MCH-042",
            productId: "CT-G005",
            binNo: "BIN-C08",
            tareWeight: 1.25,
            grossWeight: 8.75,
            netWeight: 7.50,
            calcQty: 1200,
            countQty: 1180,
            status: "IN PROGRESS",
            remarks: "Partial collection",
        },
        {
            id: "3",
            batchNo: "BT-2023-003",
            date: "12/10/23",
            machineId: "MCH-001",
            productId: "ST-A200",
            binNo: "BIN-A14",
            tareWeight: 1.25,
            grossWeight: 13.25,
            netWeight: 12.00,
            calcQty: 480,
            countQty: 480,
            status: "COMPLETED",
            remarks: "Clean run",
        },
    ];

    const filteredRecords = records.filter((record) =>
        record.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.productId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateNet = () => {
        const gross = parseFloat(formData.grossWeight) || 0;
        const tare = parseFloat(formData.tareWeight) || 0;
        return (gross - tare).toFixed(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
            batchNo: "",
            date: "",
            machineId: "",
            productId: "",
            binNo: "",
            tareWeight: "",
            grossWeight: "",
            countQty: "",
            status: "IN PROGRESS",
            remarks: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Production Update</h1>
                                <p className="text-muted-foreground">Record and update daily production outputs for manufacturing batches</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add Production Update
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
                                <div className="flex-1 relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch, Machine or Product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-40 justify-between">
                                        <span className="text-sm font-medium">All Machines</span>
                                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredRecords.length} OF {records.length}
                                </span>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
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
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">DATE</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">MACHINE ID</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PRODUCT ID</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">BIN NO.</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TARE (KGS)</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">GROSS (KGS)</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">NET (KGS)</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CALC QTY</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">COUNT QTY</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">STATUS</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">REMARKS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredRecords.map((record, index) => (
                                            <motion.tr
                                                key={record.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                                                        {record.batchNo}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.date}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.machineId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {record.productId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.binNo}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.tareWeight.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.grossWeight.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {record.netWeight.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {record.calcQty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-xs font-bold ${record.countQty >= record.calcQty ? "text-green-600" : "text-orange-500"
                                                        }`}>
                                                        {record.countQty.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${record.status === "COMPLETED"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-blue-100 text-blue-700"
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.remarks}
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

            {/* Add Update Modal */}
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
                                    <h2 className="text-2xl font-bold">Add Production Update</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-2023-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Date <span className="text-red-500">*</span></label>
                                            <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Machine ID <span className="text-red-500">*</span></label>
                                            <Input name="machineId" value={formData.machineId} onChange={handleInputChange} placeholder="MCH-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Bin No.</label>
                                        <Input name="binNo" value={formData.binNo} onChange={handleInputChange} placeholder="BIN-XXX" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Tare (Kgs)</label>
                                            <Input type="number" step="0.01" name="tareWeight" value={formData.tareWeight} onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Gross (Kgs)</label>
                                            <Input type="number" step="0.01" name="grossWeight" value={formData.grossWeight} onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Net (Kgs)</label>
                                            <div className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground font-bold">
                                                {calculateNet()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Count Qty</label>
                                            <Input type="number" name="countQty" value={formData.countQty} onChange={handleInputChange} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="IN PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                        <Input name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Notes..." />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Update</Button>
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

export default ProductionUpdate;
