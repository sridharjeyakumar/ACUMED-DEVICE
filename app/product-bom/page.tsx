'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, FileText, ChevronDown, X } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { productBOMAPI } from "@/services/api";

interface BOMRecord {
    id: string;
    bomId: string;
    description: string;
    subtitle: string;
    productId: string;
    outputQty: number | null;
    outputUom: string;
    materialId: string;
    inputQty: number;
    inputUom: string;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

export default function ProductBOMPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [bomToCancel, setBomToCancel] = useState<BOMRecord | null>(null);
    const [cancelledBOMs, setCancelledBOMs] = useState<Set<string>>(new Set());
    const [selectedBOM, setSelectedBOM] = useState<BOMRecord | null>(null);
    const [filterProduct, setFilterProduct] = useState<string>("all");
    const [filterMaterial, setFilterMaterial] = useState<string>("all");
    const [records, setRecords] = useState<BOMRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        bomId: "",
        description: "",
        subtitle: "",
        productId: "",
        outputQty: "",
        outputUom: "",
        materialId: "",
        inputQty: "",
        inputUom: "",
        active: true,
    });

    // Helper function to convert snake_case to camelCase
    const toCamelCase = (data: any): BOMRecord => {
        return {
            id: data._id || `${data.bom_id}-${data.material_id}`,
            bomId: data.bom_id,
            description: data.bom_description,
            subtitle: "",
            productId: data.product_id,
            outputQty: data.output_qty !== null && data.output_qty !== undefined ? data.output_qty : null,
            outputUom: data.output_uom,
            materialId: data.material_id,
            inputQty: data.input_qty,
            inputUom: data.input_uom,
            lastModifiedUserId: data.last_modified_user_id || "",
            lastModifiedDateTime: data.last_modified_date_time ? new Date(data.last_modified_date_time).toLocaleString() : "",
            active: data.active !== false,
        };
    };

    // Helper function to convert camelCase to snake_case
    const toSnakeCase = (data: any) => {
        return {
            bom_id: data.bomId,
            bom_description: data.description,
            product_id: data.productId,
            output_qty: data.outputQty === '' || data.outputQty === null ? null : Number(data.outputQty),
            output_uom: data.outputUom,
            material_id: data.materialId,
            input_qty: data.inputQty ? Number(data.inputQty) : undefined,
            input_uom: data.inputUom,
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
            const data = await productBOMAPI.getAll();
            setRecords(data.map(toCamelCase));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load product BOMs",
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
                bomId: "",
                description: "",
                subtitle: "",
                productId: "",
                outputQty: "",
                outputUom: "",
                materialId: "",
                inputQty: "",
                inputUom: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const hardcodedRecords: BOMRecord[] = [
        {
            id: "1",
            bomId: "BM01",
            description: "DUVET",
            subtitle: "",
            productId: "P0001",
            outputQty: 3000,
            outputUom: "NOS",
            materialId: "RM001",
            inputQty: 1,
            inputUom: "KGS",
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "2",
            bomId: "BM01",
            description: "DUVET",
            subtitle: "",
            productId: "P0001",
            outputQty: 1200,
            outputUom: "NOS",
            materialId: "RM002",
            inputQty: 1,
            inputUom: "KGS",
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "3",
            bomId: "BM02",
            description: "DUVET XL",
            subtitle: "",
            productId: "P0002",
            outputQty: null,
            outputUom: "NOS",
            materialId: "RM003",
            inputQty: 1,
            inputUom: "KGS",
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "4",
            bomId: "BM02",
            description: "DUVET XL",
            subtitle: "",
            productId: "P0002",
            outputQty: null,
            outputUom: "NOS",
            materialId: "RM004",
            inputQty: 1,
            inputUom: "KGS",
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "5",
            bomId: "BM03",
            description: "DUVET Ultra",
            subtitle: "",
            productId: "P0003",
            outputQty: null,
            outputUom: "NOS",
            materialId: "RM005",
            inputQty: 1,
            inputUom: "KGS",
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
        },
        {
            id: "6",
            bomId: "BM03",
            description: "DUVET Ultra",
            subtitle: "",
            productId: "P0003",
            outputQty: null,
            outputUom: "NOS",
            materialId: "RM006",
            inputQty: 1,
            inputUom: "KGS",
            lastModifiedUserId: "",
            lastModifiedDateTime: "",
            active: true,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSend = toSnakeCase(formData);
            await productBOMAPI.create(dataToSend);
            toast({
                title: "Success",
                description: "Product BOM created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                bomId: "",
                description: "",
                subtitle: "",
                productId: "",
                outputQty: "",
                outputUom: "",
                materialId: "",
                inputQty: "",
                inputUom: "",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create product BOM",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (bom: BOMRecord) => {
        setSelectedBOM(bom);
        setFormData({
            bomId: bom.bomId,
            description: bom.description,
            subtitle: bom.subtitle,
            productId: bom.productId,
            outputQty: bom.outputQty?.toString() || "",
            outputUom: bom.outputUom,
            materialId: bom.materialId,
            inputQty: bom.inputQty.toString(),
            inputUom: bom.inputUom,
            active: bom.active !== undefined ? bom.active : true,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBOM) return;
        try {
            const dataToSend = toSnakeCase(formData);
            await productBOMAPI.update(selectedBOM.id, dataToSend);
            toast({
                title: "Success",
                description: "Product BOM updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedBOM(null);
            setFormData({
                bomId: "",
                description: "",
                subtitle: "",
                productId: "",
                outputQty: "",
                outputUom: "",
                materialId: "",
                inputQty: "",
                inputUom: "",
                active: true,
            });
            loadRecords();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update product BOM",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (bom: BOMRecord) => {
        setBomToCancel(bom);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!bomToCancel) return;
        
        const isCancelled = cancelledBOMs.has(bomToCancel.id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await productBOMAPI.update(bomToCancel.id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledBOMs(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(bomToCancel.id);
                    toast({
                        title: "Restored",
                        description: `Product BOM ${bomToCancel.bomId} has been restored`,
                    });
                } else {
                    newSet.add(bomToCancel.id);
                    toast({
                        title: "Cancelled",
                        description: `Product BOM ${bomToCancel.bomId} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadRecords(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setBomToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} product BOM`,
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product BOM</h1>
                                <p className="text-muted-foreground">Manage Bill of Materials definitions and resource mapping</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New BOM
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
                                        placeholder="Search by BOM ID or Description..."
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
                                                            id="bom-product-all" 
                                                            name="bomProductFilter"
                                                            checked={filterProduct === "all"}
                                                            onChange={() => setFilterProduct("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="bom-product-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {uniqueProducts.map((prod) => (
                                                        <div key={prod} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`bom-product-${prod}`} 
                                                                name="bomProductFilter"
                                                                checked={filterProduct === prod}
                                                                onChange={() => setFilterProduct(prod)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`bom-product-${prod}`} className="text-sm font-normal cursor-pointer">{prod}</Label>
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
                                                            id="bom-material-all" 
                                                            name="bomMaterialFilter"
                                                            checked={filterMaterial === "all"}
                                                            onChange={() => setFilterMaterial("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="bom-material-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {uniqueMaterials.map((mat) => (
                                                        <div key={mat} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`bom-material-${mat}`} 
                                                                name="bomMaterialFilter"
                                                                checked={filterMaterial === mat}
                                                                onChange={() => setFilterMaterial(mat)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`bom-material-${mat}`} className="text-sm font-normal cursor-pointer">{mat}</Label>
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
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-muted-foreground">Loading product BOMs...</div>
                                    </div>
                                ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">bom_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">bom description</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">product_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">output qty</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">output uom</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">material_id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">input qty</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">input uom</th>
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
                                                <td colSpan={12} className="px-6 py-12 text-center text-muted-foreground">
                                                    No product BOMs found
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
                                                <td className="px-6 py-6 align-top">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.bomId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 align-top">
                                                    <span className="text-sm font-semibold text-foreground">{item.description}</span>
                                                </td>
                                                <td className="px-6 py-6 align-top text-center">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.productId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-top">
                                                    {item.outputQty ? item.outputQty.toLocaleString() : ''}
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.outputUom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.materialId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-semibold text-foreground text-center align-top">
                                                    {item.inputQty}
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.inputUom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.lastModifiedUserId || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center align-top">
                                                    <span className="text-sm text-muted-foreground">
                                                        {item.lastModifiedDateTime || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-left align-top">
                                                    {(() => {
                                                        const isCancelled = cancelledBOMs.has(item.id);
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
                                                <td className="px-6 py-6 text-center align-top">
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
                                                            className={`${cancelledBOMs.has(item.id) ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={cancelledBOMs.has(item.id) ? "Restore product BOM" : "Cancel product BOM"}
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
                                    <h2 className="text-2xl font-bold">Add New BOM</h2>
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
                                                placeholder="BOM-XXX-XX" 
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

                                        {/* Line / Subtitle */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Line / Subtitle
                                            </label>
                                            <Input 
                                                name="subtitle" 
                                                value={formData.subtitle} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. HIGH PRECISION LINE" 
                                            />
                                        </div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="productId" 
                                                value={formData.productId} 
                                                onChange={handleInputChange} 
                                                placeholder="PRD-XXX-XX" 
                                                required
                                            />
                                        </div>

                                        {/* Output Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Output Qty
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="outputQty" 
                                                value={formData.outputQty} 
                                                onChange={handleInputChange} 
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Output UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Output UOM <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="outputUom" 
                                                value={formData.outputUom} 
                                                onChange={handleInputChange} 
                                                placeholder="NOS"
                                                required
                                            />
                                        </div>

                                        {/* Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="materialId" 
                                                value={formData.materialId} 
                                                onChange={handleInputChange} 
                                                placeholder="MAT-XXX-XX" 
                                                required
                                            />
                                        </div>

                                        {/* Input Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Input Qty <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="inputQty" 
                                                value={formData.inputQty} 
                                                onChange={handleInputChange} 
                                                required
                                            />
                                        </div>

                                        {/* Input UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Input UOM <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="inputUom" 
                                                value={formData.inputUom} 
                                                onChange={handleInputChange} 
                                                placeholder="KGS"
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
                                            Save BOM
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
                                    <h2 className="text-2xl font-bold">Edit BOM</h2>
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

                                        {/* Line / Subtitle */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Line / Subtitle
                                            </label>
                                            <Input 
                                                name="subtitle" 
                                                value={formData.subtitle} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. HIGH PRECISION LINE" 
                                            />
                                        </div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="productId" 
                                                value={formData.productId} 
                                                onChange={handleInputChange} 
                                                placeholder="PRD-XXX-XX" 
                                                required
                                            />
                                        </div>

                                        {/* Output Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Output Qty
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="outputQty" 
                                                value={formData.outputQty} 
                                                onChange={handleInputChange} 
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Output UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Output UOM <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="outputUom" 
                                                value={formData.outputUom} 
                                                onChange={handleInputChange} 
                                                placeholder="NOS"
                                                required
                                            />
                                        </div>

                                        {/* Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="materialId" 
                                                value={formData.materialId} 
                                                onChange={handleInputChange} 
                                                placeholder="MAT-XXX-XX" 
                                                required
                                            />
                                        </div>

                                        {/* Input Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Input Qty <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="inputQty" 
                                                value={formData.inputQty} 
                                                onChange={handleInputChange} 
                                                required
                                            />
                                        </div>

                                        {/* Input UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Input UOM <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="inputUom" 
                                                value={formData.inputUom} 
                                                onChange={handleInputChange} 
                                                placeholder="KGS"
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
                                            Update BOM
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
                                <div className={`${cancelledBOMs.has(bomToCancel?.id || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledBOMs.has(bomToCancel?.id || '') ? "Restore Product BOM" : "Cancel Product BOM"}
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
                                        Are you sure you want to {cancelledBOMs.has(bomToCancel?.id || '') ? 'restore' : 'cancel'} <strong>{bomToCancel?.description}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledBOMs.has(bomToCancel?.id || '') 
                                            ? "This will restore the product BOM and set its active status to true."
                                            : "This will cancel the product BOM and set its active status to false."}
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
                                            className={`${cancelledBOMs.has(bomToCancel?.id || '') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledBOMs.has(bomToCancel?.id || '') ? "Restore" : "Cancel"}
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



