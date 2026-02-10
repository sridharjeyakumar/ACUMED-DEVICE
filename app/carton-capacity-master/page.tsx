'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, Archive, ChevronDown, X } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cartonCapacityAPI } from "@/services/api";

interface CartonCapacityRecord {
    id: string;
    cartonCapacityId: string;
    cartonCapacityName: string;
    cartonCapacityShortname: string;
    productId: string;
    packSizeId: string;
    packMatlId: string;
    cartonTypeId: string;
    cartonMaterialId: string;
    packsPerCarton: number;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

export default function CartonCapacityMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [capacityToCancel, setCapacityToCancel] = useState<CartonCapacityRecord | null>(null);
    const [cancelledCapacities, setCancelledCapacities] = useState<Set<string>>(new Set());
    const [selectedCapacity, setSelectedCapacity] = useState<CartonCapacityRecord | null>(null);
    const [filterPackSize, setFilterPackSize] = useState<string>("all");
    const [filterMaterial, setFilterMaterial] = useState<string>("all");
    const [records, setRecords] = useState<CartonCapacityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        cartonCapacityId: "",
        cartonCapacityName: "",
        cartonCapacityShortname: "",
        productId: "",
        packSizeId: "",
        packMatlId: "",
        cartonTypeId: "",
        cartonMaterialId: "",
        packsPerCarton: "",
        active: true,
    });

    // Helper function to convert snake_case to camelCase
    const toCamelCase = (data: any): CartonCapacityRecord => {
        return {
            id: data._id || data.carton_capacity_id,
            cartonCapacityId: data.carton_capacity_id,
            cartonCapacityName: data.carton_capacity_name,
            cartonCapacityShortname: data.carton_capacity_shortname,
            productId: data.product_id,
            packSizeId: data.pack_size_id,
            packMatlId: data.pack_matl_id,
            cartonTypeId: data.carton_type_id,
            cartonMaterialId: data.carton_material_id,
            packsPerCarton: data.packs_per_carton,
            lastModifiedUserId: data.last_modified_user_id || "",
            lastModifiedDateTime: data.last_modified_date_time ? new Date(data.last_modified_date_time).toLocaleString() : "",
            active: data.active !== false,
        };
    };

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (data: any) => {
        return {
            carton_capacity_id: data.cartonCapacityId,
            carton_capacity_name: data.cartonCapacityName,
            carton_capacity_shortname: data.cartonCapacityShortname,
            product_id: data.productId,
            pack_size_id: data.packSizeId,
            pack_matl_id: data.packMatlId,
            carton_type_id: data.cartonTypeId,
            carton_material_id: data.cartonMaterialId,
            packs_per_carton: Number(data.packsPerCarton),
            active: data.active !== false,
        };
    };

    // Load data from API
    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const data = await cartonCapacityAPI.getAll();
            setRecords(data.map(toCamelCase));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load carton capacities",
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
                cartonCapacityId: "",
                cartonCapacityName: "",
                cartonCapacityShortname: "",
                productId: "",
                packSizeId: "",
                packMatlId: "",
                cartonTypeId: "",
                cartonMaterialId: "",
                packsPerCarton: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const hardcodedRecords: CartonCapacityRecord[] = [
        {
            id: "1",
            cartonCapacityId: "SDU24",
            cartonCapacityName: "DUVET Sterilization Carton - 24s",
            cartonCapacityShortname: "Sterilization Carton",
            productId: "P0001",
            packSizeId: "PK24",
            packMatlId: "PM001",
            cartonTypeId: "ST",
            cartonMaterialId: "PM004",
            packsPerCarton: 206,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "2",
            cartonCapacityId: "SDU12",
            cartonCapacityName: "DUVET Sterilization Carton - 12s",
            cartonCapacityShortname: "Sterilization Carton",
            productId: "P0001",
            packSizeId: "PK12",
            packMatlId: "PM002",
            cartonTypeId: "ST",
            cartonMaterialId: "PM004",
            packsPerCarton: 412,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "3",
            cartonCapacityId: "SDU06",
            cartonCapacityName: "DUVET Sterilization Carton - 6s",
            cartonCapacityShortname: "Sterilization Carton",
            productId: "P0001",
            packSizeId: "PK06",
            packMatlId: "PM003",
            cartonTypeId: "ST",
            cartonMaterialId: "PM004",
            packsPerCarton: 824,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "4",
            cartonCapacityId: "DDU24",
            cartonCapacityName: "DUVET Shipper Carton - 24s",
            cartonCapacityShortname: "Shipper Carton",
            productId: "P0001",
            packSizeId: "PK24",
            packMatlId: "PM001",
            cartonTypeId: "SH",
            cartonMaterialId: "PM005",
            packsPerCarton: 60,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "5",
            cartonCapacityId: "DDU12",
            cartonCapacityName: "DUVET Shipper Carton - 12s",
            cartonCapacityShortname: "Shipper Carton",
            productId: "P0001",
            packSizeId: "PK12",
            packMatlId: "PM002",
            cartonTypeId: "SH",
            cartonMaterialId: "PM005",
            packsPerCarton: 120,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "6",
            cartonCapacityId: "DDU06",
            cartonCapacityName: "DUVET Shipper Carton - 6s",
            cartonCapacityShortname: "Shipper Carton",
            productId: "P0001",
            packSizeId: "PK06",
            packMatlId: "PM003",
            cartonTypeId: "SH",
            cartonMaterialId: "PM005",
            packsPerCarton: 240,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "7",
            cartonCapacityId: "SXL24",
            cartonCapacityName: "DUVET XL Sterilization Carton - 24s",
            cartonCapacityShortname: "Sterilization Carton",
            productId: "P0002",
            packSizeId: "PK24",
            packMatlId: "PM006",
            cartonTypeId: "ST",
            cartonMaterialId: "PM007",
            packsPerCarton: 206,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "8",
            cartonCapacityId: "DXL24",
            cartonCapacityName: "DUVET XL Shipper Carton - 24s",
            cartonCapacityShortname: "Shipper Carton",
            productId: "P0002",
            packSizeId: "PK24",
            packMatlId: "PM006",
            cartonTypeId: "SH",
            cartonMaterialId: "PM008",
            packsPerCarton: 412,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "9",
            cartonCapacityId: "SUL06",
            cartonCapacityName: "DUVET Ultra Sterilization Carton - 6s",
            cartonCapacityShortname: "Sterilization Carton",
            productId: "P0003",
            packSizeId: "PK06",
            packMatlId: "PM009",
            cartonTypeId: "ST",
            cartonMaterialId: "PM010",
            packsPerCarton: 206,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "10",
            cartonCapacityId: "DUL06",
            cartonCapacityName: "DUVET Ultra Shipper Carton - 6s",
            cartonCapacityShortname: "Shipper Carton",
            productId: "P0003",
            packSizeId: "PK06",
            packMatlId: "PM009",
            cartonTypeId: "SH",
            cartonMaterialId: "PM011",
            packsPerCarton: 412,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "11",
            cartonCapacityId: "DNA24",
            cartonCapacityName: "Nanai Shipper Carton - 24s",
            cartonCapacityShortname: "Shipper Carton",
            productId: "P0004",
            packSizeId: "PK24",
            packMatlId: "PM012",
            cartonTypeId: "SH",
            cartonMaterialId: "PM013",
            packsPerCarton: 412,
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
    ];

    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.cartonCapacityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.cartonCapacityId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesPackSize = filterPackSize === "all" || item.packSizeId === filterPackSize;
        const matchesMaterial = filterMaterial === "all" || item.packMatlId === filterMaterial;
        
        return matchesSearch && matchesPackSize && matchesMaterial;
    });

    const uniquePackSizes = Array.from(new Set(records.map(r => r.packSizeId)));
    const uniqueMaterials = Array.from(new Set(records.map(r => r.packMatlId)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = toSnakeCase(formData);
            await cartonCapacityAPI.create(dataToSend);
            toast({
                title: "Success",
                description: "Carton capacity created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                cartonCapacityId: "",
                cartonCapacityName: "",
                cartonCapacityShortname: "",
                productId: "",
                packSizeId: "",
                packMatlId: "",
                cartonTypeId: "",
                cartonMaterialId: "",
                packsPerCarton: "",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create carton capacity",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (capacity: CartonCapacityRecord) => {
        setSelectedCapacity(capacity);
        setFormData({
            cartonCapacityId: capacity.cartonCapacityId,
            cartonCapacityName: capacity.cartonCapacityName,
            cartonCapacityShortname: capacity.cartonCapacityShortname,
            productId: capacity.productId,
            packSizeId: capacity.packSizeId,
            packMatlId: capacity.packMatlId,
            cartonTypeId: capacity.cartonTypeId,
            cartonMaterialId: capacity.cartonMaterialId,
            packsPerCarton: capacity.packsPerCarton.toString(),
            active: capacity.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCapacity) return;
        try {
            const dataToSend = toSnakeCase(formData);
            await cartonCapacityAPI.update(selectedCapacity.cartonCapacityId, dataToSend);
            toast({
                title: "Success",
                description: "Carton capacity updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedCapacity(null);
            setFormData({
                cartonCapacityId: "",
                cartonCapacityName: "",
                cartonCapacityShortname: "",
                productId: "",
                packSizeId: "",
                packMatlId: "",
                cartonTypeId: "",
                cartonMaterialId: "",
                packsPerCarton: "",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update carton capacity",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (capacity: CartonCapacityRecord) => {
        setCapacityToCancel(capacity);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!capacityToCancel) return;
        
        const isCancelled = cancelledCapacities.has(capacityToCancel.cartonCapacityId);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await cartonCapacityAPI.update(capacityToCancel.cartonCapacityId, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledCapacities(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(capacityToCancel.cartonCapacityId);
                    toast({
                        title: "Restored",
                        description: `Carton capacity ${capacityToCancel.cartonCapacityName} has been restored`,
                    });
                } else {
                    newSet.add(capacityToCancel.cartonCapacityId);
                    toast({
                        title: "Cancelled",
                        description: `Carton capacity ${capacityToCancel.cartonCapacityName} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadRecords(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setCapacityToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} carton capacity`,
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Carton Capacity</h1>
                                <p className="text-muted-foreground">Manage packaging capacity rules and pack-per-carton configurations</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Carton Capacity
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
                                <div className="flex-1 relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Capacity ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                                                <span className="text-xs font-medium">
                                                    {filterPackSize === "all" ? "All Pack Sizes" : filterPackSize}
                                                </span>
                                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-4xl p-4" align="start">
                                            <div className="flex flex-wrap gap-6 items-start">
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Pack Size</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="packsize-all" 
                                                                name="packSizeFilter"
                                                                checked={filterPackSize === "all"}
                                                                onChange={() => setFilterPackSize("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="packsize-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniquePackSizes.map((ps) => (
                                                            <div key={ps} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`packsize-${ps}`} 
                                                                    name="packSizeFilter"
                                                                    checked={filterPackSize === ps}
                                                                    onChange={() => setFilterPackSize(ps)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`packsize-${ps}`} className="text-sm font-normal cursor-pointer">{ps}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                                                <span className="text-xs font-medium">
                                                    {filterMaterial === "all" ? "All Materials" : filterMaterial}
                                                </span>
                                                <Filter className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-4xl p-4" align="start">
                                            <div className="flex flex-wrap gap-6 items-start">
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Material</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="material-all" 
                                                                name="materialFilter"
                                                                checked={filterMaterial === "all"}
                                                                onChange={() => setFilterMaterial("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="material-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueMaterials.map((mat) => (
                                                            <div key={mat} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`material-${mat}`} 
                                                                    name="materialFilter"
                                                                    checked={filterMaterial === mat}
                                                                    onChange={() => setFilterMaterial(mat)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`material-${mat}`} className="text-sm font-normal cursor-pointer">{mat}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-{filteredRecords.length} OF {records.length} RECORDS
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-muted-foreground">Loading carton capacities...</div>
                                    </div>
                                ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>carton_</span>
                                                    <span>capacity_id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">carton capacity name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">carton capacity shortname</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">product_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">pack size_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">pack matl_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">carton type_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>carton</span>
                                                    <span>material_id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>packs per</span>
                                                    <span>carton</span>
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
                                        {filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="px-6 py-12 text-center text-muted-foreground">
                                                    No carton capacities found
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
                                                <td className="px-6 py-6 text-sm font-semibold text-foreground align-middle">
                                                    {item.cartonCapacityId}
                                                </td>
                                                <td className="px-6 py-6 align-middle">
                                                    <span className="text-sm font-semibold text-foreground">{item.cartonCapacityName}</span>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                    {item.cartonCapacityShortname}
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.productId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.packSizeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.packMatlId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.cartonTypeId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.cartonMaterialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.packsPerCarton}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.lastModifiedUserId || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.lastModifiedDateTime || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-left align-middle">
                                                    {(() => {
                                                        const isCancelled = cancelledCapacities.has(item.cartonCapacityId);
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
                                                            className="text-foreground hover:text-foreground hover:bg-muted"
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
                                                            className={`${cancelledCapacities.has(item.cartonCapacityId) ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={cancelledCapacities.has(item.cartonCapacityId) ? "Restore carton capacity" : "Cancel carton capacity"}
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
                                )}
                            </div>

                            {!loading && (
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-muted-foreground" disabled>Previous</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-muted-foreground" disabled>Next</Button>
                                </div>
                            </div>
                            )}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Carton Capacity</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity ID <span className="text-red-500">*</span></label>
                                            <Input name="cartonCapacityId" value={formData.cartonCapacityId} onChange={handleInputChange} placeholder="SDU24" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity Shortname</label>
                                            <Input name="cartonCapacityShortname" value={formData.cartonCapacityShortname} onChange={handleInputChange} placeholder="Sterilization Carton" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity Name <span className="text-red-500">*</span></label>
                                        <Input name="cartonCapacityName" value={formData.cartonCapacityName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID</label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="P0001" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID</label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="PK24" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Matl ID</label>
                                            <Input name="packMatlId" value={formData.packMatlId} onChange={handleInputChange} placeholder="PM001" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Type ID</label>
                                            <Input name="cartonTypeId" value={formData.cartonTypeId} onChange={handleInputChange} placeholder="ST" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Material ID</label>
                                            <Input name="cartonMaterialId" value={formData.cartonMaterialId} onChange={handleInputChange} placeholder="PM004" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Packs Per Carton <span className="text-red-500">*</span></label>
                                            <Input type="number" name="packsPerCarton" value={formData.packsPerCarton} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save</Button>
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
                                    <h2 className="text-2xl font-bold">Edit Carton Capacity</h2>
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
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity ID <span className="text-red-500">*</span></label>
                                            <Input name="cartonCapacityId" value={formData.cartonCapacityId} onChange={handleInputChange} placeholder="SDU24" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity Shortname</label>
                                            <Input name="cartonCapacityShortname" value={formData.cartonCapacityShortname} onChange={handleInputChange} placeholder="Sterilization Carton" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Carton Capacity Name <span className="text-red-500">*</span></label>
                                        <Input name="cartonCapacityName" value={formData.cartonCapacityName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Product ID</label>
                                            <Input name="productId" value={formData.productId} onChange={handleInputChange} placeholder="P0001" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Size ID</label>
                                            <Input name="packSizeId" value={formData.packSizeId} onChange={handleInputChange} placeholder="PK24" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Pack Matl ID</label>
                                            <Input name="packMatlId" value={formData.packMatlId} onChange={handleInputChange} placeholder="PM001" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Type ID</label>
                                            <Input name="cartonTypeId" value={formData.cartonTypeId} onChange={handleInputChange} placeholder="ST" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Carton Material ID</label>
                                            <Input name="cartonMaterialId" value={formData.cartonMaterialId} onChange={handleInputChange} placeholder="PM004" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Packs Per Carton <span className="text-red-500">*</span></label>
                                            <Input type="number" name="packsPerCarton" value={formData.packsPerCarton} onChange={handleInputChange} required />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update</Button>
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
                                <div className={`${cancelledCapacities.has(capacityToCancel?.cartonCapacityId || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledCapacities.has(capacityToCancel?.cartonCapacityId || '') ? "Restore Carton Capacity" : "Cancel Carton Capacity"}
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
                                        Are you sure you want to {cancelledCapacities.has(capacityToCancel?.cartonCapacityId || '') ? 'restore' : 'cancel'} <strong>{capacityToCancel?.cartonCapacityName}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledCapacities.has(capacityToCancel?.cartonCapacityId || '') 
                                            ? "This will restore the carton capacity and set its active status to true."
                                            : "This will cancel the carton capacity and set its active status to false."}
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
                                            className={`${cancelledCapacities.has(capacityToCancel?.cartonCapacityId || '') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledCapacities.has(capacityToCancel?.cartonCapacityId || '') ? "Restore" : "Cancel"}
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



