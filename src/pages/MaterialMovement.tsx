import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, PackageOpen, ChevronDown, Calendar, Download } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";

interface MaterialMovementRecord {
    id: string;
    materialId: string;
    materialName: string;
    movementType: "ISSUE" | "RETURN" | "TRANSFER";
    date: string;
    qty: number;
    uom: string;
    rollNo: string;
    batchNo: string;
}

const MaterialMovement = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        materialId: "",
        movementType: "ISSUE" as "ISSUE" | "RETURN" | "TRANSFER",
        date: "",
        qty: "",
        uom: "",
        rollNo: "",
        batchNo: "",
    });

    const records: MaterialMovementRecord[] = [
        {
            id: "1",
            materialId: "MAT-PVC-001",
            materialName: "MEDICAL GRADE PVC SHEET",
            movementType: "ISSUE",
            date: "2023-12-06",
            qty: 250.00,
            uom: "Meters",
            rollNo: "R-23441",
            batchNo: "B-PVC-1205",
        },
        {
            id: "2",
            materialId: "MAT-AD-042",
            materialName: "BIOCOMPATIBLE ADHESIVE",
            movementType: "RETURN",
            date: "2023-12-06",
            qty: 15.50,
            uom: "Litres",
            rollNo: "N/A",
            batchNo: "B-ADH-1100",
        },
        {
            id: "3",
            materialId: "MAT-STL-200",
            materialName: "SS-316 WIRE ROLL",
            movementType: "TRANSFER",
            date: "2023-12-05",
            qty: 1.00,
            uom: "Roll",
            rollNo: "ST-8890",
            batchNo: "B-STL-002",
        },
        {
            id: "4",
            materialId: "MAT-PAC-009",
            materialName: "TYVEK POUCH ROLL",
            movementType: "ISSUE",
            date: "2023-12-05",
            qty: 500.00,
            uom: "Meters",
            rollNo: "TV-4421",
            batchNo: "B-TVK-1223",
        },
    ];

    const filteredRecords = records.filter((record) =>
        record.materialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.materialName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            materialId: "",
            movementType: "ISSUE",
            date: "",
            qty: "",
            uom: "",
            rollNo: "",
            batchNo: "",
        });
    };

    const getBadgeStyles = (type: string) => {
        switch (type) {
            case "ISSUE":
                return "bg-blue-100 text-blue-700";
            case "RETURN":
                return "bg-green-100 text-green-700";
            case "TRANSFER":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Material Movement</h1>
                                <p className="text-muted-foreground">Track and record internal movement of raw materials and consumables</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add Material Movement
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
                                <div className="flex-1 relative max-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Material..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>

                                <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">DATE RANGE:</span>

                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-40 justify-between">
                                            <span className="text-sm text-muted-foreground">mm/dd/yyyy</span>
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <span className="text-sm text-muted-foreground">to</span>
                                    <div className="relative">
                                        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-40 justify-between">
                                            <span className="text-sm text-muted-foreground">mm/dd/yyyy</span>
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>

                                <div className="relative ml-2">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors w-40 justify-between">
                                        <span className="text-sm font-medium">Movement Type</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">
                                    RESULTS: {filteredRecords.length} RECORDS
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MATERIAL ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MOVEMENT TYPE</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DATE</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">QTY</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UOM</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ROLL NO.</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
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
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{record.materialId}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{record.materialName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getBadgeStyles(record.movementType)}`}>
                                                        {record.movementType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium text-foreground">
                                                        {record.date}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-blue-600">
                                                        {record.qty.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.uom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.rollNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {record.batchNo}
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
                                    <h2 className="text-2xl font-bold">Add Material Movement</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Movement Type</label>
                                            <select
                                                name="movementType"
                                                value={formData.movementType}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="ISSUE">ISSUE</option>
                                                <option value="RETURN">RETURN</option>
                                                <option value="TRANSFER">TRANSFER</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Date <span className="text-red-500">*</span></label>
                                            <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Material ID <span className="text-red-500">*</span></label>
                                        <Input name="materialId" value={formData.materialId} onChange={handleInputChange} placeholder="Select Material" required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Quantity <span className="text-red-500">*</span></label>
                                            <Input type="number" step="0.01" name="qty" value={formData.qty} onChange={handleInputChange} placeholder="0.00" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">UOM</label>
                                            <Input name="uom" value={formData.uom} onChange={handleInputChange} placeholder="e.g. Kg, Meters" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Roll No.</label>
                                            <Input name="rollNo" value={formData.rollNo} onChange={handleInputChange} placeholder="Optional" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No.</label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="Optional" />
                                        </div>
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

export default MaterialMovement;
