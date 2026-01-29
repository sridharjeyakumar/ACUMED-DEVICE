'use client';

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, X, Calendar, Download, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

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

export default function ProductMovementPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MovementRecord | null>(null);
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterPackSize, setFilterPackSize] = useState<string>("all");
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

    const filteredRecords = records.filter((record) => {
        const matchesSearch = record.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.productId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesProduct = filterProduct === "all" || record.productId === filterProduct;
        const matchesPackSize = filterPackSize === "all" || record.packSizeId === filterPackSize;
        
        return matchesSearch && matchesProduct && matchesPackSize;
    });

    const uniqueProducts = Array.from(new Set(records.map(r => r.productId)));
    const uniquePackSizes = Array.from(new Set(records.map(r => r.packSizeId)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            batchNo: "",
            date: "",
            productId: "",
            packSizeId: "",
            cartonCapacityId: "",
            noOfCartons: "",
        });
    };

    const handleEdit = (record: MovementRecord) => {
        setSelectedRecord(record);
        setFormData({
            batchNo: record.batchNo,
            date: record.date,
            productId: record.productId,
            packSizeId: record.packSizeId,
            cartonCapacityId: record.cartonCapacityId,
            noOfCartons: record.noOfCartons.toString(),
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Edit submitted:", { ...selectedRecord, ...formData });
        setIsEditModalOpen(false);
        setSelectedRecord(null);
        setFormData({
            batchNo: "",
            date: "",
            productId: "",
            packSizeId: "",
            cartonCapacityId: "",
            noOfCartons: "",
        });
    };

    const handleDelete = (record: MovementRecord) => {
        setSelectedRecord(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        console.log("Deleting record:", selectedRecord);
        setIsDeleteDialogOpen(false);
        setSelectedRecord(null);
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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Product Movement</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Monitor and manage the internal movement of finished goods</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add Movement</span>
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
                                <div className="flex-1 relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch No..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 w-full text-sm md:text-base"
                                    />
                                </div>
                                <span className="text-xs md:text-sm text-muted-foreground uppercase whitespace-nowrap">
                                    results: {filteredRecords.length} records
                                </span>
                                <div className="flex items-center gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 hover:text-foreground">
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
                                                                    id="pm-product-all" 
                                                                    name="pmProductFilter"
                                                                    checked={filterProduct === "all"}
                                                                    onChange={() => setFilterProduct("all")}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor="pm-product-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                            </div>
                                                            {uniqueProducts.map((prod) => (
                                                                <div key={prod} className="flex items-center space-x-2">
                                                                    <input 
                                                                        type="radio" 
                                                                        id={`pm-product-${prod}`} 
                                                                        name="pmProductFilter"
                                                                        checked={filterProduct === prod}
                                                                        onChange={() => setFilterProduct(prod)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <Label htmlFor={`pm-product-${prod}`} className="text-sm font-normal cursor-pointer">{prod}</Label>
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
                                                                    id="pm-packsize-all" 
                                                                    name="pmPackSizeFilter"
                                                                    checked={filterPackSize === "all"}
                                                                    onChange={() => setFilterPackSize("all")}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor="pm-packsize-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                            </div>
                                                            {uniquePackSizes.map((ps) => (
                                                                <div key={ps} className="flex items-center space-x-2">
                                                                    <input 
                                                                        type="radio" 
                                                                        id={`pm-packsize-${ps}`} 
                                                                        name="pmPackSizeFilter"
                                                                        checked={filterPackSize === ps}
                                                                        onChange={() => setFilterPackSize(ps)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <Label htmlFor={`pm-packsize-${ps}`} className="text-sm font-normal cursor-pointer">{ps}</Label>
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
                                                        }}
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                                        <Download className="w-4 h-4" />
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
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DATE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PRODUCT ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">PACK SIZE ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CARTON CAPACITY ID</th>
                                            <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">NO. OF CARTONS</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(record);
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
                                                                handleDelete(record);
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Product Movement</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Movement</Button>
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
                                        Are you sure you want to delete product movement for <strong>{selectedRecord?.batchNo}</strong>?
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



