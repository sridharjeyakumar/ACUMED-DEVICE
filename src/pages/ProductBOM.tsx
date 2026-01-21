import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, FileText, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BOMRecord {
    id: string;
    bomId: string;
    description: string;
    subtitle: string;
    productId: string;
    outputQty: number;
    outputUom: string;
    materialId: string;
    inputQty: number;
    inputUom: string;
}

const ProductBOM = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        bomId: "",
        description: "",
        subtitle: "",
        productId: "",
        outputQty: "",
        outputUom: "",
        materialId: "",
        inputQty: "",
        inputUom: "",
    });

    const records: BOMRecord[] = [
        {
            id: "1",
            bomId: "BOM-ST-001",
            description: "Main Assembly Stent A",
            subtitle: "HIGH PRECISION LINE",
            productId: "PRD-010-ST",
            outputQty: 1000,
            outputUom: "UNITS",
            materialId: "MAT-NT-01",
            inputQty: 12.5,
            inputUom: "KG",
        },
        {
            id: "2",
            bomId: "BOM-CH-042",
            description: "Catheter Coating Phase",
            subtitle: "STERILE CLEAN ROOM 4",
            productId: "PRD-042-CH",
            outputQty: 500,
            outputUom: "UNITS",
            materialId: "MAT-SIL-08",
            inputQty: 2500,
            inputUom: "ML",
        },
        {
            id: "3",
            bomId: "BOM-GW-015",
            description: "Wire Extrusion Master",
            subtitle: "EXTRUSION PLANT A",
            productId: "PRD-015-GW",
            outputQty: 5000,
            outputUom: "MTRS",
            materialId: "MAT-PK-22",
            inputQty: 45.0,
            inputUom: "KG",
        },
        {
            id: "4",
            bomId: "BOM-ST-088",
            description: "Sub-Component Assembly",
            subtitle: "MANUAL INSPECTION",
            productId: "PRD-010-ST",
            outputQty: 100,
            outputUom: "SETS",
            materialId: "MAT-SS-316",
            inputQty: 0.85,
            inputUom: "KG",
        },
        {
            id: "5",
            bomId: "BOM-CH-054",
            description: "Luer Lock Integration",
            subtitle: "COMPONENT FINISHING",
            productId: "PRD-054-CH",
            outputQty: 1000,
            outputUom: "UNITS",
            materialId: "MAT-PL-ABS",
            inputQty: 1050,
            inputUom: "UNITS",
        },
    ];

    const filteredRecords = records.filter((item) =>
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bomId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            bomId: "",
            description: "",
            subtitle: "",
            productId: "",
            outputQty: "",
            outputUom: "",
            materialId: "",
            inputQty: "",
            inputUom: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product BOM</h1>
                                <p className="text-muted-foreground">Manage Bill of Materials definitions and resource mapping</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New BOM
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
                                        placeholder="Search BOM ID or Desc..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors pointer-events-none">
                                        <span className="text-xs font-medium">All Products</span>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors pointer-events-none">
                                        <span className="text-xs font-medium">All Materials</span>
                                        <Filter className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-5 OF 42 RECORDS
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-32">BOM ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BOM DESCRIPTION</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PRODUCT ID</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OUTPUT QTY</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OUTPUT UOM</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MATERIAL ID</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">INPUT QTY</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">INPUT UOM</th>
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
                                                <td className="px-6 py-6 align-top">
                                                    <span className="text-xs font-bold text-blue-600 block mb-1">
                                                        {item.bomId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground mb-1">{item.description}</span>
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{item.subtitle}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 align-top text-center">
                                                    <span className="inline-block bg-blue-50 text-blue-600 font-bold text-[10px] px-2 py-1 rounded border border-blue-100">
                                                        {item.productId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-top">
                                                    {item.outputQty.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="inline-block bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-1 rounded">
                                                        {item.outputUom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="inline-block bg-gray-100 text-gray-600 font-mono text-[10px] px-2 py-1 rounded border border-gray-200">
                                                        {item.materialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-top">
                                                    {item.inputQty}
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="inline-block bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-1 rounded">
                                                        {item.inputUom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New BOM</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">BOM ID <span className="text-red-500">*</span></label>
                                            <Input name="bomId" value={formData.bomId} onChange={handleInputChange} placeholder="BOM-XXX-XX" required />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                                            <Input name="description" value={formData.description} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Line / Subtitle</label>
                                        <Input name="subtitle" value={formData.subtitle} onChange={handleInputChange} placeholder="e.g. HIGH PRECISION LINE" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-2">
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">Output Configuration</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID</label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="PRD-XXX-XX" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Output Qty</label>
                                                <Input type="number" name="outputQty" value={formData.outputQty} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">UOM</label>
                                                <Input name="outputUom" value={formData.outputUom} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 mt-4">
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 border-b pb-1">Input Material Mapping</h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Material ID</label>
                                            <Input name="materialId" value={formData.materialId} onChange={handleInputChange} placeholder="MAT-XXX-XX" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">Input Qty</label>
                                                <Input type="number" name="inputQty" value={formData.inputQty} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">UOM</label>
                                                <Input name="inputUom" value={formData.inputUom} onChange={handleInputChange} />
                                            </div>
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

export default ProductBOM;
