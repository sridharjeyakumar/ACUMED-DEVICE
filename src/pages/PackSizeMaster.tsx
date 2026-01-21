import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, Box, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface PackSizeRecord {
    id: string;
    packSizeId: string;
    packSizeName: string;
    division: string;
    shortName: string;
    qtyPerCarton: number;
}

const PackSizeMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        packSizeId: "",
        packSizeName: "",
        division: "",
        shortName: "",
        qtyPerCarton: "",
    });

    const packSizes: PackSizeRecord[] = [
        {
            id: "1",
            packSizeId: "PS-100X",
            packSizeName: "Standard 100 Unit Retail Pack",
            division: "DIVISION: CONSUMER MEDICAL",
            shortName: "ST-100-RP",
            qtyPerCarton: 24,
        },
        {
            id: "2",
            packSizeId: "PS-050B",
            packSizeName: "Bulk Hospital 50 Pack",
            division: "DIVISION: CLINICAL SUPPLIES",
            shortName: "HOSP-50-BLK",
            qtyPerCarton: 12,
        },
        {
            id: "3",
            packSizeId: "PS-010S",
            packSizeName: "Physician Sample 10 Pack",
            division: "DIVISION: MARKETING",
            shortName: "SMP-10-PHY",
            qtyPerCarton: 50,
        },
        {
            id: "4",
            packSizeId: "PS-250E",
            packSizeName: "Export Large 250 Unit Pack",
            division: "DIVISION: INTERNATIONAL",
            shortName: "EXP-250-LRG",
            qtyPerCarton: 8,
        },
        {
            id: "5",
            packSizeId: "PS-001U",
            packSizeName: "Single Unit Sterile Pack",
            division: "DIVISION: SURGICAL DEVICES",
            shortName: "SNG-01-STR",
            qtyPerCarton: 100,
        },
    ];

    const filteredPackSizes = packSizes.filter((item) =>
        item.packSizeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packSizeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            packSizeId: "",
            packSizeName: "",
            division: "",
            shortName: "",
            qtyPerCarton: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Pack Size Master</h1>
                                <p className="text-muted-foreground">Define and manage packaging configurations and carton quantities</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Pack Size
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
                                <div className="flex-1 relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Pack Size ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors w-40 justify-between">
                                        <span className="text-sm font-medium">All Categories</span>
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-5 OF 18 PACK SIZES
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PACK SIZE ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PACK SIZE NAME</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PACK SHORT NAME</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">QTY PER CARTON</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredPackSizes.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-6 text-sm font-bold text-blue-600 align-middle">
                                                    {item.packSizeId}
                                                </td>
                                                <td className="px-6 py-6 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground mb-1">{item.packSizeName}</span>
                                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{item.division}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                    {item.shortName}
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-middle">
                                                    {item.qtyPerCarton}
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
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 4</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs">Previous</Button>
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
                                    <h2 className="text-2xl font-bold">Add New Pack Size</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID <span className="text-red-500">*</span></label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="PS-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Short Name</label>
                                            <Input name="shortName" value={formData.shortName} onChange={handleInputChange} placeholder="SHORT-CODE" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Pack Size Name <span className="text-red-500">*</span></label>
                                        <Input name="packSizeName" value={formData.packSizeName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Division</label>
                                        <Input name="division" value={formData.division} onChange={handleInputChange} placeholder="e.g. DIVISION: CONSUMER MEDICAL" />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Qty Per Carton <span className="text-red-500">*</span></label>
                                        <Input type="number" name="qtyPerCarton" value={formData.qtyPerCarton} onChange={handleInputChange} required />
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

export default PackSizeMaster;
