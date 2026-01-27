'use client';

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Factory, Menu, Pencil, Trash2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";

interface Company {
    id: string;
    type: "CORPORATE" | "FACTORY";
    name: string;
    taxId: string;
    address: string;
    otherFields: string;
}

export default function CompanyMasterPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("All Types");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "CORPORATE",
        taxId: "",
        address: "",
        otherFields: "",
    });

    const companies: Company[] = [
        {
            id: "CMP-001",
            type: "CORPORATE",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 88-234-90",
            address: "1245 Industrial Way, Suite 400, New ...",
            otherFields: "Established 1995",
        },
        {
            id: "CMP-002",
            type: "FACTORY",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 44-TR-55",
            address: "88 Port Terminal Drive, Savannah, G...",
            otherFields: "Logistics Hub",
        },
        {
            id: "CMP-003",
            type: "FACTORY",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 12-558-34",
            address: "21 High-Tech Park, Austin, TX 78701",
            otherFields: "R&D Division",
        },
        {
            id: "CMP-004",
            type: "FACTORY",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 77-889-22",
            address: "500 Assembly Lane, Detroit, MI 48201",
            otherFields: "Main Assembly",
        },
        {
            id: "CMP-005",
            type: "CORPORATE",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 33-445-11",
            address: "747 Fulfillment Blvd, Denver, CO 802...",
            otherFields: "Regional HQ",
        },
    ];

    const filteredCompanies = companies.filter((company) => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "All Types" || company.type === selectedType;
        return matchesSearch && matchesType;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            name: "",
            type: "CORPORATE",
            taxId: "",
            address: "",
            otherFields: "",
        });
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setFormData({
            name: company.name,
            type: company.type,
            taxId: company.taxId,
            address: company.address,
            otherFields: company.otherFields,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Edit submitted:", { ...selectedCompany, ...formData });
        setIsEditModalOpen(false);
        setSelectedCompany(null);
        setFormData({
            name: "",
            type: "CORPORATE",
            taxId: "",
            address: "",
            otherFields: "",
        });
    };

    const handleDelete = (company: Company) => {
        setSelectedCompany(company);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        console.log("Deleting company:", selectedCompany);
        setIsDeleteDialogOpen(false);
        setSelectedCompany(null);
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 overflow-auto lg:ml-64 w-full">
                <div className="lg:hidden sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="hover:bg-muted"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <h1 className="font-semibold text-sm">ACUMED DEVICES</h1>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 sm:mb-8"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Company Master</h1>
                                <p className="text-sm sm:text-base text-muted-foreground">Configure and manage corporate entity profiles</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all self-start sm:self-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add New Company</span>
                                <span className="sm:hidden">Add Company</span>
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
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search companies..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border-border focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="px-3 sm:px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option>All Types</option>
                                        <option>CORPORATE</option>
                                        <option>FACTORY</option>
                                    </select>
                                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                                        SHOWING 1-{filteredCompanies.length} OF {companies.length}
                                    </span>
                                    <Button variant="outline" size="icon" className="hidden sm:flex">
                                        <Filter className="w-4 h-4" />
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
                                            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                                            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">TYPE</th>
                                            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">COMPANY NAME</th>
                                            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">ADDRESS</th>
                                            <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">OTHER FIELDS</th>
                                            <th className="text-center px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredCompanies.map((company, index) => (
                                            <motion.tr
                                                key={company.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <span className="text-xs sm:text-sm text-muted-foreground font-mono">{company.id}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${company.type === "CORPORATE"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-green-100 text-green-700"
                                                            }`}
                                                    >
                                                        {company.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-semibold text-foreground">{company.name}</p>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{company.taxId}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                                    <span className="text-xs sm:text-sm text-foreground">{company.address}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                                    <span className="text-xs sm:text-sm text-muted-foreground italic">{company.otherFields}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(company);
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
                                                                handleDelete(company);
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
                            <div className="border-t border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
                                <span className="text-xs sm:text-sm text-muted-foreground">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled className="text-xs">
                                        <ChevronLeft className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                        <span className="hidden sm:inline">Previous</span>
                                        <span className="sm:hidden">Prev</span>
                                    </Button>
                                    <Button variant="outline" size="sm" disabled className="text-xs">
                                        <span className="hidden sm:inline">Next</span>
                                        <span className="sm:hidden">Next</span>
                                        <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* Add Company Modal */}
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
                                    <h2 className="text-xl sm:text-2xl font-bold">Add New Company</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter company name"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="CORPORATE">CORPORATE</option>
                                                <option value="FACTORY">FACTORY</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Tax ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="taxId"
                                                value={formData.taxId}
                                                onChange={handleInputChange}
                                                placeholder="XX-XXX-XX"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Address</label>
                                        <Input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Other Fields</label>
                                        <Input
                                            name="otherFields"
                                            value={formData.otherFields}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Established 1995"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="px-4 sm:px-6"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6"
                                        >
                                            Save Company
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Company Modal */}
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
                                    <h2 className="text-xl sm:text-2xl font-bold">Edit Company</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter company name"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            >
                                                <option value="CORPORATE">CORPORATE</option>
                                                <option value="FACTORY">FACTORY</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Tax ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="taxId"
                                                value={formData.taxId}
                                                onChange={handleInputChange}
                                                placeholder="XX-XXX-XX"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Address</label>
                                        <Input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Other Fields</label>
                                        <Input
                                            name="otherFields"
                                            value={formData.otherFields}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Established 1995"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="px-4 sm:px-6"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6"
                                        >
                                            Update Company
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
                                        Are you sure you want to delete <strong>{selectedCompany?.name}</strong>?
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


