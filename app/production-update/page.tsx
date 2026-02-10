'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, X, Settings2, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface ProductionUpdateRecord {
    id: string;
    batchNo: string;
    date: string;
    machineId: string;
    productId: string;
    binNo: string;
    tareWeight: number;
    grossWeight: number;
    netWeight: number;
    calcQty: number;
    countQty: number;
    status: "COMPLETED" | "IN PROGRESS";
    remarks: string;
}

export default function ProductionUpdatePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ProductionUpdateRecord | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterMachine, setFilterMachine] = useState<string>("all");
    const [formData, setFormData] = useState({
        batchNo: "",
        date: "",
        machineId: "",
        productId: "",
        binNo: "",
        tareWeight: "",
        grossWeight: "",
        countQty: "",
        status: "IN PROGRESS" as "COMPLETED" | "IN PROGRESS",
        remarks: "",
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                batchNo: "",
                date: "",
                machineId: "",
                productId: "",
                binNo: "",
                tareWeight: "",
                grossWeight: "",
                countQty: "",
                status: "IN PROGRESS" as "COMPLETED" | "IN PROGRESS",
                remarks: "",
            });
        }
    }, [isAddModalOpen]);

    const records: ProductionUpdateRecord[] = [
        {
            id: "1",
            batchNo: "BT-2023-001",
            date: "12/10/23",
            machineId: "MCH-001",
            productId: "ST-A200",
            binNo: "BIN-A12",
            tareWeight: 1.25,
            grossWeight: 12.50,
            netWeight: 11.25,
            calcQty: 450,
            countQty: 452,
            status: "COMPLETED",
            remarks: "Shift A Morning",
        },
        {
            id: "2",
            batchNo: "BT-2023-002",
            date: "12/10/23",
            machineId: "MCH-042",
            productId: "CT-G005",
            binNo: "BIN-C08",
            tareWeight: 1.25,
            grossWeight: 8.75,
            netWeight: 7.50,
            calcQty: 1200,
            countQty: 1180,
            status: "IN PROGRESS",
            remarks: "Partial collection",
        },
        {
            id: "3",
            batchNo: "BT-2023-003",
            date: "12/10/23",
            machineId: "MCH-001",
            productId: "ST-A200",
            binNo: "BIN-A14",
            tareWeight: 1.25,
            grossWeight: 13.25,
            netWeight: 12.00,
            calcQty: 480,
            countQty: 480,
            status: "COMPLETED",
            remarks: "Clean run",
        },
    ];

    const filteredRecords = records.filter((record) => {
        const matchesSearch = record.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.productId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || record.status === filterStatus;
        const matchesProduct = filterProduct === "all" || record.productId === filterProduct;
        const matchesMachine = filterMachine === "all" || record.machineId === filterMachine;
        
        return matchesSearch && matchesStatus && matchesProduct && matchesMachine;
    });

    const uniqueProducts = Array.from(new Set(records.map(r => r.productId)));
    const uniqueMachines = Array.from(new Set(records.map(r => r.machineId)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateNet = () => {
        const gross = parseFloat(formData.grossWeight) || 0;
        const tare = parseFloat(formData.tareWeight) || 0;
        return (gross - tare).toFixed(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            batchNo: "",
            date: "",
            machineId: "",
            productId: "",
            binNo: "",
            tareWeight: "",
            grossWeight: "",
            countQty: "",
            status: "IN PROGRESS",
            remarks: "",
        });
    };

    const handleEdit = (record: ProductionUpdateRecord) => {
        setSelectedRecord(record);
        setFormData({
            batchNo: record.batchNo,
            date: record.date,
            machineId: record.machineId,
            productId: record.productId,
            binNo: record.binNo,
            tareWeight: record.tareWeight.toString(),
            grossWeight: record.grossWeight.toString(),
            countQty: record.countQty.toString(),
            status: record.status,
            remarks: record.remarks,
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
            machineId: "",
            productId: "",
            binNo: "",
            tareWeight: "",
            grossWeight: "",
            countQty: "",
            status: "IN PROGRESS",
            remarks: "",
        });
    };

    const handleDelete = (record: ProductionUpdateRecord) => {
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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Production Update</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Record and update daily production outputs for manufacturing batches</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add Production Update</span>
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
                                <div className="flex-1 relative w-full max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch, Machine or Product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 w-full text-sm md:text-base"
                                    />
                                </div>
                                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING 1-{filteredRecords.length} OF {records.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                        <div className="flex flex-wrap gap-6 items-start">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Label className="text-sm font-semibold">Status</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pu-status-all" 
                                                            name="puStatusFilter"
                                                            checked={filterStatus === "all"}
                                                            onChange={() => setFilterStatus("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="pu-status-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pu-status-completed" 
                                                            name="puStatusFilter"
                                                            checked={filterStatus === "COMPLETED"}
                                                            onChange={() => setFilterStatus("COMPLETED")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="pu-status-completed" className="text-sm font-normal cursor-pointer">Completed</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="pu-status-inprogress" 
                                                            name="puStatusFilter"
                                                            checked={filterStatus === "IN PROGRESS"}
                                                            onChange={() => setFilterStatus("IN PROGRESS")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="pu-status-inprogress" className="text-sm font-normal cursor-pointer">In Progress</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            {uniqueProducts.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Product</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="pu-product-all" 
                                                                name="puProductFilter"
                                                                checked={filterProduct === "all"}
                                                                onChange={() => setFilterProduct("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="pu-product-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueProducts.map((prod) => (
                                                            <div key={prod} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`pu-product-${prod}`} 
                                                                    name="puProductFilter"
                                                                    checked={filterProduct === prod}
                                                                    onChange={() => setFilterProduct(prod)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`pu-product-${prod}`} className="text-sm font-normal cursor-pointer">{prod}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {uniqueMachines.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Machine</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="pu-machine-all" 
                                                                name="puMachineFilter"
                                                                checked={filterMachine === "all"}
                                                                onChange={() => setFilterMachine("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="pu-machine-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueMachines.map((machine) => (
                                                            <div key={machine} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`pu-machine-${machine}`} 
                                                                    name="puMachineFilter"
                                                                    checked={filterMachine === machine}
                                                                    onChange={() => setFilterMachine(machine)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`pu-machine-${machine}`} className="text-sm font-normal cursor-pointer">{machine}</Label>
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
                                                        setFilterStatus("all");
                                                        setFilterProduct("all");
                                                        setFilterMachine("all");
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
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">BATCH NO.</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">DATE</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">MACHINE ID</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PRODUCT ID</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">BIN NO.</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TARE (KGS)</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">GROSS (KGS)</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">NET (KGS)</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CALC QTY</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">COUNT QTY</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">STATUS</th>
                                            <th className="text-left px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">REMARKS</th>
                                            <th className="text-center px-4 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                                                        {record.batchNo}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.date}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.machineId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {record.productId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.binNo}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.tareWeight.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-foreground">
                                                        {record.grossWeight.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {record.netWeight.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {record.calcQty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-xs font-bold ${record.countQty >= record.calcQty ? "text-green-600" : "text-orange-500"
                                                        }`}>
                                                        {record.countQty.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${record.status === "COMPLETED"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-blue-100 text-blue-700"
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        {record.remarks}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add Production Update</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-2023-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Date <span className="text-red-500">*</span></label>
                                            <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Machine ID <span className="text-red-500">*</span></label>
                                            <Input name="machineId" value={formData.machineId} onChange={handleInputChange} placeholder="MCH-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Bin No.</label>
                                        <Input name="binNo" value={formData.binNo} onChange={handleInputChange} placeholder="BIN-XXX" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Tare (Kgs)</label>
                                            <Input type="number" step="0.01" name="tareWeight" value={formData.tareWeight} onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Gross (Kgs)</label>
                                            <Input type="number" step="0.01" name="grossWeight" value={formData.grossWeight} onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Net (Kgs)</label>
                                            <div className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground font-bold">
                                                {calculateNet()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Count Qty</label>
                                            <Input type="number" name="countQty" value={formData.countQty} onChange={handleInputChange} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="IN PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                        <Input name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Notes..." />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Update</Button>
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
                                    <h2 className="text-2xl font-bold">Edit Production Update</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Batch No. <span className="text-red-500">*</span></label>
                                            <Input name="batchNo" value={formData.batchNo} onChange={handleInputChange} placeholder="BT-2023-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Date <span className="text-red-500">*</span></label>
                                            <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Machine ID <span className="text-red-500">*</span></label>
                                            <Input name="machineId" value={formData.machineId} onChange={handleInputChange} placeholder="MCH-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID <span className="text-red-500">*</span></label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="Select Product" required />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Bin No.</label>
                                        <Input name="binNo" value={formData.binNo} onChange={handleInputChange} placeholder="BIN-XXX" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Tare (Kgs)</label>
                                            <Input type="number" step="0.01" name="tareWeight" value={formData.tareWeight} onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Gross (Kgs)</label>
                                            <Input type="number" step="0.01" name="grossWeight" value={formData.grossWeight} onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Net (Kgs)</label>
                                            <div className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground font-bold">
                                                {calculateNet()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Count Qty</label>
                                            <Input type="number" name="countQty" value={formData.countQty} onChange={handleInputChange} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            >
                                                <option value="IN PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Remarks</label>
                                        <Input name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Notes..." />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Record</Button>
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
                                        Are you sure you want to delete production update for <strong>{selectedRecord?.batchNo}</strong>?
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



