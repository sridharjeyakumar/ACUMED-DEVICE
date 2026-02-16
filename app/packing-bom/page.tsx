'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, List, ChevronDown, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface PackingBOMRecord {
    id: string;
    bomId: string;
    description: string;
    subtitle: string;
    packingFor: string;
    productId: string;
    packSizeId: string;
    materialId: string;
    packsPerCarton: number;
}

export default function PackingBOMPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPackingBOM, setSelectedPackingBOM] = useState<PackingBOMRecord | null>(null);
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterMaterial, setFilterMaterial] = useState<string>("all");
    const [formData, setFormData] = useState({
        bomId: "",
        description: "",
        subtitle: "",
        packingFor: "",
        productId: "",
        packSizeId: "",
        materialId: "",
        packsPerCarton: "",
        active: true,
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                bomId: "",
                description: "",
                subtitle: "",
                packingFor: "",
                productId: "",
                packSizeId: "",
                materialId: "",
                packsPerCarton: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const records: PackingBOMRecord[] = [
        {
            id: "1",
            bomId: "PBOM1",
            description: "DUVET",
            subtitle: "",
            packingFor: "Packing",
            productId: "P0001",
            packSizeId: "PaCK24",
            materialId: "PM001",
            packsPerCarton: 1,
        },
        {
            id: "2",
            bomId: "PBOM2",
            description: "DUVET",
            subtitle: "",
            packingFor: "Packing",
            productId: "P0001",
            packSizeId: "PaCK12",
            materialId: "PM002",
            packsPerCarton: 1,
        },
        {
            id: "3",
            bomId: "PBOM3",
            description: "DUVET",
            subtitle: "",
            packingFor: "Packing",
            productId: "P0001",
            packSizeId: "PaCK06",
            materialId: "PM003",
            packsPerCarton: 1,
        },
        {
            id: "4",
            bomId: "PBOM4",
            description: "DUVET XL",
            subtitle: "",
            packingFor: "Packing",
            productId: "P0002",
            packSizeId: "PaCK24",
            materialId: "PM006",
            packsPerCarton: 1,
        },
        {
            id: "5",
            bomId: "PBOM5",
            description: "DUVET Ultra",
            subtitle: "",
            packingFor: "Packing",
            productId: "P0003",
            packSizeId: "PaCK06",
            materialId: "PM009",
            packsPerCarton: 1,
        },
    ];

    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.bomId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesProduct = filterProduct === "all" || item.productId === filterProduct;
        const matchesMaterial = filterMaterial === "all" || item.materialId === filterMaterial;
        
        return matchesSearch && matchesProduct && matchesMaterial;
    });

    const uniqueProducts = Array.from(new Set(records.map(r => r.productId)));
    const uniqueMaterials = Array.from(new Set(records.map(r => r.materialId)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddModalOpen(false);
        setFormData({
            bomId: "",
            description: "",
            subtitle: "",
            packingFor: "",
            productId: "",
            packSizeId: "",
            materialId: "",
            packsPerCarton: "",
            active: true,
        });
    };

    const handleEdit = (packingBOM: PackingBOMRecord) => {
        setSelectedPackingBOM(packingBOM);
        setFormData({
            bomId: packingBOM.bomId,
            description: packingBOM.description,
            subtitle: packingBOM.subtitle,
            packingFor: packingBOM.packingFor,
            productId: packingBOM.productId,
            packSizeId: packingBOM.packSizeId,
            materialId: packingBOM.materialId,
            packsPerCarton: packingBOM.packsPerCarton.toString(),
            active: true, // Default to true if not in interface
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditModalOpen(false);
        setSelectedPackingBOM(null);
        setFormData({
            bomId: "",
            description: "",
            subtitle: "",
            packingFor: "",
            productId: "",
            packSizeId: "",
            materialId: "",
            packsPerCarton: "",
            active: true,
        });
    };

    const handleDelete = (packingBOM: PackingBOMRecord) => {
        setSelectedPackingBOM(packingBOM);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        setIsDeleteDialogOpen(false);
        setSelectedPackingBOM(null);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Packing BOM</h1>
                                <p className="text-muted-foreground">Configure packing specifications and carton distribution</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Packing BOM
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

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
                                        placeholder="Search by Packing BOM ID or Description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredRecords.length > 0 ? 1 : 0}-{filteredRecords.length} OF {filteredRecords.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                        <div className="flex flex-wrap gap-6 items-start">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Label className="text-sm font-semibold">Product</Label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pbom-product-all" 
                                                            name="pbomProductFilter"
                                                            checked={filterProduct === "all"}
                                                            onChange={() => setFilterProduct("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="pbom-product-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {uniqueProducts.map((prod) => (
                                                        <div key={prod} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`pbom-product-${prod}`} 
                                                                name="pbomProductFilter"
                                                                checked={filterProduct === prod}
                                                                onChange={() => setFilterProduct(prod)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`pbom-product-${prod}`} className="text-sm font-normal cursor-pointer">{prod}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Label className="text-sm font-semibold">Material</Label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pbom-material-all" 
                                                            name="pbomMaterialFilter"
                                                            checked={filterMaterial === "all"}
                                                            onChange={() => setFilterMaterial("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="pbom-material-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {uniqueMaterials.map((mat) => (
                                                        <div key={mat} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`pbom-material-${mat}`} 
                                                                name="pbomMaterialFilter"
                                                                checked={filterMaterial === mat}
                                                                onChange={() => setFilterMaterial(mat)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`pbom-material-${mat}`} className="text-sm font-normal cursor-pointer">{mat}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => {
                                                    setFilterProduct("all");
                                                    setFilterMaterial("all");
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap w-32">Bom Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Bom Description</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Packing For</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Product Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Packsize Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Material Id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap w-24">Packs Per Carton</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
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
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {item.bomId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.description}</span>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                    {item.packingFor}
                                                </td>
                                                <td className="px-6 py-6 align-middle text-center">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {item.productId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {item.packSizeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {item.materialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-middle">
                                                    {item.packsPerCarton}
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(item);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(item);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 6</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-muted-foreground">Previous</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 bg-blue-50">Next</Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Packing BOM</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* BOM ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                BOM ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="bomId" 
                                                value={formData.bomId} 
                                                onChange={handleInputChange} 
                                                placeholder="PK-BOM-XXX" 
                                                required 
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="description" 
                                                value={formData.description} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Packing For */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packing For
                                            </label>
                                            <Input 
                                                name="packingFor" 
                                                value={formData.packingFor} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Standard Export Unit" 
                                            />
                                        </div>

                                        {/* Subtitle / Line */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Subtitle / Line
                                            </label>
                                            <Input 
                                                name="subtitle" 
                                                value={formData.subtitle} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. PRIMARY LOGISTICS" 
                                            />
                                        </div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID
                                            </label>
                                            <Input 
                                                name="productId" 
                                                value={formData.productId} 
                                                onChange={handleInputChange} 
                                                placeholder="PRD-XXX-XX" 
                                            />
                                        </div>

                                        {/* Pack Size ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size ID
                                            </label>
                                            <Input 
                                                name="packSizeId" 
                                                value={formData.packSizeId} 
                                                onChange={handleInputChange} 
                                                placeholder="PS-XXX" 
                                            />
                                        </div>

                                        {/* Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material ID
                                            </label>
                                            <Input 
                                                name="materialId" 
                                                value={formData.materialId} 
                                                onChange={handleInputChange} 
                                                placeholder="MAT-XXX-XX" 
                                            />
                                        </div>

                                        {/* Packs Per Carton */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packs Per Carton
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="packsPerCarton" 
                                                value={formData.packsPerCarton} 
                                                onChange={handleInputChange} 
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_add"
                                                name="active"
                                                checked={formData.active}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_add" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Save Packing BOM
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsEditModalOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Packing BOM</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* BOM ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                BOM ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="bomId" 
                                                value={formData.bomId} 
                                                onChange={handleInputChange} 
                                                disabled
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="description" 
                                                value={formData.description} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Packing For */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packing For
                                            </label>
                                            <Input 
                                                name="packingFor" 
                                                value={formData.packingFor} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Standard Export Unit" 
                                            />
                                        </div>

                                        {/* Subtitle / Line */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Subtitle / Line
                                            </label>
                                            <Input 
                                                name="subtitle" 
                                                value={formData.subtitle} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. PRIMARY LOGISTICS" 
                                            />
                                        </div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID
                                            </label>
                                            <Input 
                                                name="productId" 
                                                value={formData.productId} 
                                                onChange={handleInputChange} 
                                                placeholder="PRD-XXX-XX" 
                                            />
                                        </div>

                                        {/* Pack Size ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size ID
                                            </label>
                                            <Input 
                                                name="packSizeId" 
                                                value={formData.packSizeId} 
                                                onChange={handleInputChange} 
                                                placeholder="PS-XXX" 
                                            />
                                        </div>

                                        {/* Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material ID
                                            </label>
                                            <Input 
                                                name="materialId" 
                                                value={formData.materialId} 
                                                onChange={handleInputChange} 
                                                placeholder="MAT-XXX-XX" 
                                            />
                                        </div>

                                        {/* Packs Per Carton */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packs Per Carton
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="packsPerCarton" 
                                                value={formData.packsPerCarton} 
                                                onChange={handleInputChange} 
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_edit"
                                                name="active"
                                                checked={formData.active}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_edit" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Update Packing BOM
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Confirm Delete</h2>
                                    <button
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        className="text-white hover:bg-red-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to delete <strong>{selectedPackingBOM?.description}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        This action cannot be undone.
                                    </p>

                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDeleteDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmDelete}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}



