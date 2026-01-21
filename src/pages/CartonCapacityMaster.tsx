import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, Archive, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface CartonCapacityRecord {
    id: string;
    capacityId: string;
    capacityName: string;
    subtitle: string;
    shortName: string;
    packSizeId: string;
    materialId: string;
    packsPerCarton: number;
}

const CartonCapacityMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        capacityId: "",
        capacityName: "",
        subtitle: "",
        shortName: "",
        packSizeId: "",
        materialId: "",
        packsPerCarton: "",
    });

    const records: CartonCapacityRecord[] = [
        {
            id: "1",
            capacityId: "CAP-STD-001",
            capacityName: "Standard Export Bulk",
            subtitle: "PRIMARY PACKAGING LINE",
            shortName: "STD-BLK-500",
            packSizeId: "PS-010",
            materialId: "MAT-SS-316",
            packsPerCarton: 500,
        },
        {
            id: "2",
            capacityId: "CAP-MED-042",
            capacityName: "Medium Retail Shipper",
            subtitle: "SECONDARY DISTRIBUTION",
            shortName: "MED-RET-200",
            packSizeId: "PS-025",
            materialId: "MAT-PP-CLR",
            packsPerCarton: 200,
        },
        {
            id: "3",
            capacityId: "CAP-LRG-015",
            capacityName: "Large Hospital Pack",
            subtitle: "DIRECT HOSPITAL SUPPLY",
            shortName: "LRG-HSP-100",
            packSizeId: "PS-050",
            materialId: "MAT-GL-TY1",
            packsPerCarton: 100,
        },
        {
            id: "4",
            capacityId: "CAP-SML-088",
            capacityName: "Small Component Tray",
            subtitle: "COMPONENT STORAGE",
            shortName: "SML-CMP-1000",
            packSizeId: "PS-001",
            materialId: "MAT-AL-01",
            packsPerCarton: 1000,
        },
        {
            id: "5",
            capacityId: "CAP-INT-054",
            capacityName: "International Pouch Pack",
            subtitle: "AIR FREIGHT OPTIMAL",
            shortName: "INT-PCH-250",
            packSizeId: "PS-025",
            materialId: "MAT-TYV-90",
            packsPerCarton: 250,
        },
    ];

    const filteredRecords = records.filter((item) =>
        item.capacityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.capacityId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            capacityId: "",
            capacityName: "",
            subtitle: "",
            shortName: "",
            packSizeId: "",
            materialId: "",
            packsPerCarton: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Carton Capacity Master</h1>
                                <p className="text-muted-foreground">Manage packaging capacity rules and pack-per-carton configurations</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Carton Capacity
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
                                        placeholder="Search Capacity ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors pointer-events-none">
                                        <span className="text-xs font-medium">All Pack Sizes</span>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors pointer-events-none">
                                        <span className="text-xs font-medium">All Materials</span>
                                        <Filter className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-5 OF 24 CONFIGURATIONS
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CARTON CAPACITY ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CARTON CAPACITY NAME</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CARTON CAPACITY SHORTNAME</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PACK SIZE ID</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MATERIAL ID</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PACKS PER CARTON</th>
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
                                                <td className="px-6 py-6 text-sm font-bold text-blue-600 align-middle">
                                                    {item.capacityId}
                                                </td>
                                                <td className="px-6 py-6 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground mb-1">{item.capacityName}</span>
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{item.subtitle}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                    {item.shortName}
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="inline-block bg-gray-100 text-gray-600 font-mono text-xs px-2 py-1 rounded">
                                                        {item.packSizeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="inline-block bg-gray-100 text-gray-600 font-mono text-xs px-2 py-1 rounded">
                                                        {item.materialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="inline-block bg-blue-50 text-blue-600 font-bold text-xs px-3 py-1 rounded-full border border-blue-100">
                                                        {item.packsPerCarton}
                                                    </span>
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
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 5</span>
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
                                    <h2 className="text-2xl font-bold">Add New Carton Capacity</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Capacity ID <span className="text-red-500">*</span></label>
                                            <Input name="capacityId" value={formData.capacityId} onChange={handleInputChange} placeholder="CAP-XXX-XX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Short Name</label>
                                            <Input name="shortName" value={formData.shortName} onChange={handleInputChange} placeholder="SHORT-CODE" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Capacity Name <span className="text-red-500">*</span></label>
                                        <Input name="capacityName" value={formData.capacityName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Description / Subtitle</label>
                                        <Input name="subtitle" value={formData.subtitle} onChange={handleInputChange} placeholder="e.g. PRIMARY PACKAGING LINE" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID</label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="PS-XXX" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Material ID</label>
                                            <Input name="materialId" value={formData.materialId} onChange={handleInputChange} placeholder="MAT-XXX-XXX" />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Packs Per Carton <span className="text-red-500">*</span></label>
                                        <Input type="number" name="packsPerCarton" value={formData.packsPerCarton} onChange={handleInputChange} required />
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

export default CartonCapacityMaster;
