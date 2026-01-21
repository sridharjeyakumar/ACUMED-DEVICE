import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, TrendingUp, ChevronDown, Calendar, Download } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";

interface MovementRecord {
    id: string;
    batchNo: string;
    date: string;
    productId: string;
    productName: string;
    packSizeId: string;
    cartonCapacityId: string;
    noOfCartons: number;
}

const ProductMovement = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        batchNo: "",
        date: "",
        productId: "",
        packSizeId: "",
        cartonCapacityId: "",
        noOfCartons: "",
    });

    const records: MovementRecord[] = [
        {
            id: "1",
            batchNo: "BT-2023-088",
            date: "2023-12-05",
            productId: "ST-A200",
            productName: "STENT A-SERIES",
            packSizeId: "PK-10-ST",
            cartonCapacityId: "CC-50-STD",
            noOfCartons: 12,
        },
        {
            id: "2",
            batchNo: "BT-2023-089",
            date: "2023-12-05",
            productId: "CT-G005",
            productName: "CATHETER G-SERIES",
            packSizeId: "PK-05-CT",
            cartonCapacityId: "CC-20-MIN",
            noOfCartons: 15,
        },
        {
            id: "3",
            batchNo: "BT-2023-090",
            date: "2023-12-04",
            productId: "VL-M010",
            productName: "VALVE M-SERIES",
            packSizeId: "PK-01-VL",
            cartonCapacityId: "CC-100-MAX",
            noOfCartons: 8,
        },
        {
            id: "4",
            batchNo: "BT-2023-091",
            date: "2023-12-04",
            productId: "ST-A200",
            productName: "STENT A-SERIES",
            packSizeId: "PK-10-ST",
            cartonCapacityId: "CC-50-STD",
            noOfCartons: 20,
        },
    ];

    const filteredRecords = records.filter((record) =>
        record.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.productId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
            batchNo: "",
            date: "",
            productId: "",
            packSizeId: "",
            cartonCapacityId: "",
            noOfCartons: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product Movement</h1>
                                <p className="text-muted-foreground">Monitor and manage the internal movement of finished goods</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add Movement
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    {/* Search and Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6"
                    >
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch No..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-40 justify-between">
                                        <span className="text-sm text-muted-foreground">mm/dd/yyyy</span>
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-48 justify-between">
                                        <span className="text-sm font-medium">Filter by Product ID</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-sm text-muted-foreground uppercase">
                                    results: {filteredRecords.length} records
                                </span>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <Download className="w-4 h-4" />
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DATE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PRODUCT ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PACK SIZE ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CARTON CAPACITY ID</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">NO. OF CARTONS</th>
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
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">
                                                        {record.batchNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {record.date}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{record.productId}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{record.productName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {record.packSizeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {record.cartonCapacityId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {record.noOfCartons}
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

            {/* Add Movement Modal */}
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
                                    <h2 className="text-2xl font-bold">Add Product Movement</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                        <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-2023-XXX" required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Date <span className="text-red-500">*</span></label>
                                        <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                        <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID</label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="PK-XX-XX" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity ID</label>
                                            <Input name="cartonCapacityId" value={formData.cartonCapacityId} onChange={handleInputChange} placeholder="CC-XX-XX" />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">No. of Cartons</label>
                                        <Input type="number" name="noOfCartons" value={formData.noOfCartons} onChange={handleInputChange} placeholder="0" />
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Movement</Button>
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

export default ProductMovement;
