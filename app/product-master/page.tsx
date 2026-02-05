'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { productAPI } from "@/services/api";

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
    batch_no_pattern?: string;
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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
        batch_no_pattern: "",
        product_image: "",
        product_image_icon: "",
        qc_required: false,
        coa_checklist_id: "",
        sterilization_required: false,
        active: true,
    });

    // Load products from API
    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productAPI.getAll();
            setProducts(data);
            
            // Initialize maps for ID lookups (in real app, fetch from APIs)
            const categoryMap = new Map<string, string>();
            categoryMap.set("P01", "Category 1");
            categoryMap.set("P02", "Category 2");
            setProductCategoryMap(categoryMap);

            const packMap = new Map<string, string>();
            packMap.set("PK24", "24 Pack");
            setPackSizeMap(packMap);

            const coaMap = new Map<string, string>();
            coaMap.set("CL01", "COA Checklist 1");
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
    };

    useEffect(() => {
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
                batch_no_pattern: "",
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
            await productAPI.create(formData);
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
                batch_no_pattern: "",
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
            batch_no_pattern: product.batch_no_pattern || "",
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
            await productAPI.update(selectedProduct!.product_id, formData);
            toast({
                title: "Success",
                description: "Product updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            loadProducts();
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

    const handleDelete = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await productAPI.delete(selectedProduct!.product_id);
            toast({
                title: "Success",
                description: "Product deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedProduct(null);
            loadProducts();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete product",
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
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">product_id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">product_name</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">product_shortname</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">uom</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">product category id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">product spec</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">weight per piece</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">weight uom</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">wipes per KG</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">shelf life in months</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">storage condition</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">safety stock qty</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">default pack size id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">batch no. pattern</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">product image</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">product image icon</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">QC required</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">COA checklist_id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Sterilization required</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">last modified user id</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">last modified date & time</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Active</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedProducts.map((product, index) => (
                                            <motion.tr
                                                key={product.product_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{product.product_id}</td>
                                                <td className="px-4 py-3 text-sm font-semibold">{product.product_name}</td>
                                                <td className="px-4 py-3 text-sm">{product.product_shortname}</td>
                                                <td className="px-4 py-3 text-sm">{product.uom}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {product.product_category_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-muted-foreground">{product.product_category_id}</span>
                                                            {productCategoryMap.get(product.product_category_id) && (
                                                                <span className="text-xs text-muted-foreground">{productCategoryMap.get(product.product_category_id)}</span>
                                                            )}
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{product.product_spec || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.weight_per_piece || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.weight_uom || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.wipes_per_kg || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.shelf_life_in_months || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.storage_condition || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.safety_stock_qty || "-"}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {product.default_pack_size_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-muted-foreground">{product.default_pack_size_id}</span>
                                                            {packSizeMap.get(product.default_pack_size_id) && (
                                                                <span className="text-xs text-muted-foreground">{packSizeMap.get(product.default_pack_size_id)}</span>
                                                            )}
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{product.batch_no_pattern || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.product_image || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.product_image_icon || "-"}</td>
                                                <td className="px-4 py-3 text-sm">{product.qc_required ? "TRUE" : "FALSE"}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {product.coa_checklist_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-muted-foreground">{product.coa_checklist_id}</span>
                                                            {coaChecklistMap.get(product.coa_checklist_id) && (
                                                                <span className="text-xs text-muted-foreground">{coaChecklistMap.get(product.coa_checklist_id)}</span>
                                                            )}
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{product.sterilization_required ? "TRUE" : "FALSE"}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {product.last_modified_user_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-muted-foreground">{product.last_modified_user_id}</span>
                                                            {userMap.get(product.last_modified_user_id) && (
                                                                <span className="text-xs text-muted-foreground">{userMap.get(product.last_modified_user_id)}</span>
                                                            )}
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{formatDateTime(product.last_modified_date_time)}</td>
                                                <td className="px-4 py-3 text-sm font-semibold">{product.active ? "TRUE" : "FALSE"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(product);
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
                                                                handleDelete(product);
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
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
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="px-6"
                                        >
                                            Cancel
                                        </Button>
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
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
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="product_name"
                                                value={formData.product_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="px-6"
                                        >
                                            Cancel
                                        </Button>
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

            {/* Delete Confirmation Dialog */}
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
                                        Are you sure you want to delete <strong>{selectedProduct?.product_name}</strong>?
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

