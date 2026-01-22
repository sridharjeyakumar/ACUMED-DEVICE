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
    type: string;
    uom: string;
    minStock: number | string;
    reOrder: number | string;
    safety: number | string;
    minOrd: number | string;
    ltMin: number | string;
    ltMax: number | string;
    active: string;
    kgsPerRoll: string;
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
        { id: "1", materialId: "PM-001", materialName: "Spunlace Nonwoven Fabric (65mm)", shortName: "Fabric (65mm)", type: "RM", uom: "KG", minStock: 1000, reOrder: 25, safety: "", minOrd: 1000, ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "2", materialId: "HM002", materialName: "Duvet Flexible Laminate", shortName: "Laminate Duvet", type: "RM", uom: "KG", minStock: 1000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "3", materialId: "PM-001", materialName: "Duvet Packing Carton - 24 pack", shortName: "Duvet 24s Pack", type: "PM", uom: "NOS", minStock: 100000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "4", materialId: "PM-002", materialName: "Duvet Packing Carton - 12 pack", shortName: "Duvet 12s Pack", type: "PM", uom: "NOS", minStock: 100000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "5", materialId: "PM-003", materialName: "Duvet Packing Carton - 6 pack", shortName: "Duvet 6s Pack", type: "PM", uom: "NOS", minStock: 100000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "6", materialId: "PM-014", materialName: "Sterilization Carton - Duvet", shortName: "", type: "PM", uom: "NOS", minStock: 25000, reOrder: "", safety: "", minOrd: "", ltMin: 7, ltMax: 10, active: "TRUE", kgsPerRoll: "" },
        { id: "7", materialId: "PM-005", materialName: "Shipper Carton - Duvet", shortName: "", type: "PM", uom: "NOS", minStock: 25000, reOrder: "", safety: "", minOrd: "", ltMin: 7, ltMax: 10, active: "TRUE", kgsPerRoll: "" },
        { id: "8", materialId: "PM-003", materialName: "Spunlace Nonwoven Fabric (120mm) for XL", shortName: "Fabric (120mm) for XL", type: "RM", uom: "KG", minStock: 1000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "9", materialId: "HM-014", materialName: "Duvet XL Flexible Laminate", shortName: "Laminate Duvet XL", type: "RM", uom: "KG", minStock: 1000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "10", materialId: "PM-006", materialName: "Duvet XL Packing Carton - 24 pack", shortName: "Duvet XL 24s Pack", type: "PM", uom: "NOS", minStock: 100000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "11", materialId: "PM-007", materialName: "Sterilization Carton - Duvet XL", shortName: "", type: "PM", uom: "NOS", minStock: 25000, reOrder: "", safety: "", minOrd: "", ltMin: 7, ltMax: 10, active: "TRUE", kgsPerRoll: "" },
        { id: "12", materialId: "PM-008", materialName: "Shipper Carton - Duvet XL", shortName: "", type: "PM", uom: "NOS", minStock: 25000, reOrder: "", safety: "", minOrd: "", ltMin: 7, ltMax: 10, active: "TRUE", kgsPerRoll: "" },
        { id: "13", materialId: "PM-005", materialName: "Spunlace Nonwoven Fabric (200mm) for Ultra", shortName: "Fabric (200mm) for Ultra", type: "RM", uom: "KG", minStock: 1000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "14", materialId: "HM-006", materialName: "Duvet Ultra Flexible Laminate", shortName: "Laminate Duvet Ultra", type: "RM", uom: "KG", minStock: 1000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "15", materialId: "PM-009", materialName: "Duvet Ultra Packing Carton - 6s pack", shortName: "Duvet Ultra 6s Pack", type: "PM", uom: "NOS", minStock: 100000, reOrder: 25, safety: "", minOrd: "", ltMin: 25, ltMax: 40, active: "TRUE", kgsPerRoll: "" },
        { id: "16", materialId: "PM-010", materialName: "Sterilization Carton - Duvet Ultra", shortName: "", type: "PM", uom: "NOS", minStock: 25000, reOrder: "", safety: "", minOrd: "", ltMin: 7, ltMax: 10, active: "TRUE", kgsPerRoll: "" },
        { id: "17", materialId: "PM-011", materialName: "Shipper Carton - Duvet Ultra", shortName: "", type: "PM", uom: "NOS", minStock: 25000, reOrder: "", safety: "", minOrd: "", ltMin: 7, ltMax: 10, active: "TRUE", kgsPerRoll: "" },
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">material_id</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">material name</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Shortname</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">material type</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">uom</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">min stock</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">re-order qty</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">safety stock</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">min order upin</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Lead Time</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Lead Time</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Active</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">KGs per</th>
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
                                                    <span className="text-xs font-semibold text-blue-600">
                                                        {material.materialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {material.materialName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {material.shortName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {material.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {material.uom}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-center align-top ${material.minStock === 25000 ? 'bg-yellow-300' : ''}`}>
                                                    <span className="text-xs font-semibold text-foreground">{material.minStock}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {material.reOrder}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs font-semibold text-foreground">{material.safety}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs font-semibold text-foreground">{material.minOrd}</span>
                                                </td>
                                                <td className={`px-6 py-4 text-center align-top ${material.ltMin === 7 ? 'bg-yellow-300' : ''}`}>
                                                    <span className="text-xs font-semibold text-foreground">{material.ltMin}</span>
                                                </td>
                                                <td className={`px-6 py-4 text-center align-top ${material.ltMax === 10 ? 'bg-yellow-300' : ''}`}>
                                                    <span className="text-xs font-semibold text-foreground">{material.ltMax}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs font-semibold text-foreground">{material.active}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className="text-xs font-semibold text-foreground">{material.kgsPerRoll}</span>
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
