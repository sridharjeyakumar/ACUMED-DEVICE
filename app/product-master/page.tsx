'use client';

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
    id: string;
    name: string;
    shortname: string;
    weightPerPiece: number;
    uom: string;
    wipesPerKG: number;
    status: "Active" | "Inactive";
}

export default function ProductMasterPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        productId: "",
        productName: "",
        productShortname: "",
        weightPerPiece: "",
        uom: "",
        wipesPerKG: "",
        description: "",
        status: "Active",
    });

    const products: Product[] = [
        {
            id: "P0001",
            name: "DUVET Wipes",
            shortname: "-",
            weightPerPiece: 2.7,
            uom: "gms",
            wipesPerKG: 370,
            status: "Active",
        },
        {
            id: "P0002",
            name: "DUVET XL Wipes",
            shortname: "-",
            weightPerPiece: 3.2,
            uom: "gms",
            wipesPerKG: 313,
            status: "Active",
        },
        {
            id: "P0003",
            name: "DUVET Ultra Wipes",
            shortname: "-",
            weightPerPiece: 3.5,
            uom: "gms",
            wipesPerKG: 286,
            status: "Active",
        },
    ];

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            productId: "",
            productName: "",
            productShortname: "",
            weightPerPiece: "",
            uom: "",
            wipesPerKG: "",
            description: "",
            status: "Active",
        });
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            productId: product.id,
            productName: product.name,
            productShortname: product.shortname,
            weightPerPiece: product.weightPerPiece.toString(),
            uom: product.uom,
            wipesPerKG: product.wipesPerKG.toString(),
            description: "",
            status: product.status,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Edit submitted:", { ...selectedProduct, ...formData });
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        setFormData({
            productId: "",
            productName: "",
            productShortname: "",
            weightPerPiece: "",
            uom: "",
            wipesPerKG: "",
            description: "",
            status: "Active",
        });
    };

    const handleDelete = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        console.log("Deleting product:", selectedProduct);
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
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
                        className="mb-4 md:mb-6"
                    >
                        <Card className="p-3 md:p-4">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 w-full text-sm md:text-base"
                                    />
                                </div>
                                <span className="hidden md:inline-block text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING 1-{filteredProducts.length} OF {products.length}
                                </span>
                                <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                                    <Filter className="w-4 h-4" />
                                </Button>
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">product_id</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">product_name</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">product_shortname</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">weight per piece</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">uom</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">wipes per KG</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredProducts.map((product, index) => (
                                            <motion.tr
                                                key={product.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{product.id}</td>
                                                <td className="px-6 py-4 text-sm font-semibold">{product.name}</td>
                                                <td className="px-6 py-4 text-sm">{product.shortname}</td>
                                                <td className="px-6 py-4 text-sm">{product.weightPerPiece}</td>
                                                <td className="px-6 py-4 text-sm">{product.uom}</td>
                                                <td className="px-6 py-4 text-sm">{product.wipesPerKG}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold">TRUE</span>
                                                </td>
                                                <td className="px-6 py-4">
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
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" disabled>
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* Add Product Modal */}
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
                                                name="productId"
                                                value={formData.productId}
                                                onChange={handleInputChange}
                                                placeholder="PRD-XXX"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="productName"
                                                value={formData.productName}
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
                                                name="productShortname"
                                                value={formData.productShortname}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Cotton-TS"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Weight per Piece <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    name="weightPerPiece"
                                                    value={formData.weightPerPiece}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    required
                                                    className="pr-12"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">kg</span>
                                            </div>
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
                                                <option value="">Select unit</option>
                                                <option value="KG">KG</option>
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="CARTON">CARTON</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Wipes per KG <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                name="wipesPerKG"
                                                value={formData.wipesPerKG}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Enter product description..."
                                            rows={4}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-foreground mb-3">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="Active"
                                                    checked={formData.status === "Active"}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Active</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="Inactive"
                                                    checked={formData.status === "Inactive"}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Inactive</span>
                                            </label>
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

            {/* Edit Product Modal */}
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
                                                name="productId"
                                                value={formData.productId}
                                                onChange={handleInputChange}
                                                placeholder="PRD-XXX"
                                                required
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="productName"
                                                value={formData.productName}
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
                                                name="productShortname"
                                                value={formData.productShortname}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Cotton-TS"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Weight per Piece <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    name="weightPerPiece"
                                                    value={formData.weightPerPiece}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    required
                                                    className="pr-12"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">kg</span>
                                            </div>
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
                                                <option value="">Select unit</option>
                                                <option value="KG">KG</option>
                                                <option value="PCS">PCS</option>
                                                <option value="BOX">BOX</option>
                                                <option value="CARTON">CARTON</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Wipes per KG <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                name="wipesPerKG"
                                                value={formData.wipesPerKG}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Enter product description..."
                                            rows={4}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-foreground mb-3">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="Active"
                                                    checked={formData.status === "Active"}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Active</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="Inactive"
                                                    checked={formData.status === "Inactive"}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">Inactive</span>
                                            </label>
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
                                        Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
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



