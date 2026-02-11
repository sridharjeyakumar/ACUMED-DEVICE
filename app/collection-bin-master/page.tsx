'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, X, ChevronDown } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { collectionBinAPI } from "@/services/api";

interface BinRecord {
    id: string;
    binId: string;
    binName: string;
    binShortName: string;
    binType: string;
    color: string;
    tareWeightKg: number;
    grossCapacityKg: number;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

export default function CollectionBinMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [binToCancel, setBinToCancel] = useState<BinRecord | null>(null);
    const [cancelledBins, setCancelledBins] = useState<Set<string>>(new Set());
    const [selectedBin, setSelectedBin] = useState<BinRecord | null>(null);
    const [filterBinType, setFilterBinType] = useState<string>("all");
    const [records, setRecords] = useState<BinRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        binId: "",
        binName: "",
        binShortName: "",
        binType: "Normal",
        color: "",
        tareWeightKg: "",
        grossCapacityKg: "",
        active: true,
    });

    // Helper function to convert snake_case to camelCase
    const toCamelCase = (data: any): BinRecord => {
        return {
            id: data._id || data.bin_id,
            binId: data.bin_id,
            binName: data.bin_name,
            binShortName: data.bin_short_name,
            binType: data.bin_type,
            color: data.color,
            tareWeightKg: data.tare_weight_kg,
            grossCapacityKg: data.gross_capacity_kg,
            lastModifiedUserId: data.last_modified_user_id || "",
            lastModifiedDateTime: data.last_modified_date_time ? new Date(data.last_modified_date_time).toLocaleString() : "",
            active: data.active !== false,
        };
    };

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (data: any) => {
        return {
            bin_id: data.binId,
            bin_name: data.binName,
            bin_short_name: data.binShortName,
            bin_type: data.binType,
            color: data.color,
            tare_weight_kg: data.tareWeightKg ? Number(data.tareWeightKg) : undefined,
            gross_capacity_kg: data.grossCapacityKg ? Number(data.grossCapacityKg) : undefined,
            active: data.active !== false,
            last_modified_user_id: "ADMIN",
        };
    };

    // Load data from API
    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const data = await collectionBinAPI.getAll();
            setRecords(data.map(toCamelCase));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load collection bins",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                binId: "",
                binName: "",
                binShortName: "",
                binType: "Normal",
                color: "",
                tareWeightKg: "",
                grossCapacityKg: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.binName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.binId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesBinType = filterBinType === "all" || item.binType === filterBinType;
        
        return matchesSearch && matchesBinType;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = toSnakeCase(formData);
            await collectionBinAPI.create(dataToSend);
            toast({
                title: "Success",
                description: "Collection bin created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                binId: "",
                binName: "",
                binShortName: "",
                binType: "Normal",
                color: "",
                tareWeightKg: "",
                grossCapacityKg: "",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create collection bin",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (bin: BinRecord) => {
        setSelectedBin(bin);
        setFormData({
            binId: bin.binId,
            binName: bin.binName,
            binShortName: bin.binShortName,
            binType: bin.binType,
            color: bin.color,
            tareWeightKg: bin.tareWeightKg.toString(),
            grossCapacityKg: bin.grossCapacityKg.toString(),
            active: bin.active !== undefined ? bin.active : true,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBin) return;
        try {
            const dataToSend = toSnakeCase(formData);
            await collectionBinAPI.update(selectedBin.binId, dataToSend);
            toast({
                title: "Success",
                description: "Collection bin updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedBin(null);
            setFormData({
                binId: "",
                binName: "",
                binShortName: "",
                binType: "Normal",
                color: "",
                tareWeightKg: "",
                grossCapacityKg: "",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update collection bin",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (bin: BinRecord) => {
        setBinToCancel(bin);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!binToCancel) return;
        
        const isCancelled = cancelledBins.has(binToCancel.binId);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await collectionBinAPI.update(binToCancel.binId, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledBins(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(binToCancel.binId);
                    toast({
                        title: "Restored",
                        description: `Collection bin ${binToCancel.binName} has been restored`,
                    });
                } else {
                    newSet.add(binToCancel.binId);
                    toast({
                        title: "Cancelled",
                        description: `Collection bin ${binToCancel.binName} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadRecords(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setBinToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} collection bin`,
                variant: "destructive",
            });
        }
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Collection Bin Master</h1>
                                <p className="text-muted-foreground">Manage and configure collection bins for waste and byproduct management</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Bin
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
                                        placeholder="Search by Bin ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {loading ? "LOADING..." : `SHOWING ${filteredRecords.length > 0 ? 1 : 0}-${filteredRecords.length} OF ${filteredRecords.length}`}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56" align="end">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Bin Type</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="bintype-all" 
                                                            name="binTypeFilter"
                                                            checked={filterBinType === "all"}
                                                            onChange={() => setFilterBinType("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="bintype-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="bintype-normal" 
                                                            name="binTypeFilter"
                                                            checked={filterBinType === "Normal"}
                                                            onChange={() => setFilterBinType("Normal")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="bintype-normal" className="text-sm font-normal cursor-pointer">Normal</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="bintype-rejected" 
                                                            name="binTypeFilter"
                                                            checked={filterBinType === "Rejected"}
                                                            onChange={() => setFilterBinType("Rejected")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="bintype-rejected" className="text-sm font-normal cursor-pointer">Rejected</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => setFilterBinType("all")}
                                            >
                                                Clear Filter
                                            </Button>
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
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">bin id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">bin name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">bin short name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">bin type</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">color</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">tare weight kg</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>gross capacity</span>
                                                    <span>kg</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>user id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>date & time</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Active</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="px-6 py-8 text-center text-muted-foreground">
                                                    No collection bins found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRecords.map((item, index) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-6 align-middle">
                                                        <span className="text-sm font-semibold text-blue-600">
                                                            {item.binId}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 align-middle">
                                                        <span className="text-sm font-semibold text-foreground">{item.binName}</span>
                                                    </td>
                                                    <td className="px-6 py-6 text-center align-middle">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {item.binShortName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 text-center align-middle">
                                                        <span className={`text-sm font-semibold px-2 py-1 rounded ${
                                                            item.binType === "Normal" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {item.binType}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-semibold text-foreground align-middle">
                                                        {item.color}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-middle">
                                                        {item.tareWeightKg}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-middle">
                                                        {item.grossCapacityKg}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-middle">
                                                        {item.lastModifiedUserId || "-"}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-middle">
                                                        {item.lastModifiedDateTime || "-"}
                                                    </td>
                                                    <td className="px-6 py-6 text-left align-middle">
                                                        {(() => {
                                                            const isCancelled = cancelledBins.has(item.binId);
                                                            const displayActive = !isCancelled && (item.active !== false);
                                                            return (
                                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                                    displayActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                                }`}>
                                                                    {displayActive ? "TRUE" : "FALSE"}
                                                                </span>
                                                            );
                                                        })()}
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
                                                                    handleCancel(item);
                                                                }}
                                                                className={`${cancelledBins.has(item.binId) ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={cancelledBins.has(item.binId) ? "Restore collection bin" : "Cancel collection bin"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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
                                    <h2 className="text-2xl font-bold">Add New Bin</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Bin ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="binId" 
                                                value={formData.binId} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g., 1, 2, 91" 
                                                required 
                                            />
                                        </div>

                                        {/* Bin Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="binName" 
                                                value={formData.binName} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g., Product collection Bin 1" 
                                                required 
                                            />
                                        </div>

                                        {/* Bin Short Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="binShortName" 
                                                value={formData.binShortName} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g., Bin 1" 
                                                required 
                                            />
                                        </div>

                                        {/* Bin Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="binType"
                                                value={formData.binType}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                required
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="GENERAL">GENERAL</option>
                                                <option value="HAZARDOUS">HAZARDOUS</option>
                                                <option value="RECYCLABLE">RECYCLABLE</option>
                                                <option value="SCRAP">SCRAP</option>
                                                <option value="REWORK">REWORK</option>
                                            </select>
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Color <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="color" 
                                                value={formData.color} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g., Blue, Red" 
                                                required 
                                            />
                                        </div>

                                        {/* Tare Weight (KG) */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Tare Weight (KG) <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                name="tareWeightKg" 
                                                value={formData.tareWeightKg} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Gross Capacity (KG) */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Gross Capacity (KG) <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                name="grossCapacityKg" 
                                                value={formData.grossCapacityKg} 
                                                onChange={handleInputChange} 
                                                required 
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
                                            Save Bin
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
                                    <h2 className="text-2xl font-bold">Edit Bin</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Bin ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="binId" 
                                                value={formData.binId} 
                                                onChange={handleInputChange} 
                                                disabled 
                                            />
                                        </div>

                                        {/* Bin Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="binName" 
                                                value={formData.binName} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Bin Short Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="binShortName" 
                                                value={formData.binShortName} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Bin Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Bin Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="binType"
                                                value={formData.binType}
                                                onChange={handleInputChange}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                required
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="GENERAL">GENERAL</option>
                                                <option value="HAZARDOUS">HAZARDOUS</option>
                                                <option value="RECYCLABLE">RECYCLABLE</option>
                                                <option value="SCRAP">SCRAP</option>
                                                <option value="REWORK">REWORK</option>
                                            </select>
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Color <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="color" 
                                                value={formData.color} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Tare Weight (KG) */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Tare Weight (KG) <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                name="tareWeightKg" 
                                                value={formData.tareWeightKg} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Gross Capacity (KG) */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Gross Capacity (KG) <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                name="grossCapacityKg" 
                                                value={formData.grossCapacityKg} 
                                                onChange={handleInputChange} 
                                                required 
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
                                            Update Bin
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCancelItemDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsCancelItemDialogOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className={`${cancelledBins.has(binToCancel?.binId || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledBins.has(binToCancel?.binId || '') ? "Restore Collection Bin" : "Cancel Collection Bin"}
                                    </h2>
                                    <button
                                        onClick={() => setIsCancelItemDialogOpen(false)}
                                        className="text-white hover:opacity-80 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to {cancelledBins.has(binToCancel?.binId || '') ? 'restore' : 'cancel'} <strong>{binToCancel?.binName}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledBins.has(binToCancel?.binId || '') 
                                            ? "This will restore the collection bin and set its active status to true."
                                            : "This will cancel the collection bin and set its active status to false."}
                                    </p>

                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsCancelItemDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmCancelItem}
                                            className={`${cancelledBins.has(binToCancel?.binId || '') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledBins.has(binToCancel?.binId || '') ? "Restore" : "Cancel"}
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
