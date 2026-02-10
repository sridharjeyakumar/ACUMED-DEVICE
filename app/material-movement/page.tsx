'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, X, Calendar, Download, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

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

export default function MaterialMovementPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MaterialMovementRecord | null>(null);
    const [filterMaterial, setFilterMaterial] = useState<string>("all");
    const [filterMovementType, setFilterMovementType] = useState<string>("all");
    const [formData, setFormData] = useState({
        materialId: "",
        movementType: "ISSUE" as "ISSUE" | "RETURN" | "TRANSFER",
        date: "",
        qty: "",
        uom: "",
        rollNo: "",
        batchNo: "",
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                materialId: "",
                movementType: "ISSUE" as "ISSUE" | "RETURN" | "TRANSFER",
                date: "",
                qty: "",
                uom: "",
                rollNo: "",
                batchNo: "",
            });
        }
    }, [isAddModalOpen]);

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

    const filteredRecords = records.filter((record) => {
        const matchesSearch = record.materialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.materialName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesMaterial = filterMaterial === "all" || record.materialId === filterMaterial;
        const matchesMovementType = filterMovementType === "all" || record.movementType === filterMovementType;
        
        return matchesSearch && matchesMaterial && matchesMovementType;
    });

    const uniqueMaterials = Array.from(new Set(records.map(r => r.materialId)));

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

    const handleEdit = (record: MaterialMovementRecord) => {
        setSelectedRecord(record);
        setFormData({
            materialId: record.materialId,
            movementType: record.movementType,
            date: record.date,
            qty: record.qty.toString(),
            uom: record.uom,
            rollNo: record.rollNo,
            batchNo: record.batchNo,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Edit submitted:", { ...selectedRecord, ...formData });
        setIsEditModalOpen(false);
        setSelectedRecord(null);
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

    const handleDelete = (record: MaterialMovementRecord) => {
        setSelectedRecord(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        console.log("Deleting record:", selectedRecord);
        setIsDeleteDialogOpen(false);
        setSelectedRecord(null);
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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Material Movement</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Track and record internal movement of raw materials and consumables</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add Material Movement</span>
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
                                <div className="flex-1 relative w-full max-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Material..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 w-full text-sm md:text-base"
                                    />
                                </div>
                                <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase whitespace-nowrap">
                                    RESULTS: {filteredRecords.length} RECORDS
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
                                                {uniqueMaterials.length > 0 && (
                                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                                        <Label className="text-sm font-semibold">Material</Label>
                                                        <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                            <div className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id="mm-material-all" 
                                                                    name="mmMaterialFilter"
                                                                    checked={filterMaterial === "all"}
                                                                    onChange={() => setFilterMaterial("all")}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor="mm-material-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                            </div>
                                                            {uniqueMaterials.map((mat) => (
                                                                <div key={mat} className="flex items-center space-x-2">
                                                                    <input 
                                                                        type="radio" 
                                                                        id={`mm-material-${mat}`} 
                                                                        name="mmMaterialFilter"
                                                                        checked={filterMaterial === mat}
                                                                        onChange={() => setFilterMaterial(mat)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <Label htmlFor={`mm-material-${mat}`} className="text-sm font-normal cursor-pointer">{mat}</Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Movement Type</Label>
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mm-type-all" 
                                                                name="mmTypeFilter"
                                                                checked={filterMovementType === "all"}
                                                                onChange={() => setFilterMovementType("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mm-type-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mm-type-issue" 
                                                                name="mmTypeFilter"
                                                                checked={filterMovementType === "ISSUE"}
                                                                onChange={() => setFilterMovementType("ISSUE")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mm-type-issue" className="text-sm font-normal cursor-pointer">Issue</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mm-type-return" 
                                                                name="mmTypeFilter"
                                                                checked={filterMovementType === "RETURN"}
                                                                onChange={() => setFilterMovementType("RETURN")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mm-type-return" className="text-sm font-normal cursor-pointer">Return</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mm-type-transfer" 
                                                                name="mmTypeFilter"
                                                                checked={filterMovementType === "TRANSFER"}
                                                                onChange={() => setFilterMovementType("TRANSFER")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="mm-type-transfer" className="text-sm font-normal cursor-pointer">Transfer</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-end">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => {
                                                            setFilterMaterial("all");
                                                            setFilterMovementType("all");
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
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MATERIAL ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MOVEMENT TYPE</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DATE</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">QTY</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UOM</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ROLL NO.</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                                    <h2 className="text-2xl font-bold">Edit Material Movement</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                                        Are you sure you want to delete material movement for <strong>{selectedRecord?.materialId}</strong>?
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



