import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, Trash2, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BinRecord {
    id: string;
    binId: string;
    binName: string;
    location: string;
    shortName: string;
    binType: "HAZARDOUS" | "RECYCLABLE" | "SCRAP" | "REWORK" | "GENERAL";
    colorName: string;
    colorHex: string;
    tareWeight: number;
    capacity: number;
}

const CollectionBinMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        binId: "",
        binName: "",
        location: "",
        shortName: "",
        binType: "GENERAL",
        colorName: "",
        colorHex: "#000000",
        tareWeight: "",
        capacity: "",
    });

    const records: BinRecord[] = [
        {
            id: "1",
            binId: "BIN-HZM-01",
            binName: "Hazardous Medical Bin",
            location: "SECTION A-4 FLOOR",
            shortName: "HZM01",
            binType: "HAZARDOUS",
            colorName: "Signal Red",
            colorHex: "#EF4444", // Red-500
            tareWeight: 2.50,
            capacity: 25.00,
        },
        {
            id: "2",
            binId: "BIN-REC-02",
            binName: "Plastic Recyclable",
            location: "LOADING DOCK",
            shortName: "REC02",
            binType: "RECYCLABLE",
            colorName: "Deep Blue",
            colorHex: "#3B82F6", // Blue-500
            tareWeight: 1.80,
            capacity: 15.00,
        },
        {
            id: "3",
            binId: "BIN-SCR-05",
            binName: "Metal Scrap Container",
            location: "MAIN ASSEMBLY",
            shortName: "SCR05",
            binType: "SCRAP",
            colorName: "Graphite Gray",
            colorHex: "#6B7280", // Gray-500
            tareWeight: 5.20,
            capacity: 50.00,
        },
        {
            id: "4",
            binId: "BIN-REW-09",
            binName: "Rework Station Box",
            location: "QC LAB ENTRY",
            shortName: "REW09",
            binType: "REWORK",
            colorName: "Caution Yellow",
            colorHex: "#EAB308", // Yellow-500
            tareWeight: 1.20,
            capacity: 10.00,
        },
        {
            id: "5",
            binId: "BIN-GEN-04",
            binName: "General Purpose Bin",
            location: "STAFF LOUNGE",
            shortName: "GEN04",
            binType: "GENERAL",
            colorName: "Emerald Green",
            colorHex: "#10B981", // Green-500
            tareWeight: 2.10,
            capacity: 30.00,
        },
    ];

    const filteredRecords = records.filter((item) =>
        item.binName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.binId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBadgeStyle = (type: string) => {
        switch (type) {
            case "HAZARDOUS": return "bg-red-50 text-red-600 border-red-100";
            case "RECYCLABLE": return "bg-green-50 text-green-600 border-green-100";
            case "SCRAP": return "bg-gray-100 text-gray-600 border-gray-200";
            case "REWORK": return "bg-yellow-50 text-yellow-600 border-yellow-100";
            case "GENERAL": return "bg-blue-50 text-blue-600 border-blue-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            binId: "",
            binName: "",
            location: "",
            shortName: "",
            binType: "GENERAL",
            colorName: "",
            colorHex: "#000000",
            tareWeight: "",
            capacity: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Collection Bin Master</h1>
                                <p className="text-muted-foreground">Manage and configure collection bins for waste and byproduct management</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Bin
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
                                        placeholder="Search Bin ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors pointer-events-none w-40 justify-between">
                                        <span className="text-sm font-medium">All Bin Types</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-5 OF 12 RECORDS
                                </span>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <div className="space-y-1">
                                            <div className="w-4 h-0.5 bg-current"></div>
                                            <div className="w-3 h-0.5 bg-current ml-auto"></div>
                                            <div className="w-2 h-0.5 bg-current ml-auto"></div>
                                        </div>
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BIN ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BIN NAME</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BIN SHORT NAME</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BIN TYPE</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">COLOR</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TARE WEIGHT (KG)</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CAPACITY (KG)</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredRecords.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-6 align-middle">
                                                    <span className="text-xs font-bold text-blue-600 block mb-1">
                                                        {item.binId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground mb-1">{item.binName}</span>
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{item.location}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="inline-block bg-gray-100 text-gray-700 font-bold text-[10px] px-2 py-1 rounded">
                                                        {item.shortName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className={`inline-block font-bold text-[10px] px-2 py-1 rounded border ${getBadgeStyle(item.binType)}`}>
                                                        {item.binType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-medium text-foreground align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full border border-black/10"
                                                            style={{ backgroundColor: item.colorHex }}
                                                        ></div>
                                                        <span className="text-xs">{item.colorName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-middle">
                                                    {item.tareWeight.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-middle">
                                                    {item.capacity.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 3</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-muted-foreground">Previous</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 bg-blue-50">Next</Button>
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
                            Real-time Data Sync • ACUMED Manufacturing Cloud v4.2
                        </p>
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Bin</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Bin ID <span className="text-red-500">*</span></label>
                                            <Input name="binId" value={formData.binId} onChange={handleInputChange} placeholder="BIN-XXX-XX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Short Name</label>
                                            <Input name="shortName" value={formData.shortName} onChange={handleInputChange} placeholder="SHORT-CODE" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Bin Name <span className="text-red-500">*</span></label>
                                        <Input name="binName" value={formData.binName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Location / Section</label>
                                        <Input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. SECTION A-4 FLOOR" />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Bin Type</label>
                                        <select
                                            name="binType"
                                            value={formData.binType}
                                            onChange={handleInputChange}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="GENERAL">General</option>
                                            <option value="HAZARDOUS">Hazardous</option>
                                            <option value="RECYCLABLE">Recyclable</option>
                                            <option value="SCRAP">Scrap</option>
                                            <option value="REWORK">Rework</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Color Name</label>
                                            <Input name="colorName" value={formData.colorName} onChange={handleInputChange} placeholder="Color Name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Color Hex</label>
                                            <div className="flex gap-2">
                                                <Input type="color" name="colorHex" value={formData.colorHex} onChange={handleInputChange} className="w-12 p-1" />
                                                <Input name="colorHex" value={formData.colorHex} onChange={handleInputChange} placeholder="#000000" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Tare Weight (KG)</label>
                                            <Input type="number" step="0.01" name="tareWeight" value={formData.tareWeight} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Capacity (KG)</label>
                                            <Input type="number" step="0.01" name="capacity" value={formData.capacity} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save</Button>
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

export default CollectionBinMaster;
