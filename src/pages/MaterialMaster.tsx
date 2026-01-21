import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, ChevronDown, LayoutGrid, ToggleLeft } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MaterialRecord {
    id: string;
    materialId: string;
    materialName: string;
    shortName: string;
    type: "Raw Material" | "Packaging";
    uom: string;
    minStock: number;
    reOrder: number;
    safety: number;
    minOrd: number;
    ltMin: number;
    ltMax: number;
}

const MaterialMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        materialId: "",
        materialName: "",
        shortName: "",
        type: "Raw Material" as "Raw Material" | "Packaging",
        uom: "",
        minStock: "",
        reOrder: "",
        safety: "",
        minOrd: "",
        ltMin: "",
        ltMax: "",
    });

    const materials: MaterialRecord[] = [
        {
            id: "1",
            materialId: "MAT-RM-001",
            materialName: "Polypropylene Resin Grade A",
            shortName: "PP-G1-RESIN",
            type: "Raw Material",
            uom: "KGs",
            minStock: 500,
            reOrder: 750,
            safety: 200,
            minOrd: 1000,
            ltMin: 5,
            ltMax: 10,
        },
        {
            id: "2",
            materialId: "MAT-PK-042",
            materialName: "Sterile Barrier Film 400mm",
            shortName: "ST-FILM-400",
            type: "Packaging",
            uom: "Roll",
            minStock: 50,
            reOrder: 100,
            safety: 25,
            minOrd: 20,
            ltMin: 14,
            ltMax: 21,
        },
        {
            id: "3",
            materialId: "MAT-RM-089",
            materialName: "Titanium Rod Gr. 5 12mm",
            shortName: "TI-RD-12MM",
            type: "Raw Material",
            uom: "Meters",
            minStock: 100,
            reOrder: 150,
            safety: 50,
            minOrd: 300,
            ltMin: 30,
            ltMax: 45,
        },
        {
            id: "4",
            materialId: "MAT-PK-102",
            materialName: "Outer Carton BX-442",
            shortName: "BX-442-OUT",
            type: "Packaging",
            uom: "Unit",
            minStock: 2000,
            reOrder: 3000,
            safety: 500,
            minOrd: 5000,
            ltMin: 7,
            ltMax: 10,
        },
    ];

    const filteredMaterials = materials.filter((material) =>
        material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.materialId.toLowerCase().includes(searchQuery.toLowerCase())
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
            materialId: "",
            materialName: "",
            shortName: "",
            type: "Raw Material",
            uom: "",
            minStock: "",
            reOrder: "",
            safety: "",
            minOrd: "",
            ltMin: "",
            ltMax: "",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Material Master</h1>
                                <p className="text-muted-foreground">Manage and configure raw material specifications and inventory parameters</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Material
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
                                        placeholder="Search Materials..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <span className="text-sm font-medium">Material Type</span>
                                        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <span className="text-sm font-medium">Status</span>
                                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-12 OF 84
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MATERIAL ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MATERIAL NAME</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SHORTNAME</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TYPE</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UOM</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">MIN STOCK</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">RE-ORDER</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">SAFETY</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">MIN ORD</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">LT MIN</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">LT MAX</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredMaterials.map((material, index) => (
                                            <motion.tr
                                                key={material.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                                                        {material.materialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {material.materialName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs text-muted-foreground uppercase">
                                                        {material.shortName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-medium leading-tight ${material.type === "Raw Material"
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "bg-purple-50 text-purple-700"
                                                        }`}>
                                                        {material.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs text-foreground">
                                                        {material.uom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs text-foreground font-medium">{material.minStock}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    {/* Applying conditional styling as per mockup hint (red text) */}
                                                    <span className={`text-xs font-medium ${material.reOrder > 700 ? 'text-red-500' : 'text-foreground'}`}>
                                                        {material.reOrder}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs text-foreground font-medium">{material.safety}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs text-foreground font-medium">{material.minOrd}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs text-muted-foreground">{material.ltMin}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs text-muted-foreground">{material.ltMax}</span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SHOWING 4 OF 84 MATERIALS</span>
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
                            Real-time Data Sync • ACUMED DEVICES Manufacturing Cloud v4.2
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* Add Material Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Material</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Material ID <span className="text-red-500">*</span></label>
                                            <Input name="materialId" value={formData.materialId} onChange={handleInputChange} placeholder="MAT-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Material Name <span className="text-red-500">*</span></label>
                                            <Input name="materialName" value={formData.materialName} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Short Name</label>
                                            <Input name="shortName" value={formData.shortName} onChange={handleInputChange} placeholder="SHORT-NAME" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Material Type</label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="Raw Material">Raw Material</option>
                                                <option value="Packaging">Packaging</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">UOM</label>
                                        <Input name="uom" value={formData.uom} onChange={handleInputChange} placeholder="KGs, Roll, etc." />
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">Min Stock</label>
                                            <Input type="number" name="minStock" value={formData.minStock} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">Re-Order</label>
                                            <Input type="number" name="reOrder" value={formData.reOrder} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">Safety</label>
                                            <Input type="number" name="safety" value={formData.safety} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">Min Ord</label>
                                            <Input type="number" name="minOrd" value={formData.minOrd} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Lead Time Min (Days)</label>
                                            <Input type="number" name="ltMin" value={formData.ltMin} onChange={handleInputChange} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Lead Time Max (Days)</label>
                                            <Input type="number" name="ltMax" value={formData.ltMax} onChange={handleInputChange} placeholder="0" />
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

export default MaterialMaster;
