'use client';

import { useState, useEffect, useCallback } from "react";
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
import { cartonCapacityAPI, cartonTypeAPI, packSizeAPI, productAPI } from "@/services/api";

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
interface Product {
    product_id: string;
    product_name: string;
    product_shortname: string;
    uom: string;
    product_category_id?: string;
    product_spec?: string;
    weight_per_piece?: number;
    weight_uom?: string;
    wipes_per_kg?: number;
    shelf_life_in_months?: number;
    storage_condition?: string;
    safety_stock_qty?: number;
    default_pack_size_id?: string;
    batch_prefix?: string;
    running_batch_sno?:number;
    product_image?: string;
    product_image_icon?: string;
    qc_required?: boolean;
    coa_checklist_id?: string;
    sterilization_required?: boolean;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}
interface CartonType {
    carton_type_id: string; // Char(2) - PK
    carton_type_name: string; // Char(100)
    carton_type_shortname: string; // Char(50)
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date; // Date
    active: boolean; // Boolean
}
interface PackSize {
    pack_size_id: string;
    pack_size_name: string;
    pack_size_short_name: string;
    qty_per_carton: number;
    uom: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
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
    const [products, setProducts] = useState<Product[]>([]);
    const [cartonTypes, setCartonTypes] = useState<CartonType[]>([]);
    const [packSizes, setPackSizes] = useState<PackSize[]>([]);
    const [isDuplicateId, setIsDuplicateId] = useState(false);
    
    
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
    const loadRecords = useCallback(async () => {
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
    }, [toast]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);
useEffect(() => {
    const loadProducts = async () => {
        try {
            const data = await productAPI.getAll();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        }
    };
    loadProducts();
}, []);
useEffect(() => {
    const loadProducts = async () => {
        try {
            const cortonData = await cartonTypeAPI.getAll();
            setCartonTypes(cortonData);
        } catch (error) {
            console.error("Failed to load carton", error);
        }
    };
    loadProducts();
}, []);
useEffect(() => {
    const loadProducts = async () => {
        try {
            const packData = await packSizeAPI.getAll();
            setPackSizes(packData);
        } catch (error) {
            console.error("Failed to load carton", error);
        }
    };
    loadProducts();
}, []);
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



    const filteredRecords = records.filter((item) => {
        const matchesSearch = item.cartonCapacityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.cartonCapacityId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesPackSize = filterPackSize === "all" || item.packSizeId === filterPackSize;
        const matchesMaterial = filterMaterial === "all" || item.packMatlId === filterMaterial;
        
        return matchesSearch && matchesPackSize && matchesMaterial;
    });

    const uniquePackSizes = Array.from(new Set(records.map(r => r.packSizeId)));
    const uniqueMaterials = Array.from(new Set(records.map(r => r.packMatlId)));

    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setFormData({ ...formData, [e.target.name]: e.target.value });
    // };
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // 1. Handle Checkboxes and exit early
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
        return; 
    }

    // 2. RUN VALIDATION (Does not block typing)
    if (name === "cartonCapacityId") {
        const exists = records.some(p => 
            p.cartonCapacityId?.toLowerCase() === value.trim().toLowerCase() && 
            p.cartonCapacityId !== selectedCapacity?.cartonCapacityId // Allow current ID during Edit
        );
        setIsDuplicateId(exists);
    }

    // 3. UPDATE STATE (This makes typing work!)
    setFormData(prev => ({
        ...prev,
        [name]: value 
    }));
};
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
                if (isDuplicateId) {
        toast({
            title: "ID Conflict",
            description: "Please enter a unique Carton Capacity ID before submitting.",
            variant: "destructive",
        });
        return;
    }
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

    const newActiveStatus = !capacityToCancel.active; // toggle current status

    try {
        await fetch(`http://localhost:3000/api/carton-capacities/${capacityToCancel.cartonCapacityId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            }),
        });

        // Update local set
        setCancelledCapacities(prev => {
            const newSet = new Set(prev);
            if (newActiveStatus) {
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

        loadRecords();
        setIsCancelItemDialogOpen(false);
        setCapacityToCancel(null);
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to cancel/restore carton capacity",
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
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search by Capacity ID or Name..."
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
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => {
                                                    setFilterPackSize("all");
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
        <span>Carton</span>
        <span>Capacity Id</span>
      </div>
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
      Carton Capacity Name
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
      Carton Capacity Shortname
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      Product Id
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      Pack Size Id
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      Pack Material Id
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      Carton Type Id
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      <div className="flex flex-col">
        <span>Carton</span>
        <span>Material Id</span>
      </div>
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      <div className="flex flex-col">
        <span>Packs Per</span>
        <span>Carton</span>
      </div>
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      <div className="flex flex-col">
        <span>Last Modified</span>
        <span>User Id</span>
      </div>
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      <div className="flex flex-col">
        <span>Last Modified</span>
        <span>Date & Time</span>
      </div>
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
      Active
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
      Actions
    </th>
  </tr>
</thead>
<tbody className="divide-y divide-border">
  {loading ? (
    <tr>
      <td colSpan={13} className="px-6 py-12 text-center text-muted-foreground">
        Loading carton capacities...
      </td>
    </tr>
  ) : filteredRecords.length === 0 ? (
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
        {/* Pill style IDs */}
        <td className="px-6 py-6 text-sm align-middle">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {item.cartonCapacityId}
          </span>
        </td>
        <td className="px-6 py-6 text-sm  text-foreground align-middle">
          {item.cartonCapacityName}
        </td>
        <td className="px-6 py-6 text-sm text-foreground align-middle">
          {item.cartonCapacityShortname}
        </td>
        <td className="px-6 py-6 text-center align-middle">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {item.productId}
          </span>
        </td>
        <td className="px-6 py-6 text-center align-middle">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {item.packSizeId}
          </span>
        </td>
        <td className="px-6 py-6 text-center align-middle">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {item.packMatlId}
          </span>
        </td>
        <td className="px-6 py-6 text-center align-middle">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {item.cartonTypeId}
          </span>
        </td>
        <td className="px-6 py-6 text-center align-middle">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {item.cartonMaterialId}
          </span>
        </td>

        {/* Other fields */}
        <td className="px-6 py-6 text-center align-middle">
          {item.packsPerCarton}
        </td>
        <td className="px-6 py-6 text-center align-middle text-muted-foreground">
          {item.lastModifiedUserId || "-"}
        </td>
        <td className="px-6 py-6 text-center align-middle text-muted-foreground">
          {item.lastModifiedDateTime || "-"}
        </td>

        {/* Active Status */}
        <td className="px-6 py-6 text-left align-middle">
          {(() => {
            const isCancelled = cancelledCapacities.has(item.cartonCapacityId);
            const displayActive = !isCancelled && item.active !== false;
            return (
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                  displayActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}
              >
                {displayActive ? "TRUE" : "FALSE"}
              </span>
            );
          })()}
        </td>

        {/* Actions */}
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
              disabled={!item.active}
              title={item.active ? "Edit carton capacity" : "Cannot edit inactive"}
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
              disabled={!item.active && !cancelledCapacities.has(item.cartonCapacityId)}
              className={`${
                item.active
                  ? cancelledCapacities.has(item.cartonCapacityId)
                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                    : "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              title={
                cancelledCapacities.has(item.cartonCapacityId)
                  ? "Restore carton capacity"
                  : "Cancel carton capacity"
              }
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
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
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Carton Capacity ID */}
                         
                             <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Carton Capacity ID  <span className="text-red-500">*</span>
    </label>
    <Input
        name="cartonCapacityId"
        value={formData.cartonCapacityId}
        onChange={handleInputChange}
        placeholder="Enter Carton Capacity ID"
        // In Edit mode, we usually disable the ID field to maintain data integrity
        disabled={isEditModalOpen} 
        className={isDuplicateId ? "border-red-500 focus-visible:ring-red-500 bg-red-50/50" : ""}
    />
    {isDuplicateId && (
        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
            <X className="w-3 h-3" /> Already exists in the table
        </p>
    )}
</div>
                                        {/* Carton Capacity Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Capacity Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="cartonCapacityName" 
                                                value={formData.cartonCapacityName} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Carton Capacity Shortname */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Capacity Shortname
                                            </label>
                                            <Input 
                                                name="cartonCapacityShortname" 
                                                value={formData.cartonCapacityShortname} 
                                                onChange={handleInputChange} 
                                                placeholder="Sterilization Carton" 
                                            />
                                        </div>

                                        {/* Product ID */}
                                    <div>
    <label className="block text-sm font-semibold text-foreground mb-2">
        Product ID <span className="text-red-500">*</span>
    </label>
    <select
        name="productId"
        value={formData.productId}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
        required
    >
        <option value="">Select a product</option>
        {products.map(product => (
            <option key={product.product_id} value={product.product_id}>
                {product.product_id}
            </option>
        ))}
    </select>
</div>

                                        {/* Pack Size ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size ID <span className="text-red-500">*</span>
                                            </label>
                     
                                                                                                                                      <select
        name="packSizeId"
        value={formData.packSizeId}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
        required
    >
        <option value="">Select a Pack Size</option>
        {packSizes.map(product => (
            <option key={product.pack_size_id} value={product.pack_size_id}>
                {product.pack_size_id}-{product.pack_size_name}
            </option>
        ))}
    </select>
                                        </div>

                                        {/* Pack Matl ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Matl ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="packMatlId" 
                                                value={formData.packMatlId} 
                                                onChange={handleInputChange} 
                                                placeholder="PM001" 
                                            />

                                        </div>

                                        {/* Carton Type ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Type ID <span className="text-red-500">*</span>
                                            </label>
                                 
                                              <select
        name="cartonTypeId"
        value={formData.cartonTypeId}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
        required
    >
        <option value="">Select a Carton Type</option>
        {cartonTypes.map(product => (
            <option key={product.carton_type_id} value={product.carton_type_id}>
                {product.carton_type_id}
            </option>
        ))}
    </select>
                                        </div>

  
                                        {/* Carton Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Material ID
                                            </label>
                                            <Input 
                                                name="cartonMaterialId" 
                                                value={formData.cartonMaterialId} 
                                                onChange={handleInputChange} 
                                                placeholder="PM004" 
                                            />
                                        </div>

                                        {/* Packs Per Carton */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packs Per Carton <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="packsPerCarton" 
                                                value={formData.packsPerCarton} 
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
                                            Save Carton Capacity
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
                                    <h2 className="text-2xl font-bold">Edit Carton Capacity</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Carton Capacity ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Capacity ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="cartonCapacityId" 
                                                value={formData.cartonCapacityId} 
                                                onChange={handleInputChange} 
                                                disabled
                                            />
                                        </div>

                                        {/* Carton Capacity Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Capacity Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="cartonCapacityName" 
                                                value={formData.cartonCapacityName} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Carton Capacity Shortname */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Capacity Shortname
                                            </label>
                                            <Input 
                                                name="cartonCapacityShortname" 
                                                value={formData.cartonCapacityShortname} 
                                                onChange={handleInputChange} 
                                                placeholder="Sterilization Carton" 
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
                                                placeholder="P0001" 
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
                                                placeholder="PK24" 
                                            />
                                        </div>

                                        {/* Pack Matl ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Matl ID
                                            </label>
                                            <Input 
                                                name="packMatlId" 
                                                value={formData.packMatlId} 
                                                onChange={handleInputChange} 
                                                placeholder="PM001" 
                                            />
                                        </div>

                                        {/* Carton Type ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Type ID
                                            </label>
                                            <Input 
                                                name="cartonTypeId" 
                                                value={formData.cartonTypeId} 
                                                onChange={handleInputChange} 
                                                placeholder="ST" 
                                            />
                                        </div>

                                        {/* Carton Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Carton Material ID
                                            </label>
                                            <Input 
                                                name="cartonMaterialId" 
                                                value={formData.cartonMaterialId} 
                                                onChange={handleInputChange} 
                                                placeholder="PM004" 
                                            />
                                        </div>

                                        {/* Packs Per Carton */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Packs Per Carton <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="packsPerCarton" 
                                                value={formData.packsPerCarton} 
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
                                            Update Carton Capacity
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



