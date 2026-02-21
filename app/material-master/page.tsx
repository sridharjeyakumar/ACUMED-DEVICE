'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { coaChecklistAPI, materialAPI } from "@/services/api";

interface Material {
    material_id: string;
    material_name: string;
    material_short_name: string;
    uom: string;
    material_category_id?: string;
    material_type: string; // "RM" or "PM"
    material_spec?: string;
    safety_stock_qty?: number;
    re_order_qty?: number;
    min_order_qty?: number;
    lead_time_days_min?: number | string; // Can be number or "??"
    lead_time_days_max?: number | string; // Can be number or "??"
    shelf_life_in_months?: number;
    qc_required?: boolean;
    coa_checklist_id?: string;
    material_image?: string;
    material_image_icon?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}

// Helper function to format dates consistently
function formatDateTime(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

export default function MaterialMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [materialToCancel, setMaterialToCancel] = useState<Material | null>(null);
    const [cancelledMaterials, setCancelledMaterials] = useState<Set<string>>(new Set());
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [materialCategoryMap, setMaterialCategoryMap] = useState<Map<string, string>>(new Map());
    const [coaChecklistMap, setCoaChecklistMap] = useState<Map<string, string>>(new Map());
    const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
    const [checklists, setChecklists] = useState<any[]>([]);
    
    const isSubmittingRef = useRef(false);

    const [formData, setFormData] = useState({
        material_id: "",
        material_name: "",
        material_short_name: "",
        uom: "KGS",
        material_category_id: "",
        material_type: "RM",
        material_spec: "",
        safety_stock_qty: "",
        re_order_qty: "",
        min_order_qty: "",
        lead_time_days_min: "",
        lead_time_days_max: "",
        shelf_life_in_months: "",
        qc_required: false,
        coa_checklist_id: "",
        material_image: "",
        material_image_icon: "",
        active: true,
    });

    // Load materials from API
    const loadMaterials = async () => {
        try {
            setLoading(true);
            if (!materialAPI || !materialAPI.getAll) {
                throw new Error('Material API is not available. Please check the API service configuration.');
            }
            const data = await materialAPI.getAll();
            setMaterials(data);
            
            // Initialize maps for ID lookups (in real app, fetch from APIs)
            const categoryMap = new Map<string, string>();
            categoryMap.set("M01", "Raw Material Category");
            categoryMap.set("M02", "Packing Material Category");
            categoryMap.set("M03", "Carton Category");
            setMaterialCategoryMap(categoryMap);

            const coaMap = new Map<string, string>();
            coaMap.set("CL02", "COA Checklist 2");
            setCoaChecklistMap(coaMap);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load materials",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Load materials on component mount
    useEffect(() => {
        loadMaterials();
    }, []);
useEffect(() => {
    const loadProducts = async () => {
        try {
            const data = await coaChecklistAPI.getAll();
            setChecklists(data);
        } catch (error) {
            console.error("Failed to load products", error);
        }
    };
    loadProducts();
}, []);
    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                material_id: "",
                material_name: "",
                material_short_name: "",
                uom: "KGS",
                material_category_id: "",
                material_type: "RM",
                material_spec: "",
                safety_stock_qty: "",
                re_order_qty: "",
                min_order_qty: "",
                lead_time_days_min: "",
                lead_time_days_max: "",
                shelf_life_in_months: "",
                qc_required: false,
                coa_checklist_id: "",
                material_image: "",
                material_image_icon: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const filteredMaterials = materials.filter((material) => {
        const matchesSearch = material.material_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            material.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            material.material_short_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "true" && material.active === true) ||
            (filterActive === "false" && material.active === false);
        
        const matchesType = filterType === "all" || material.material_type === filterType;
        
        const matchesCategory = filterCategory === "all" || material.material_category_id === filterCategory;
        
        return matchesSearch && matchesActive && matchesType && matchesCategory;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredMaterials.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, filterType, filterCategory, rowsPerPage]);

    const uniqueCategories = Array.from(new Set(materials.map(m => m.material_category_id).filter(c => c)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            // Format the data before sending
            const formattedData: any = {
                material_id: formData.material_id,
                material_name: formData.material_name,
                material_short_name: formData.material_short_name,
                uom: formData.uom,
                material_category_id: formData.material_category_id || undefined,
                material_type: formData.material_type,
                material_spec: formData.material_spec || undefined,
                safety_stock_qty: formData.safety_stock_qty ? Number(formData.safety_stock_qty) : undefined,
                re_order_qty: formData.re_order_qty ? Number(formData.re_order_qty) : undefined,
                min_order_qty: formData.min_order_qty ? Number(formData.min_order_qty) : undefined,
                lead_time_days_min: formData.lead_time_days_min ? Number(formData.lead_time_days_min) : undefined,
                lead_time_days_max: formData.lead_time_days_max ? Number(formData.lead_time_days_max) : undefined,
                shelf_life_in_months: formData.shelf_life_in_months ? Number(formData.shelf_life_in_months) : undefined,
                qc_required: formData.qc_required,
                coa_checklist_id: formData.coa_checklist_id || undefined,
                material_image: formData.material_image || undefined,
                material_image_icon: formData.material_image_icon || undefined,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            };

            await materialAPI.create(formattedData);
            toast({
                title: "Success",
                description: "Material created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                material_id: "",
                material_name: "",
                material_short_name: "",
                uom: "KGS",
                material_category_id: "",
                material_type: "RM",
                material_spec: "",
                safety_stock_qty: "",
                re_order_qty: "",
                min_order_qty: "",
                lead_time_days_min: "",
                lead_time_days_max: "",
                shelf_life_in_months: "",
                qc_required: false,
                coa_checklist_id: "",
                material_image: "",
                material_image_icon: "",
                active: true,
            });
            loadMaterials();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create material",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (material: Material) => {
        setSelectedMaterial(material);
        setFormData({
            material_id: material.material_id,
            material_name: material.material_name,
            material_short_name: material.material_short_name,
            uom: material.uom,
            material_category_id: material.material_category_id || "",
            material_type: material.material_type,
            material_spec: material.material_spec || "",
            safety_stock_qty: material.safety_stock_qty?.toString() || "",
            re_order_qty: material.re_order_qty?.toString() || "",
            min_order_qty: material.min_order_qty?.toString() || "",
            lead_time_days_min: material.lead_time_days_min?.toString() || "",
            lead_time_days_max: material.lead_time_days_max?.toString() || "",
            shelf_life_in_months: material.shelf_life_in_months?.toString() || "",
            qc_required: material.qc_required || false,
            coa_checklist_id: material.coa_checklist_id || "",
            material_image: material.material_image || "",
            material_image_icon: material.material_image_icon || "",
            active: material.active !== undefined ? material.active : true,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            // Format the data before sending
            const formattedData: any = {
                material_name: formData.material_name,
                material_short_name: formData.material_short_name,
                uom: formData.uom,
                material_category_id: formData.material_category_id || undefined,
                material_type: formData.material_type,
                material_spec: formData.material_spec || undefined,
                safety_stock_qty: formData.safety_stock_qty ? Number(formData.safety_stock_qty) : undefined,
                re_order_qty: formData.re_order_qty ? Number(formData.re_order_qty) : undefined,
                min_order_qty: formData.min_order_qty ? Number(formData.min_order_qty) : undefined,
                lead_time_days_min: formData.lead_time_days_min ? Number(formData.lead_time_days_min) : undefined,
                lead_time_days_max: formData.lead_time_days_max ? Number(formData.lead_time_days_max) : undefined,
                shelf_life_in_months: formData.shelf_life_in_months ? Number(formData.shelf_life_in_months) : undefined,
                qc_required: formData.qc_required,
                coa_checklist_id: formData.coa_checklist_id || undefined,
                material_image: formData.material_image || undefined,
                material_image_icon: formData.material_image_icon || undefined,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            };

            await materialAPI.update(selectedMaterial!.material_id, formattedData);
            toast({
                title: "Success",
                description: "Material updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedMaterial(null);
            loadMaterials();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update material",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleCancel = (material: Material) => {
        setMaterialToCancel(material);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!materialToCancel) return;
        
        const isCancelled = cancelledMaterials.has(materialToCancel.material_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await materialAPI.update(materialToCancel.material_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledMaterials(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(materialToCancel.material_id);
                    toast({
                        title: "Restored",
                        description: `Material ${materialToCancel.material_name} has been restored`,
                    });
                } else {
                    newSet.add(materialToCancel.material_id);
                    toast({
                        title: "Cancelled",
                        description: `Material ${materialToCancel.material_name} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadMaterials(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setMaterialToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} material`,
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-auto lg:ml-64">
                    <div className="p-8 flex items-center justify-center">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Material Master</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Manage and configure material specifications and inventory parameters</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add New Material</span>
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
                                        placeholder="Search by Material ID, Name, or Shortname..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredMaterials.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredMaterials.length)} OF {filteredMaterials.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="end">
                                        <div className="p-4 border-b border-border">
                                            <h3 className="font-semibold text-sm text-foreground">Filters</h3>
                                        </div>
                                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-foreground">Active Status</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="mat-active-all" 
                                                            name="matActiveFilter"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="mat-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="mat-active-true" 
                                                            name="matActiveFilter"
                                                            checked={filterActive === "true"}
                                                            onChange={() => setFilterActive("true")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="mat-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="mat-active-false" 
                                                            name="matActiveFilter"
                                                            checked={filterActive === "false"}
                                                            onChange={() => setFilterActive("false")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="mat-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Material Type</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="mat-type-all" 
                                                            name="matTypeFilter"
                                                            checked={filterType === "all"}
                                                            onChange={() => setFilterType("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="mat-type-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="mat-type-rm" 
                                                            name="matTypeFilter"
                                                            checked={filterType === "RM"}
                                                            onChange={() => setFilterType("RM")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="mat-type-rm" className="text-sm font-normal cursor-pointer text-foreground">Raw Material (RM)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="mat-type-pm" 
                                                            name="matTypeFilter"
                                                            checked={filterType === "PM"}
                                                            onChange={() => setFilterType("PM")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="mat-type-pm" className="text-sm font-normal cursor-pointer text-foreground">Packing Material (PM)</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            {uniqueCategories.length > 0 && (
                                                <div className="space-y-3 pt-3 border-t border-border">
                                                    <Label className="text-sm font-semibold text-foreground">Material Category</Label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="mat-category-all" 
                                                                name="matCategoryFilter"
                                                                checked={filterCategory === "all"}
                                                                onChange={() => setFilterCategory("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="mat-category-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueCategories.map((category) => (
                                                            <div key={category} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`mat-category-${category}`} 
                                                                    name="matCategoryFilter"
                                                                    checked={filterCategory === category}
                                                                    onChange={() => setFilterCategory(category)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`mat-category-${category}`} className="text-sm font-normal cursor-pointer text-foreground">
                                                                    {category} {materialCategoryMap.get(category) ? `- ${materialCategoryMap.get(category)}` : ''}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">No. of rows per screen</Label>
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-border bg-muted/30">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => {
                                                    setFilterActive("all");
                                                    setFilterType("all");
                                                    setFilterCategory("all");
                                                }}
                                            >
                                                Clear Filters
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
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Name</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Short Name</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">UOM</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Category ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Type</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Specification</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Safety Stock Quantity</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Reorder Quantity</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Minimum Order Quantity</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Lead Time (Min Days)</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Lead Time (Max Days)</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Shelf Life (Months)</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">QC Required</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">COA Checklist ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Image</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Material Image Icon</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Last Modified User ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Last Modified Date & Time</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Active</th>
    <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
  </tr>
</thead>
                                   <tbody className="divide-y divide-border">
  {paginatedMaterials.map((material, index) => {
    const isActive = material.active === true;

    return (
      <motion.tr
        key={material.material_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="hover:bg-muted/30 transition-colors"
      >
        {/* MATERIAL ID */}
        <td className="px-4 py-3 text-sm">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {material.material_id}
          </span>
        </td>

        <td className="px-4 py-3 text-sm ">
          {material.material_name || "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.material_short_name || "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.uom || "-"}
        </td>

        {/* MATERIAL CATEGORY */}
        <td className="px-4 py-3 text-sm">
          {material.material_category_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-600 font-mono text-xs w-fit">
                {material.material_category_id}
              </span>
              {materialCategoryMap.get(material.material_category_id) && (
                <span className="text-xs text-muted-foreground">
                  {materialCategoryMap.get(material.material_category_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.material_type || "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.material_spec || "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.safety_stock_qty ?? "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.re_order_qty ?? "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.min_order_qty ?? "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.lead_time_days_min ?? "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.lead_time_days_max ?? "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.shelf_life_in_months ?? "-"}
        </td>

        {/* QC REQUIRED */}
        <td className="px-4 py-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
            material.qc_required
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}>
            {material.qc_required ? "YES" : "NO"}
          </span>
        </td>

        {/* COA CHECKLIST */}
        <td className="px-4 py-3 text-sm">
          {material.coa_checklist_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-yellow-50 text-yellow-600 font-mono text-xs w-fit">
                {material.coa_checklist_id}
              </span>
              {coaChecklistMap.get(material.coa_checklist_id) && (
                <span className="text-xs text-muted-foreground">
                  {coaChecklistMap.get(material.coa_checklist_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.material_image || "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {material.material_image_icon || "-"}
        </td>

        {/* LAST MODIFIED USER */}
        <td className="px-4 py-3 text-sm">
          {material.last_modified_user_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs w-fit">
                {material.last_modified_user_id}
              </span>
              {userMap.get(material.last_modified_user_id) && (
                <span className="text-xs text-muted-foreground">
                  {userMap.get(material.last_modified_user_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {formatDateTime(material.last_modified_date_time)}
        </td>

        {/* ACTIVE STATUS */}
        <td className="px-4 py-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
            isActive
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}>
            {isActive ? "ACTIVE" : "CANCELLED"}
          </span>
        </td>

        {/* ACTIONS */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-2">

            <Button
              variant="ghost"
              size="sm"
              disabled={!isActive}
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) return;
                handleEdit(material);
              }}
              className={`${
                isActive
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <Pencil className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={!isActive}
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) return;
                handleCancel(material);
              }}
              className={`${
                isActive
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <X className="w-4 h-4" />
            </Button>

          </div>
        </td>
      </motion.tr>
    );
  })}
</tbody>
                                </table>
                            </div>
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    PAGE {currentPage} OF {totalPages || 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* Add Material Modal - Simplified for now */}
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
                                    <h2 className="text-2xl font-bold">Add New Material</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Material Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Material Information
                                            </h3>
                                        </div>

                                        {/* Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_id"
                                                value={formData.material_id}
                                                onChange={handleInputChange}
                                                placeholder="RM001"
                                                required
                                            />
                                        </div>

                                        {/* Material Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_name"
                                                value={formData.material_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter material name"
                                                required
                                            />
                                        </div>

                                        {/* Material Short Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_short_name"
                                                value={formData.material_short_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter short name"
                                                required
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                UOM <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="KGS">KGS</option>
                                                <option value="NOS">NOS</option>
                                                <option value="KG">KG</option>
                                                <option value="GMS">GMS</option>
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="CARTON">CARTON</option>
                                            </select>
                                        </div>

                                        {/* Material Category ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Category ID
                                            </label>
                                            <Input
                                                name="material_category_id"
                                                value={formData.material_category_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter category ID"
                                            />
                                        </div>

                                        {/* Material Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="material_type"
                                                value={formData.material_type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="RM">Raw Material (RM)</option>
                                                <option value="PM">Packing Material (PM)</option>
                                            </select>
                                        </div>

                                        {/* Specifications Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Specifications
                                            </h3>
                                        </div>

                                        {/* Material Spec */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Spec
                                            </label>
                                            <Input
                                                name="material_spec"
                                                value={formData.material_spec}
                                                onChange={handleInputChange}
                                                placeholder="Enter material specification"
                                            />
                                        </div>

                                        {/* Inventory Management Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Inventory Management
                                            </h3>
                                        </div>

                                        {/* Safety Stock Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Safety Stock Qty
                                            </label>
                                            <Input
                                                type="number"
                                                name="safety_stock_qty"
                                                value={formData.safety_stock_qty}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Re-order Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Re-order Qty
                                            </label>
                                            <Input
                                                type="number"
                                                name="re_order_qty"
                                                value={formData.re_order_qty}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Min Order Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Min Order Qty
                                            </label>
                                            <Input
                                                type="number"
                                                name="min_order_qty"
                                                value={formData.min_order_qty}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Shelf Life In Months */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Shelf Life In Months
                                            </label>
                                            <Input
                                                type="number"
                                                name="shelf_life_in_months"
                                                value={formData.shelf_life_in_months}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Lead Times Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Lead Times
                                            </h3>
                                        </div>

                                        {/* Lead Time Days Min */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Lead Time Days Min
                                            </label>
                                            <Input
                                                type="number"
                                                name="lead_time_days_min"
                                                value={formData.lead_time_days_min}
                                                onChange={handleInputChange}
                                                placeholder="Enter min days or leave empty"
                                            />
                                        </div>

                                        {/* Lead Time Days Max */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Lead Time Days Max
                                            </label>
                                            <Input
                                                type="number"
                                                name="lead_time_days_max"
                                                value={formData.lead_time_days_max}
                                                onChange={handleInputChange}
                                                placeholder="Enter max days or leave empty"
                                            />
                                        </div>

                                        {/* Quality Control Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Quality Control
                                            </h3>
                                        </div>

                                        {/* QC Required */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="qc_required_add"
                                                name="qc_required"
                                                checked={formData.qc_required}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="qc_required_add" className="text-sm font-semibold text-foreground">
                                                QC Required
                                            </label>
                                        </div>

                                        {/* COA Checklist ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                COA Checklist ID
                                            </label>
                                 
                                                                                                                                                                                                                              <select
        name="coa_checklist_id"
        value={formData.coa_checklist_id}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
        required
    >
        <option value="">Enter COA checklist ID</option>
        {checklists.map(product => (
            <option key={product.checklist_id} value={product.checklist_id}>
                {product.checklist_id}
            </option>
        ))}
    </select>
                                        </div>

                                        {/* Images Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Images
                                            </h3>
                                        </div>

                                        {/* Material Image */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Image
                                            </label>
                                            <Input
                                                name="material_image"
                                                value={formData.material_image}
                                                onChange={handleInputChange}
                                                placeholder="Enter image URL or path"
                                            />
                                        </div>

                                        {/* Material Image Icon */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Image Icon
                                            </label>
                                            <Input
                                                name="material_image_icon"
                                                value={formData.material_image_icon}
                                                onChange={handleInputChange}
                                                placeholder="Enter icon URL or path"
                                            />
                                        </div>

                                        {/* Status Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Status
                                            </h3>
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_add"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_add" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                        >
                                            Save Material
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Material Modal - Similar structure */}
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
                                    <h2 className="text-2xl font-bold">Edit Material</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Material Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Material Information
                                            </h3>
                                        </div>

                                        {/* Material ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_id"
                                                value={formData.material_id}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>

                                        {/* Material Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_name"
                                                value={formData.material_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter material name"
                                                required
                                            />
                                        </div>

                                        {/* Material Short Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="material_short_name"
                                                value={formData.material_short_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter short name"
                                                required
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                UOM <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="KGS">KGS</option>
                                                <option value="NOS">NOS</option>
                                                <option value="KG">KG</option>
                                                <option value="GMS">GMS</option>
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="CARTON">CARTON</option>
                                            </select>
                                        </div>

                                        {/* Material Category ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Category ID
                                            </label>
                                            <Input
                                                name="material_category_id"
                                                value={formData.material_category_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter category ID"
                                            />
                                        </div>

                                        {/* Material Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="material_type"
                                                value={formData.material_type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="RM">Raw Material (RM)</option>
                                                <option value="PM">Packing Material (PM)</option>
                                            </select>
                                        </div>

                                        {/* Specifications Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Specifications
                                            </h3>
                                        </div>

                                        {/* Material Spec */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Spec
                                            </label>
                                            <Input
                                                name="material_spec"
                                                value={formData.material_spec}
                                                onChange={handleInputChange}
                                                placeholder="Enter material specification"
                                            />
                                        </div>

                                        {/* Inventory Management Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Inventory Management
                                            </h3>
                                        </div>

                                        {/* Safety Stock Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Safety Stock Qty
                                            </label>
                                            <Input
                                                type="number"
                                                name="safety_stock_qty"
                                                value={formData.safety_stock_qty}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Re-order Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Re-order Qty
                                            </label>
                                            <Input
                                                type="number"
                                                name="re_order_qty"
                                                value={formData.re_order_qty}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Min Order Qty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Min Order Qty
                                            </label>
                                            <Input
                                                type="number"
                                                name="min_order_qty"
                                                value={formData.min_order_qty}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Shelf Life In Months */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Shelf Life In Months
                                            </label>
                                            <Input
                                                type="number"
                                                name="shelf_life_in_months"
                                                value={formData.shelf_life_in_months}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Lead Times Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Lead Times
                                            </h3>
                                        </div>

                                        {/* Lead Time Days Min */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Lead Time Days Min
                                            </label>
                                            <Input
                                                type="number"
                                                name="lead_time_days_min"
                                                value={formData.lead_time_days_min}
                                                onChange={handleInputChange}
                                                placeholder="Enter min days or leave empty"
                                            />
                                        </div>

                                        {/* Lead Time Days Max */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Lead Time Days Max
                                            </label>
                                            <Input
                                                type="number"
                                                name="lead_time_days_max"
                                                value={formData.lead_time_days_max}
                                                onChange={handleInputChange}
                                                placeholder="Enter max days or leave empty"
                                            />
                                        </div>

                                        {/* Quality Control Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Quality Control
                                            </h3>
                                        </div>

                                        {/* QC Required */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="qc_required_edit"
                                                name="qc_required"
                                                checked={formData.qc_required}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="qc_required_edit" className="text-sm font-semibold text-foreground">
                                                QC Required
                                            </label>
                                        </div>

                                        {/* COA Checklist ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                COA Checklist ID
                                            </label>
                                            <Input
                                                name="coa_checklist_id"
                                                value={formData.coa_checklist_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter COA checklist ID"
                                            />
                                        </div>

                                        {/* Images Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Images
                                            </h3>
                                        </div>

                                        {/* Material Image */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Image
                                            </label>
                                            <Input
                                                name="material_image"
                                                value={formData.material_image}
                                                onChange={handleInputChange}
                                                placeholder="Enter image URL or path"
                                            />
                                        </div>

                                        {/* Material Image Icon */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Material Image Icon
                                            </label>
                                            <Input
                                                name="material_image_icon"
                                                value={formData.material_image_icon}
                                                onChange={handleInputChange}
                                                placeholder="Enter icon URL or path"
                                            />
                                        </div>

                                        {/* Status Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Status
                                            </h3>
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_edit"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_edit" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                        >
                                            Update Material
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel/Restore Confirmation Dialog */}
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
                                <div className={`${cancelledMaterials.has(materialToCancel?.material_id || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledMaterials.has(materialToCancel?.material_id || '') ? "Restore Material" : "Cancel Material"}
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
                                        Are you sure you want to {cancelledMaterials.has(materialToCancel?.material_id || '') ? 'restore' : 'cancel'} <strong>{materialToCancel?.material_name}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledMaterials.has(materialToCancel?.material_id || '') 
                                            ? "This will restore the material and set its active status to true."
                                            : "This will cancel the material and set its active status to false."}
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
                                            className={`${cancelledMaterials.has(materialToCancel?.material_id || '') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledMaterials.has(materialToCancel?.material_id || '') ? "Restore" : "Cancel"}
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
