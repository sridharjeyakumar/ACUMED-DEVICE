'use client';

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, X, Calendar, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface ProductionTarget {
    id: string;
    monthYear: string;
    batchNo: string;
    productId: string;
    productName: string;
    packSizeId: string;
    targetQty: number;
    actualQty: number;
    remarks: string;
    finalRemarks: string;
}

export default function MonthlyProductionTargetPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<ProductionTarget | null>(null);
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterPackSize, setFilterPackSize] = useState<string>("all");
    const [filterMonthYear, setFilterMonthYear] = useState<string>("all");
    const [formData, setFormData] = useState({
        monthYear: "",
        batchNo: "",
        productId: "",
        packSizeId: "",
        targetQty: "",
        remarks: "",
    });

    const targets: ProductionTarget[] = [
        {
            id: "1",
            monthYear: "202501",
            batchNo: "DUVET002501",
            productId: "P0001",
            productName: "",
            packSizeId: "PACK24",
            targetQty: 41200,
            actualQty: 41000,
            remarks: "",
            finalRemarks: "",
        },
        {
            id: "2",
            monthYear: "202501",
            batchNo: "DUVET002501",
            productId: "P0001",
            productName: "",
            packSizeId: "PACK12",
            targetQty: 41200,
            actualQty: 41000,
            remarks: "",
            finalRemarks: "",
        },
        {
            id: "3",
            monthYear: "202501",
            batchNo: "DUVET002501",
            productId: "P0001",
            productName: "",
            packSizeId: "PACK06",
            targetQty: 41200,
            actualQty: 41000,
            remarks: "",
            finalRemarks: "",
        },
        {
            id: "4",
            monthYear: "202501",
            batchNo: "DUVET002501",
            productId: "P0002",
            productName: "",
            packSizeId: "PaCK24",
            targetQty: 41200,
            actualQty: 41000,
            remarks: "",
            finalRemarks: "",
        },
        {
            id: "5",
            monthYear: "202501",
            batchNo: "DUVETXL2501",
            productId: "P0003",
            productName: "",
            packSizeId: "PaCK06",
            targetQty: 41200,
            actualQty: 41000,
            remarks: "",
            finalRemarks: "",
        },
        {
            id: "6",
            monthYear: "202501",
            batchNo: "DUVETUL2501",
            productId: "",
            productName: "",
            packSizeId: "",
            targetQty: 0,
            actualQty: 0,
            remarks: "",
            finalRemarks: "",
        },
    ];

    const filteredTargets = targets.filter((target) => {
        const matchesSearch = target.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            target.productId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesProduct = filterProduct === "all" || target.productId === filterProduct;
        const matchesPackSize = filterPackSize === "all" || target.packSizeId === filterPackSize;
        const matchesMonthYear = filterMonthYear === "all" || target.monthYear === filterMonthYear;
        
        return matchesSearch && matchesProduct && matchesPackSize && matchesMonthYear;
    });

    const uniqueProducts = Array.from(new Set(targets.map(t => t.productId).filter(p => p)));
    const uniquePackSizes = Array.from(new Set(targets.map(t => t.packSizeId).filter(p => p)));
    const uniqueMonthYears = Array.from(new Set(targets.map(t => t.monthYear)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            monthYear: "",
            batchNo: "",
            productId: "",
            packSizeId: "",
            targetQty: "",
            remarks: "",
        });
    };

    const handleEdit = (target: ProductionTarget) => {
        setSelectedTarget(target);
        setFormData({
            monthYear: target.monthYear,
            batchNo: target.batchNo,
            productId: target.productId,
            packSizeId: target.packSizeId,
            targetQty: target.targetQty.toString(),
            remarks: target.remarks,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Edit submitted:", { ...selectedTarget, ...formData });
        setIsEditModalOpen(false);
        setSelectedTarget(null);
        setFormData({
            monthYear: "",
            batchNo: "",
            productId: "",
            packSizeId: "",
            targetQty: "",
            remarks: "",
        });
    };

    const handleDelete = (target: ProductionTarget) => {
        setSelectedTarget(target);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        console.log("Deleting target:", selectedTarget);
        setIsDeleteDialogOpen(false);
        setSelectedTarget(null);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 md:mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Monthly Production Target</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Define and track monthly manufacturing targets against actual production</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add Target</span>
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-4 md:mb-6"
                    >
                        <Card className="p-3 md:p-4">
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                                <div className="flex-1 relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch or Product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 w-full text-sm md:text-base"
                                    />
                                </div>
                                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING 1-{filteredTargets.length} OF {targets.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                        <div className="flex flex-wrap gap-6 items-start">
                                            {uniqueProducts.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Product</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mpt-product-all" 
                                                                name="mptProductFilter"
                                                                checked={filterProduct === "all"}
                                                                onChange={() => setFilterProduct("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mpt-product-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueProducts.map((prod) => (
                                                            <div key={prod} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`mpt-product-${prod}`} 
                                                                    name="mptProductFilter"
                                                                    checked={filterProduct === prod}
                                                                    onChange={() => setFilterProduct(prod)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`mpt-product-${prod}`} className="text-sm font-normal cursor-pointer">{prod}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {uniquePackSizes.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Pack Size</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mpt-packsize-all" 
                                                                name="mptPackSizeFilter"
                                                                checked={filterPackSize === "all"}
                                                                onChange={() => setFilterPackSize("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mpt-packsize-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniquePackSizes.map((ps) => (
                                                            <div key={ps} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`mpt-packsize-${ps}`} 
                                                                    name="mptPackSizeFilter"
                                                                    checked={filterPackSize === ps}
                                                                    onChange={() => setFilterPackSize(ps)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`mpt-packsize-${ps}`} className="text-sm font-normal cursor-pointer">{ps}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {uniqueMonthYears.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Month/Year</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mpt-month-all" 
                                                                name="mptMonthFilter"
                                                                checked={filterMonthYear === "all"}
                                                                onChange={() => setFilterMonthYear("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mpt-month-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueMonthYears.map((my) => (
                                                            <div key={my} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`mpt-month-${my}`} 
                                                                    name="mptMonthFilter"
                                                                    checked={filterMonthYear === my}
                                                                    onChange={() => setFilterMonthYear(my)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`mpt-month-${my}`} className="text-sm font-normal cursor-pointer">{my}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-end">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setFilterProduct("all");
                                                        setFilterPackSize("all");
                                                        setFilterMonthYear("all");
                                                    }}
                                                >
                                                    Clear Filters
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
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
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">month year (YYYYMM)</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">batch no.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">remarks</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">product_id</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">packsize_id</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">target qty</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">actual qty</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">final</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTargets.map((target, index) => (
                                            <motion.tr
                                                key={target.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.monthYear}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.batchNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.remarks}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.productId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.packSizeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.targetQty || ''}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.actualQty || ''}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {target.finalRemarks}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(target);
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
                                                                handleDelete(target);
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

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>Previous</Button>
                                    <Button variant="outline" size="sm" disabled>Next</Button>
                                </div>
                            </div>
                        </Card>
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add Target</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Month Year <span className="text-red-500">*</span></label>
                                            <Input name="monthYear" value={formData.monthYear} onChange={handleInputChange} placeholder="YYYYMM" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-YYYY-XXX" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID <span className="text-red-500">*</span></label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="Select Pack Size" required />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Target Quantity <span className="text-red-500">*</span></label>
                                        <Input type="number" name="targetQty" value={formData.targetQty} onChange={handleInputChange} placeholder="0" required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                        <textarea
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Optional remarks..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Target</Button>
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Target</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Month Year <span className="text-red-500">*</span></label>
                                            <Input name="monthYear" value={formData.monthYear} onChange={handleInputChange} placeholder="YYYYMM" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-YYYY-XXX" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID <span className="text-red-500">*</span></label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="Select Pack Size" required />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Target Quantity <span className="text-red-500">*</span></label>
                                        <Input type="number" name="targetQty" value={formData.targetQty} onChange={handleInputChange} placeholder="0" required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                        <textarea
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Optional remarks..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Target</Button>
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
                                        Are you sure you want to delete target for <strong>{selectedTarget?.batchNo}</strong>?
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



