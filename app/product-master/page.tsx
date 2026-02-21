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
import { coaChecklistAPI, productAPI } from "@/services/api";

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

export default function ProductMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [productToCancel, setProductToCancel] = useState<Product | null>(null);
    const [cancelledProducts, setCancelledProducts] = useState<Set<string>>(new Set());
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [productCategoryMap, setProductCategoryMap] = useState<Map<string, string>>(new Map());
    const [packSizeMap, setPackSizeMap] = useState<Map<string, string>>(new Map());
    const [coaChecklistMap, setCoaChecklistMap] = useState<Map<string, string>>(new Map());
    const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
    const [checklists, setChecklists] = useState<any[]>([]);
    
    const isSubmittingRef = useRef(false);

    const [formData, setFormData] = useState({
        product_id: "",
        product_name: "",
        product_shortname: "",
        uom: "NOS",
        product_category_id: "",
        product_spec: "",
        weight_per_piece: "",
        weight_uom: "GMS",
        wipes_per_kg: "",
        shelf_life_in_months: "",
        storage_condition: "",
        safety_stock_qty: "",
        default_pack_size_id: "",
        batch_prefix: "",
        running_batch_sno:"",
        product_image: "",
        product_image_icon: "",
        qc_required: false,
        coa_checklist_id: "",
        sterilization_required: false,
        active: true,
    });

    // Load products from API
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await productAPI.getAll();
            setProducts(data);
            
            // Initialize maps for ID lookups (in real app, fetch from APIs)
            const categoryMap = new Map<string, string>();
            // categoryMap.set("P01", "Category 1");
            // categoryMap.set("P02", "Category 2");
            setProductCategoryMap(categoryMap);

            const packMap = new Map<string, string>();
            // packMap.set("PK24", "24 Pack");
            setPackSizeMap(packMap);

            const coaMap = new Map<string, string>();
            // coaMap.set("CL01", "COA Checklist 1");
            setCoaChecklistMap(coaMap);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load products",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);
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
                product_id: "",
                product_name: "",
                product_shortname: "",
                uom: "NOS",
                product_category_id: "",
                product_spec: "",
                weight_per_piece: "",
                weight_uom: "GMS",
                wipes_per_kg: "",
                shelf_life_in_months: "",
                storage_condition: "",
                safety_stock_qty: "",
                default_pack_size_id: "",
                batch_prefix: "",
                running_batch_sno:"",
                product_image: "",
                product_image_icon: "",
                qc_required: false,
                coa_checklist_id: "",
                sterilization_required: false,
                active: true,
            });
        }
    }, [isAddModalOpen]);

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.product_shortname.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "true" && product.active === true) ||
            (filterActive === "false" && product.active === false);
        
        const matchesCategory = filterCategory === "all" || product.product_category_id === filterCategory;
        
        return matchesSearch && matchesActive && matchesCategory;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, filterCategory, rowsPerPage]);

    const uniqueCategories = Array.from(new Set(products.map(p => p.product_category_id).filter(c => c)));

    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    //     const { name, value, type } = e.target;
    //     if (type === 'checkbox') {
    //         const checked = (e.target as HTMLInputElement).checked;
    //         setFormData({ ...formData, [name]: checked });
    //     } else {
    //         setFormData({ ...formData, [name]: value });
    //     }
    // };
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
        // For number inputs, check if the value is empty string (user deleted it)
        if (value === '') {
            setFormData({ ...formData, [name]: '' }); // Set to empty string to clear
        } else {
            // Keep as string for the input field
            setFormData({ ...formData, [name]: value }); // REMOVED Number() conversion
        }
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
                product_id: formData.product_id,
                product_name: formData.product_name,
                product_shortname: formData.product_shortname,
                uom: formData.uom,
                product_category_id: formData.product_category_id || undefined,
                product_spec: formData.product_spec || undefined,
                weight_per_piece: formData.weight_per_piece ? Number(formData.weight_per_piece) : undefined,
                weight_uom: formData.weight_uom || undefined,
                wipes_per_kg: formData.wipes_per_kg ? Number(formData.wipes_per_kg) : undefined,
                shelf_life_in_months: formData.shelf_life_in_months ? Number(formData.shelf_life_in_months) : undefined,
                storage_condition: formData.storage_condition || undefined,
                safety_stock_qty: formData.safety_stock_qty ? Number(formData.safety_stock_qty) : undefined,
                default_pack_size_id: formData.default_pack_size_id || undefined,
                batch_prefix: formData.batch_prefix || undefined,
                running_batch_sno:formData.running_batch_sno||undefined,
                product_image: formData.product_image || undefined,
                product_image_icon: formData.product_image_icon || undefined,
                qc_required: formData.qc_required,
                coa_checklist_id: formData.coa_checklist_id || undefined,
                sterilization_required: formData.sterilization_required,
                active: formData.active,
                last_modified_user_id: "ADMIN",
            };

            await productAPI.create(formattedData);
            toast({
                title: "Success",
                description: "Product created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                product_id: "",
                product_name: "",
                product_shortname: "",
                uom: "NOS",
                product_category_id: "",
                product_spec: "",
                weight_per_piece: "",
                weight_uom: "GMS",
                wipes_per_kg: "",
                shelf_life_in_months: "",
                storage_condition: "",
                safety_stock_qty: "",
                default_pack_size_id: "",
                batch_prefix: "",
                running_batch_sno:"",
                product_image: "",
                product_image_icon: "",
                qc_required: false,
                coa_checklist_id: "",
                sterilization_required: false,
                active: true,
            });
            loadProducts();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create product",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            product_id: product.product_id,
            product_name: product.product_name,
            product_shortname: product.product_shortname,
            uom: product.uom,
            product_category_id: product.product_category_id || "",
            product_spec: product.product_spec || "",
            weight_per_piece: product.weight_per_piece?.toString() || "",
            weight_uom: product.weight_uom || "GMS",
            wipes_per_kg: product.wipes_per_kg?.toString() || "",
            shelf_life_in_months: product.shelf_life_in_months?.toString() || "",
            storage_condition: product.storage_condition || "",
            safety_stock_qty: product.safety_stock_qty?.toString() || "",
            default_pack_size_id: product.default_pack_size_id || "",
            batch_prefix: product.batch_prefix || "",
            running_batch_sno: product.running_batch_sno?.toString() || "",
            product_image: product.product_image || "",
            product_image_icon: product.product_image_icon || "",
            qc_required: product.qc_required || false,
            coa_checklist_id: product.coa_checklist_id || "",
            sterilization_required: product.sterilization_required || false,
            active: product.active !== undefined ? product.active : true,
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
            product_name: formData.product_name,
            product_shortname: formData.product_shortname,
            uom: formData.uom,
            product_category_id: formData.product_category_id || undefined,
            product_spec: formData.product_spec || undefined,
            weight_per_piece: formData.weight_per_piece ? Number(formData.weight_per_piece) : undefined,
            weight_uom: formData.weight_uom || undefined,
            wipes_per_kg: formData.wipes_per_kg ? Number(formData.wipes_per_kg) : undefined,
            shelf_life_in_months: formData.shelf_life_in_months ? Number(formData.shelf_life_in_months) : undefined,
            storage_condition: formData.storage_condition || undefined,
            safety_stock_qty: formData.safety_stock_qty ? Number(formData.safety_stock_qty) : undefined,
            default_pack_size_id: formData.default_pack_size_id || undefined,
            batch_prefix: formData.batch_prefix || undefined,
            running_batch_sno: formData.running_batch_sno !== undefined && formData.running_batch_sno !== '' 
    ? Number(formData.running_batch_sno) 
    : undefined,
            product_image: formData.product_image || undefined,
            product_image_icon: formData.product_image_icon || undefined,
            qc_required: formData.qc_required,
            coa_checklist_id: formData.coa_checklist_id || undefined,
            sterilization_required: formData.sterilization_required,
            active: formData.active,
            last_modified_user_id: "ADMIN",
        };
     Object.keys(formattedData).forEach(key => 
            formattedData[key] === undefined && delete formattedData[key]
        );
        // Call API to update
        await productAPI.update(selectedProduct!.product_id, formattedData);
        
        // Create updated product object with ALL fields preserved
        const updatedProduct: Product = {
            ...selectedProduct!,  // Keep all original fields
            ...formattedData,      // Override with updated fields
            last_modified_date_time: new Date(), // Update timestamp
            // Ensure all fields are properly typed
            product_id: selectedProduct!.product_id,
            // Preserve any fields that might be undefined in formattedData
            product_category_id: formattedData.product_category_id || selectedProduct!.product_category_id,
            product_spec: formattedData.product_spec || selectedProduct!.product_spec,
            weight_per_piece: formattedData.weight_per_piece !== undefined ? formattedData.weight_per_piece : selectedProduct!.weight_per_piece,
            weight_uom: formattedData.weight_uom || selectedProduct!.weight_uom,
            wipes_per_kg: formattedData.wipes_per_kg !== undefined ? formattedData.wipes_per_kg : selectedProduct!.wipes_per_kg,
            shelf_life_in_months: formattedData.shelf_life_in_months !== undefined ? formattedData.shelf_life_in_months : selectedProduct!.shelf_life_in_months,
            storage_condition: formattedData.storage_condition || selectedProduct!.storage_condition,
            safety_stock_qty: formattedData.safety_stock_qty !== undefined ? formattedData.safety_stock_qty : selectedProduct!.safety_stock_qty,
            default_pack_size_id: formattedData.default_pack_size_id || selectedProduct!.default_pack_size_id,
            batch_prefix: formattedData.batch_prefix || selectedProduct!.batch_prefix,
           running_batch_sno: formattedData.running_batch_sno !== undefined 
        ? formattedData.running_batch_sno 
        : selectedProduct!.running_batch_sno,
            product_image: formattedData.product_image || selectedProduct!.product_image,
            product_image_icon: formattedData.product_image_icon || selectedProduct!.product_image_icon,
            coa_checklist_id: formattedData.coa_checklist_id || selectedProduct!.coa_checklist_id,
        };

        // Update the products state
        setProducts(prevProducts => 
            prevProducts.map(product => 
                product.product_id === selectedProduct!.product_id 
                    ? updatedProduct
                    : product
            )
        );

        // Update cancelledProducts set if active status changed
        if (selectedProduct!.active !== formData.active) {
            setCancelledProducts(prev => {
                const newSet = new Set(prev);
                if (formData.active === false) {
                    newSet.add(selectedProduct!.product_id);
                } else {
                    newSet.delete(selectedProduct!.product_id);
                }
                return newSet;
            });
        }

        toast({
            title: "Success",
            description: "Product updated successfully",
        });
        
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to update product",
            variant: "destructive",
        });
    } finally {
        isSubmittingRef.current = false;
    }
};

    const handleCancel = (product: Product) => {
        setProductToCancel(product);
        setIsCancelItemDialogOpen(true);
    };

    // const confirmCancelItem = async () => {
    //     if (!productToCancel) return;
        
    //     const isCancelled = cancelledProducts.has(productToCancel.product_id);
    //     const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
    //     try {
    //         await productAPI.update(productToCancel.product_id, {
    //             active: newActiveStatus,
    //             last_modified_user_id: "ADMIN",
    //         });
            
    //         setCancelledProducts(prev => {
    //             const newSet = new Set(prev);
    //             if (isCancelled) {
    //                 newSet.delete(productToCancel.product_id);
    //                 toast({
    //                     title: "Restored",
    //                     description: `Product ${productToCancel.product_name} has been restored`,
    //                 });
    //             } else {
    //                 newSet.add(productToCancel.product_id);
    //                 toast({
    //                     title: "Cancelled",
    //                     description: `Product ${productToCancel.product_name} has been cancelled`,
    //                 });
    //             }
    //             return newSet;
    //         });
            
    //         loadProducts(); // Reload data from API
    //         setIsCancelItemDialogOpen(false);
    //         setProductToCancel(null);
    //     } catch (error: any) {
    //         toast({
    //             title: "Error",
    //             description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} product`,
    //             variant: "destructive",
    //         });
    //     }
    // };
const confirmCancelItem = async () => {
    if (!productToCancel) return;
    
    // Get the current active status directly from the product
    const currentActiveStatus = productToCancel.active === true;
    const newActiveStatus = !currentActiveStatus; // Toggle the status
    
    console.log("Current active status:", currentActiveStatus);
    console.log("New active status:", newActiveStatus);
    
    try {
        // Call API to update
        const response = await productAPI.update(productToCancel.product_id, {
            active: newActiveStatus,
            last_modified_user_id: "ADMIN",
        });
        
        console.log("API Response:", response);
        
        // Update local products state with the response from API
        setProducts(prevProducts => 
            prevProducts.map(product => 
                product.product_id === productToCancel.product_id 
                    ? response // Use the complete response from API
                    : product
            )
        );
        
        // Show success message
        toast({
            title: "Success",
            description: `Product ${productToCancel.product_name} has been ${newActiveStatus ? 'restored' : 'cancelled'}`,
        });
        
        setIsCancelItemDialogOpen(false);
        setProductToCancel(null);
        
    } catch (error: any) {
        console.error("Error in confirmCancelItem:", error);
        toast({
            title: "Error",
            description: error.message || `Failed to update product`,
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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Product Master</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Manage and configure product catalog</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add New Product</span>
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
                                        placeholder="Search by Product ID, Name, or Shortname..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProducts.length)} OF {filteredProducts.length}
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
                                                            id="prod-active-all" 
                                                            name="prodActiveFilter"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="prod-active-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="prod-active-true" 
                                                            name="prodActiveFilter"
                                                            checked={filterActive === "true"}
                                                            onChange={() => setFilterActive("true")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="prod-active-true" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="prod-active-false" 
                                                            name="prodActiveFilter"
                                                            checked={filterActive === "false"}
                                                            onChange={() => setFilterActive("false")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="prod-active-false" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            {uniqueCategories.length > 0 && (
                                                <div className="space-y-3 pt-3 border-t border-border">
                                                    <Label className="text-sm font-semibold text-foreground">Product Category</Label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="prod-category-all" 
                                                                name="prodCategoryFilter"
                                                                checked={filterCategory === "all"}
                                                                onChange={() => setFilterCategory("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="prod-category-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueCategories.map((category) => (
                                                            <div key={category} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`prod-category-${category}`} 
                                                                    name="prodCategoryFilter"
                                                                    checked={filterCategory === category}
                                                                    onChange={() => setFilterCategory(category)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`prod-category-${category}`} className="text-sm font-normal cursor-pointer text-foreground">
                                                                    {category} {productCategoryMap.get(category) ? `- ${productCategoryMap.get(category)}` : ''}
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
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product Name</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product Short Name</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">UOM</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product Category ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product Specification</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Weight per Piece</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Weight UOM</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Wipes per Kg</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Shelf Life (Months)</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Storage Condition</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Safety Stock Quantity</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Default Pack Size ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Batch Prefix</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Running Batch Serial No</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product Image</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product Image Icon</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">QC Required</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">COA Checklist ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Sterilization Required</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Last Modified User ID</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Last Modified Date & Time</th>
    <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Active</th>
    <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
  </tr>
</thead>
                                 <tbody className="divide-y divide-border">
  {paginatedProducts.map((product, index) => {
    const isActive = product.active === true;

    return (
      <motion.tr
        key={product.product_id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="hover:bg-muted/30 transition-colors"
      >
        {/* PRODUCT ID (Styled Badge) */}
        <td className="px-4 py-3 text-sm">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {product.product_id}
          </span>
        </td>

        <td className="px-4 py-3 text-sm">{product.product_name || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.product_shortname || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.uom || "-"}</td>

        {/* PRODUCT CATEGORY ID (ID + Name Styled) */}
        <td className="px-4 py-3 text-sm">
          {product.product_category_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-600 font-mono text-xs w-fit">
                {product.product_category_id}
              </span>
              {productCategoryMap.get(product.product_category_id) && (
                <span className="text-xs text-muted-foreground">
                  {productCategoryMap.get(product.product_category_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        <td className="px-4 py-3 text-sm">{product.product_spec || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.weight_per_piece ?? "-"}</td>
        <td className="px-4 py-3 text-sm">{product.weight_uom || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.wipes_per_kg ?? "-"}</td>
        <td className="px-4 py-3 text-sm">{product.shelf_life_in_months ?? "-"}</td>
        <td className="px-4 py-3 text-sm">{product.storage_condition || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.safety_stock_qty ?? "-"}</td>

        {/* DEFAULT PACK SIZE ID */}
        <td className="px-4 py-3 text-sm">
          {product.default_pack_size_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-purple-50 text-purple-600 font-mono text-xs w-fit">
                {product.default_pack_size_id}
              </span>
              {packSizeMap.get(product.default_pack_size_id) && (
                <span className="text-xs text-muted-foreground">
                  {packSizeMap.get(product.default_pack_size_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        <td className="px-4 py-3 text-sm">{product.batch_prefix || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.running_batch_sno ?? "-"}</td>
        <td className="px-4 py-3 text-sm">{product.product_image || "-"}</td>
        <td className="px-4 py-3 text-sm">{product.product_image_icon || "-"}</td>

        {/* QC REQUIRED BADGE */}
        <td className="px-4 py-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
            product.qc_required
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}>
            {product.qc_required ? "YES" : "NO"}
          </span>
        </td>

        {/* COA CHECKLIST ID */}
        <td className="px-4 py-3 text-sm">
          {product.coa_checklist_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-yellow-50 text-yellow-600 font-mono text-xs w-fit">
                {product.coa_checklist_id}
              </span>
              {coaChecklistMap.get(product.coa_checklist_id) && (
                <span className="text-xs text-muted-foreground">
                  {coaChecklistMap.get(product.coa_checklist_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        {/* STERILIZATION BADGE */}
        <td className="px-4 py-3">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
            product.sterilization_required
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}>
            {product.sterilization_required ? "YES" : "NO"}
          </span>
        </td>

        {/* LAST MODIFIED USER */}
        <td className="px-4 py-3 text-sm">
          {product.last_modified_user_id ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs w-fit">
                {product.last_modified_user_id}
              </span>
              {userMap.get(product.last_modified_user_id) && (
                <span className="text-xs text-muted-foreground">
                  {userMap.get(product.last_modified_user_id)}
                </span>
              )}
            </div>
          ) : "-"}
        </td>

        <td className="px-4 py-3 text-sm">
          {formatDateTime(product.last_modified_date_time)}
        </td>

        {/* ACTIVE BADGE */}
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
                handleEdit(product);
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
                handleCancel(product);
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

            {/* Add Product Modal - Simplified for now, can be expanded */}
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
                                    <h2 className="text-2xl font-bold">Add New Product</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Product Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Product Information
                                            </h3>
                                        </div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_id"
                                                value={formData.product_id}
                                                onChange={handleInputChange}
                                                placeholder="P0001"
                                                required
                                            />
                                        </div>

                                        {/* Product Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_name"
                                                value={formData.product_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter product name"
                                                required
                                            />
                                        </div>

                                        {/* Product Shortname */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Shortname <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_shortname"
                                                value={formData.product_shortname}
                                                onChange={handleInputChange}
                                                placeholder="Enter shortname"
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
                                                <option value="NOS">NOS</option>
                                                <option value="KG">KG</option>
                                                <option value="GMS">GMS</option>
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="CARTON">CARTON</option>
                                            </select>
                                        </div>

                                        {/* Product Category ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Category ID
                                            </label>
                                            <Input
                                                name="product_category_id"
                                                value={formData.product_category_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter category ID"
                                            />
                                        </div>

                                        {/* Specifications Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Specifications
                                            </h3>
                                        </div>

                                        {/* Product Spec */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Spec
                                            </label>
                                            <Input
                                                name="product_spec"
                                                value={formData.product_spec}
                                                onChange={handleInputChange}
                                                placeholder="Enter product specification"
                                            />
                                        </div>

                                        {/* Weight Per Piece */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Weight Per Piece
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                name="weight_per_piece"
                                                value={formData.weight_per_piece}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {/* Weight UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Weight UOM
                                            </label>
                                            <select
                                                name="weight_uom"
                                                value={formData.weight_uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="GMS">GMS</option>
                                                <option value="KG">KG</option>
                                                <option value="MG">MG</option>
                                                <option value="">-</option>
                                            </select>
                                        </div>

                                        {/* Wipes Per KG */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Wipes Per KG
                                            </label>
                                            <Input
                                                type="number"
                                                name="wipes_per_kg"
                                                value={formData.wipes_per_kg}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Inventory & Storage Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Inventory & Storage
                                            </h3>
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

                                        {/* Storage Condition */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Storage Condition
                                            </label>
                                            <Input
                                                name="storage_condition"
                                                value={formData.storage_condition}
                                                onChange={handleInputChange}
                                                placeholder="Enter storage condition"
                                            />
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

                                        {/* Default Pack Size ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Default Pack Size ID
                                            </label>
                                            <Input
                                                name="default_pack_size_id"
                                                value={formData.default_pack_size_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter pack size ID"
                                            />
                                        </div>

                                        {/* Batch No. Pattern */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch Prefix
                                            </label>
                                            <Input
                                                name="batch_prefix"
                                                value={formData.batch_prefix}
                                                onChange={handleInputChange}
                                                placeholder="Enter batch prefix"
                                            />
                                        </div>
                                          <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Running Batch Sno
                                            </label>
                                            <Input
                                                name="running_batch_sno"
                                                value={formData.running_batch_sno}
                                                onChange={handleInputChange}
                                                placeholder="Enter running batch sno"
                                            />
                                        </div>

                                        {/* Quality Control Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
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

                                        {/* Sterilization Required */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="sterilization_required_add"
                                                name="sterilization_required"
                                                checked={formData.sterilization_required}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="sterilization_required_add" className="text-sm font-semibold text-foreground">
                                                Sterilization Required
                                            </label>
                                        </div>

                                        {/* Images Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Images
                                            </h3>
                                        </div>

                                        {/* Product Image */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Image
                                            </label>
                                            <Input
                                                name="product_image"
                                                value={formData.product_image}
                                                onChange={handleInputChange}
                                                placeholder="Enter image URL or path"
                                            />
                                        </div>

                                        {/* Product Image Icon */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Image Icon
                                            </label>
                                            <Input
                                                name="product_image_icon"
                                                value={formData.product_image_icon}
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
                                            Save Product
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Product Modal - Similar structure */}
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
                                    <h2 className="text-2xl font-bold">Edit Product</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Product Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Product Information
                                            </h3>
                                        </div>

                                        {/* Product ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_id"
                                                value={formData.product_id}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>

                                        {/* Product Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_name"
                                                value={formData.product_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter product name"
                                                required
                                            />
                                        </div>

                                        {/* Product Shortname */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Shortname <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_shortname"
                                                value={formData.product_shortname}
                                                onChange={handleInputChange}
                                                placeholder="Enter shortname"
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
                                                <option value="NOS">NOS</option>
                                                <option value="KG">KG</option>
                                                <option value="GMS">GMS</option>
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="CARTON">CARTON</option>
                                            </select>
                                        </div>

                                        {/* Product Category ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Category ID
                                            </label>
                                            <Input
                                                name="product_category_id"
                                                value={formData.product_category_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter category ID"
                                            />
                                        </div>

                                        {/* Specifications Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Specifications
                                            </h3>
                                        </div>

                                        {/* Product Spec */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Spec
                                            </label>
                                            <Input
                                                name="product_spec"
                                                value={formData.product_spec}
                                                onChange={handleInputChange}
                                                placeholder="Enter product specification"
                                            />
                                        </div>

                                        {/* Weight Per Piece */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Weight Per Piece
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                name="weight_per_piece"
                                                value={formData.weight_per_piece}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {/* Weight UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Weight UOM
                                            </label>
                                            <select
                                                name="weight_uom"
                                                value={formData.weight_uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="GMS">GMS</option>
                                                <option value="KG">KG</option>
                                                <option value="MG">MG</option>
                                                <option value="">-</option>
                                            </select>
                                        </div>

                                        {/* Wipes Per KG */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Wipes Per KG
                                            </label>
                                            <Input
                                                type="number"
                                                name="wipes_per_kg"
                                                value={formData.wipes_per_kg}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Inventory & Storage Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Inventory & Storage
                                            </h3>
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

                                        {/* Storage Condition */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Storage Condition
                                            </label>
                                            <Input
                                                name="storage_condition"
                                                value={formData.storage_condition}
                                                onChange={handleInputChange}
                                                placeholder="Enter storage condition"
                                            />
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

                                        {/* Default Pack Size ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Default Pack Size ID
                                            </label>
                                            <Input
                                                name="default_pack_size_id"
                                                value={formData.default_pack_size_id}
                                                onChange={handleInputChange}
                                                placeholder="Enter pack size ID"
                                            />
                                        </div>

                                        {/* Batch No. Pattern */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch Prefix
                                            </label>
                                            <Input
                                                name="batch_prefix"
                                                value={formData.batch_prefix}
                                                onChange={handleInputChange}
                                                placeholder="Enter batch prefix"
                                            />
                                        </div>
                                            <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Running Batch Sno
                                            </label>
                                            <Input
                                                name="running_batch_sno"
                                                value={formData.running_batch_sno}
                                                onChange={handleInputChange}
                                                placeholder="Running Batch Sno"
                                            />
                                        </div>
                                        {/* Quality Control Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
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

                                        {/* Sterilization Required */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="sterilization_required_edit"
                                                name="sterilization_required"
                                                checked={formData.sterilization_required}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="sterilization_required_edit" className="text-sm font-semibold text-foreground">
                                                Sterilization Required
                                            </label>
                                        </div>

                                        {/* Images Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Images
                                            </h3>
                                        </div>

                                        {/* Product Image */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Image
                                            </label>
                                            <Input
                                                name="product_image"
                                                value={formData.product_image}
                                                onChange={handleInputChange}
                                                placeholder="Enter image URL or path"
                                            />
                                        </div>

                                        {/* Product Image Icon */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Image Icon
                                            </label>
                                            <Input
                                                name="product_image_icon"
                                                value={formData.product_image_icon}
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
                                            Update Product
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
                                <div className={`${cancelledProducts.has(productToCancel?.product_id || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledProducts.has(productToCancel?.product_id || '') ? "Restore Product" : "Cancel Product"}
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
                                        Are you sure you want to {cancelledProducts.has(productToCancel?.product_id || '') ? 'restore' : 'cancel'} <strong>{productToCancel?.product_name}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledProducts.has(productToCancel?.product_id || '') 
                                            ? "This will restore the product and set its active status to true."
                                            : "This will cancel the product and set its active status to false."}
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
                                                className={`${productToCancel?.active === true ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                        >
                                            {productToCancel?.active === true ? "Yes, Cancel" : "Yes, Restore"}
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

