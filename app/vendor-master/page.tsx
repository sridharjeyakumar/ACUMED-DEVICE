'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { vendorAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";

interface Vendor {
    vendor_id: string;
    vendor_name: string;
    vendor_short_name: string;
    vendor_type: string; // "M" or "S"
    address1: string;
    address2?: string;
    city: string;
    district: string;
    state: string;
    pincode: number;
    gst_no?: string;
    cin_no?: string;
    pan_no?: string;
    tan_no?: string;
    contact_person?: string;
    contact_no?: number;
    contact_email_id?: string;
    website?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
    default_shipping_instruction?: string;
    default_terms_of_payment?: string;
    default_material_type?: string;
}

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

const emptyForm = {
    vendor_id: "",
    vendor_name: "",
    vendor_short_name: "",
    vendor_type: "M",
    address1: "",
    address2: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    gst_no: "",
    cin_no: "",
    pan_no: "",
    tan_no: "",
    contact_person: "",
    contact_no: "",
    contact_email_id: "",
    website: "",
    active: true,
    default_shipping_instruction: "",
    default_terms_of_payment: "",
    default_material_type: "",
};

export default function VendorMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [vendorToCancel, setVendorToCancel] = useState<Vendor | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [filterActive, setFilterActive] = useState<string>("true");
    const [filterType, setFilterType] = useState<string>("all");
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isDuplicateId, setIsDuplicateId] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

    const isSubmittingRef = useRef(false);
    const isSuperAdmin = getSessionUser()?.super_admin === true;

    const [formData, setFormData] = useState({ ...emptyForm });

    const loadVendors = async () => {
        try {
            setLoading(true);
            const data = await vendorAPI.getAll();
            setVendors(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load vendors",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVendors();
    }, []);

    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ ...emptyForm });
            setIsDuplicateId(false);
        }
    }, [isAddModalOpen]);

    const filteredVendors = vendors.filter((vendor) => {
        const matchesSearch =
            vendor.vendor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.vendor_short_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vendor.city || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesActive =
            filterActive === "all" ||
            (filterActive === "true" && vendor.active === true) ||
            (filterActive === "false" && vendor.active === false);

        const matchesType = filterType === "all" || vendor.vendor_type === filterType;

        return matchesSearch && matchesActive && matchesType;
    });

    const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, filterType, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        if (name === "vendor_id") {
            const exists = vendors.some(v =>
                v.vendor_id?.toLowerCase() === value.trim().toLowerCase() &&
                v.vendor_id !== selectedVendor?.vendor_id
            );
            setIsDuplicateId(exists);
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isDuplicateId) {
            toast({
                title: "ID Conflict",
                description: "Please enter a unique Vendor ID before submitting.",
                variant: "destructive",
            });
            return;
        }
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            const formattedData: any = {
                vendor_id: formData.vendor_id,
                vendor_name: formData.vendor_name,
                vendor_short_name: formData.vendor_short_name,
                vendor_type: formData.vendor_type,
                address1: formData.address1,
                address2: formData.address2 || undefined,
                city: formData.city,
                district: formData.district,
                state: formData.state,
                pincode: formData.pincode ? Number(formData.pincode) : undefined,
                gst_no: formData.gst_no || undefined,
                cin_no: formData.cin_no || undefined,
                pan_no: formData.pan_no || undefined,
                tan_no: formData.tan_no || undefined,
                contact_person: formData.contact_person || undefined,
                contact_no: formData.contact_no ? Number(formData.contact_no) : undefined,
                contact_email_id: formData.contact_email_id || undefined,
                website: formData.website || undefined,
                active: formData.active,
                last_modified_user_id: "ADMIN",
                default_shipping_instruction: formData.default_shipping_instruction || undefined,
                default_terms_of_payment: formData.default_terms_of_payment || undefined,
                default_material_type: formData.default_material_type || undefined,
            };

            await vendorAPI.create(formattedData);
            toast({ title: "Success", description: "Vendor created successfully" });
            setIsAddModalOpen(false);
            setFormData({ ...emptyForm });
            loadVendors();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create vendor",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setFormData({
            vendor_id: vendor.vendor_id,
            vendor_name: vendor.vendor_name,
            vendor_short_name: vendor.vendor_short_name,
            vendor_type: vendor.vendor_type,
            address1: vendor.address1,
            address2: vendor.address2 || "",
            city: vendor.city,
            district: vendor.district,
            state: vendor.state,
            pincode: vendor.pincode?.toString() || "",
            gst_no: vendor.gst_no || "",
            cin_no: vendor.cin_no || "",
            pan_no: vendor.pan_no || "",
            tan_no: vendor.tan_no || "",
            contact_person: vendor.contact_person || "",
            contact_no: vendor.contact_no?.toString() || "",
            contact_email_id: vendor.contact_email_id || "",
            website: vendor.website || "",
            active: vendor.active !== undefined ? vendor.active : true,
            default_shipping_instruction: vendor.default_shipping_instruction || "",
            default_terms_of_payment: vendor.default_terms_of_payment || "",
            default_material_type: vendor.default_material_type || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            const formattedData: any = {
                vendor_name: formData.vendor_name,
                vendor_short_name: formData.vendor_short_name,
                vendor_type: formData.vendor_type,
                address1: formData.address1,
                address2: formData.address2 || undefined,
                city: formData.city,
                district: formData.district,
                state: formData.state,
                pincode: formData.pincode ? Number(formData.pincode) : undefined,
                gst_no: formData.gst_no || undefined,
                cin_no: formData.cin_no || undefined,
                pan_no: formData.pan_no || undefined,
                tan_no: formData.tan_no || undefined,
                contact_person: formData.contact_person || undefined,
                contact_no: formData.contact_no ? Number(formData.contact_no) : undefined,
                contact_email_id: formData.contact_email_id || undefined,
                website: formData.website || undefined,
                active: formData.active,
                last_modified_user_id: "ADMIN",
                default_shipping_instruction: formData.default_shipping_instruction || undefined,
                default_terms_of_payment: formData.default_terms_of_payment || undefined,
                default_material_type: formData.default_material_type || undefined,
            };

            await vendorAPI.update(selectedVendor!.vendor_id, formattedData);
            toast({ title: "Success", description: "Vendor updated successfully" });
            setIsEditModalOpen(false);
            setSelectedVendor(null);
            loadVendors();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update vendor",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleCancel = (vendor: Vendor) => {
        setVendorToCancel(vendor);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!vendorToCancel) return;
        const newActiveStatus = !vendorToCancel.active;
        const action = newActiveStatus ? 'restore' : 'cancel';
        try {
            await vendorAPI.update(vendorToCancel.vendor_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            setVendors(prev =>
                prev.map(item =>
                    item.vendor_id === vendorToCancel.vendor_id
                        ? { ...item, active: newActiveStatus }
                        : item
                )
            );
            toast({
                title: action === 'restore' ? "Restored" : "Cancelled",
                description: `Vendor ${vendorToCancel.vendor_name} has been ${action === 'restore' ? 'restored' : 'cancelled'}`,
            });
            setIsCancelItemDialogOpen(false);
            setVendorToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${action} vendor`,
                variant: "destructive",
            });
        }
    };

    const handleDelete = (vendor: Vendor) => {
        setVendorToDelete(vendor);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;
        try {
            await vendorAPI.delete(vendorToDelete.vendor_id);
            setVendors(prev => prev.filter(v => v.vendor_id !== vendorToDelete.vendor_id));
            toast({
                title: "Deleted",
                description: `Vendor ${vendorToDelete.vendor_name} has been deleted.`,
            });
            setIsDeleteDialogOpen(false);
            setVendorToDelete(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to delete vendor',
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

    const renderForm = (mode: 'add' | 'edit') => (
        <div className="grid grid-cols-2 gap-6">
            {/* Vendor Information */}
            <div className="col-span-2">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                    Vendor Information
                </h3>
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Vendor ID <span className="text-red-500">*</span>
                </label>
                <Input
                    name="vendor_id"
                    value={formData.vendor_id}
                    onChange={handleInputChange}
                    placeholder="Enter Vendor ID"
                    disabled={mode === 'edit'}
                    className={isDuplicateId ? "border-red-500 focus-visible:ring-red-500 bg-red-50/50" : ""}
                    maxLength={5}
                />
                {isDuplicateId && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                        <X className="w-3 h-3" /> Already exists in the table
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                </label>
                <Input
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    placeholder="Enter vendor name"
                    required
                    maxLength={100}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Vendor Short Name <span className="text-red-500">*</span>
                </label>
                <Input
                    name="vendor_short_name"
                    value={formData.vendor_short_name}
                    onChange={handleInputChange}
                    placeholder="Enter short name"
                    required
                    maxLength={50}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Vendor Type <span className="text-red-500">*</span>
                </label>
                <select
                    name="vendor_type"
                    value={formData.vendor_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                >
                    <option value="M">M - Material Supply</option>
                    <option value="S">S - Service</option>
                </select>
            </div>

            {/* Address */}
            <div className="col-span-2 mt-4">
                <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                    Address
                </h3>
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Address 1 <span className="text-red-500">*</span>
                </label>
                <Input
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    placeholder="Enter address line 1"
                    required
                    maxLength={100}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Address 2
                </label>
                <Input
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    placeholder="Enter address line 2"
                    maxLength={100}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    City <span className="text-red-500">*</span>
                </label>
                <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                    maxLength={50}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    District <span className="text-red-500">*</span>
                </label>
                <Input
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Enter district"
                    required
                    maxLength={50}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    State <span className="text-red-500">*</span>
                </label>
                <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    required
                    maxLength={50}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Pincode <span className="text-red-500">*</span>
                </label>
                <Input
                    type="number"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit pincode"
                    required
                />
            </div>

            {/* Tax & Legal */}
            <div className="col-span-2 mt-4">
                <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                    Tax &amp; Legal
                </h3>
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">GST No.</label>
                <Input
                    name="gst_no"
                    value={formData.gst_no}
                    onChange={handleInputChange}
                    placeholder="Enter GST number"
                    maxLength={15}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">CIN No.</label>
                <Input
                    name="cin_no"
                    value={formData.cin_no}
                    onChange={handleInputChange}
                    placeholder="Enter CIN number"
                    maxLength={15}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">PAN No.</label>
                <Input
                    name="pan_no"
                    value={formData.pan_no}
                    onChange={handleInputChange}
                    placeholder="Enter PAN number"
                    maxLength={15}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">TAN No.</label>
                <Input
                    name="tan_no"
                    value={formData.tan_no}
                    onChange={handleInputChange}
                    placeholder="Enter TAN number"
                    maxLength={15}
                />
            </div>

            {/* Contact Information */}
            <div className="col-span-2 mt-4">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-4 border-b pb-2">
                    Contact Information
                </h3>
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Contact Person</label>
                <Input
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                    maxLength={50}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Contact No.</label>
                <Input
                    type="number"
                    name="contact_no"
                    value={formData.contact_no}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Contact Email ID</label>
                <Input
                    type="email"
                    name="contact_email_id"
                    value={formData.contact_email_id}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    maxLength={50}
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Website</label>
                <Input
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Enter website URL"
                    maxLength={50}
                />
            </div>

            {/* Default Settings */}
            <div className="col-span-2 mt-4">
                <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 border-b pb-2">
                    Default Settings
                </h3>
            </div>

            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Default Material Type</label>
                <select
                    name="default_material_type"
                    value={formData.default_material_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">-- Select --</option>
                    <option value="RM">RM - Raw Material</option>
                    <option value="PM">PM - Packing Material</option>
                </select>
            </div>

            <div className="col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Default Shipping Instruction</label>
                <textarea
                    name="default_shipping_instruction"
                    value={formData.default_shipping_instruction}
                    onChange={handleInputChange}
                    placeholder="Enter default shipping instruction"
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                />
            </div>

            <div className="col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Default Terms of Payment</label>
                <textarea
                    name="default_terms_of_payment"
                    value={formData.default_terms_of_payment}
                    onChange={handleInputChange}
                    placeholder="Enter default terms of payment"
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                />
            </div>

            {/* Status */}
            <div className="col-span-2 mt-4">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                    Status
                </h3>
            </div>

            <div className="flex items-center space-x-2 pt-6">
                <input
                    type="checkbox"
                    id={`active_${mode}`}
                    name="active"
                    checked={formData.active as boolean}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`active_${mode}`} className="text-sm font-semibold text-foreground">
                    Active
                </label>
            </div>
        </div>
    );

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
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Vendor Master</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Manage and configure vendor information</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="whitespace-nowrap">Add New Vendor</span>
                            </Button>
                        </div>
                    </motion.div>

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
                                        placeholder="Search by Vendor ID, Name, Short Name or City..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredVendors.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredVendors.length)} OF {filteredVendors.length}
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
                                                    {[["all", "All"], ["true", "Active"], ["false", "Inactive"]].map(([val, label]) => (
                                                        <div key={val} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`vend-active-${val}`}
                                                                name="vendActiveFilter"
                                                                checked={filterActive === val}
                                                                onChange={() => setFilterActive(val)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`vend-active-${val}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Vendor Type</Label>
                                                <div className="space-y-2">
                                                    {[["all", "All"], ["M", "M - Material Supply"], ["S", "S - Service"]].map(([val, label]) => (
                                                        <div key={val} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`vend-type-${val}`}
                                                                name="vendTypeFilter"
                                                                checked={filterType === val}
                                                                onChange={() => setFilterType(val)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`vend-type-${val}`} className="text-sm font-normal cursor-pointer text-foreground">{label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
                            <div className="overflow-auto max-h-[360px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Vendor ID</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Vendor Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Short Name</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Type</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">City</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">State</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">GST No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Contact Person</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Contact No.</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Email</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Website</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Default Material Type</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Default Shipping Instruction</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Default Terms of Payment</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Last Modified User</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Last Modified Date &amp; Time</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Active</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedVendors.length === 0 ? (
                                            <tr>
                                                <td colSpan={14} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                                    No vendors found
                                                </td>
                                            </tr>
                                        ) : paginatedVendors.map((vendor, index) => {
                                            const isActive = vendor.active === true;
                                            return (
                                                <motion.tr
                                                    key={vendor.vendor_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                            {vendor.vendor_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{vendor.vendor_name || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.vendor_short_name || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`inline-flex px-2 py-1 rounded-md font-mono text-xs ${vendor.vendor_type === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                            {vendor.vendor_type === 'M' ? 'Material' : 'Service'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{vendor.city || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.state || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.gst_no || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.contact_person || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.contact_no ?? "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.contact_email_id || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.website || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {vendor.default_material_type ? (
                                                            <span className={`inline-flex px-2 py-1 rounded-md font-mono text-xs ${vendor.default_material_type === 'RM' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                {vendor.default_material_type === 'RM' ? 'RM - Raw Material' : 'PM - Packing Material'}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{vendor.default_shipping_instruction || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{vendor.default_terms_of_payment || "-"}</td>

                                                    <td className="px-4 py-3 text-sm">
                                                        {vendor.last_modified_user_id ? (
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                {vendor.last_modified_user_id}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{formatDateTime(vendor.last_modified_date_time)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                                                            {isActive ? "ACTIVE" : "INACTIVE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={!isActive && !isSuperAdmin}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isActive && !isSuperAdmin) return;
                                                                    handleEdit(vendor);
                                                                }}
                                                                className={`${isActive || isSuperAdmin ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-400 cursor-not-allowed"}`}
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
                                                                    handleCancel(vendor);
                                                                }}
                                                                className={`${isActive ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-gray-400 cursor-not-allowed"}`}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(vendor);
                                                                    }}
                                                                    className="text-gray-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
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

            {/* Add Vendor Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Vendor</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderForm('add')}
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Save Vendor
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Vendor Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Vendor</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {renderForm('edit')}
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Update Vendor
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
                                <div className={`${vendorToCancel?.active ? 'bg-red-600' : 'bg-green-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {vendorToCancel?.active ? "Cancel Vendor" : "Restore Vendor"}
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
                                        Are you sure you want to {vendorToCancel?.active ? 'cancel' : 'restore'} <strong>{vendorToCancel?.vendor_name}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {vendorToCancel?.active
                                            ? "This will cancel the vendor and set its active status to false."
                                            : "This will restore the vendor and set its active status to true."}
                                    </p>
                                    <div className="flex items-center justify-end gap-4">
                                        <Button variant="outline" onClick={() => setIsCancelItemDialogOpen(false)}>
                                            Discard
                                        </Button>
                                        <Button
                                            onClick={confirmCancelItem}
                                            className={`${vendorToCancel?.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                        >
                                            {vendorToCancel?.active ? "Cancel" : "Restore"}
                                        </Button>
                                    </div>
                                </div>
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
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                                <div className="flex items-center justify-between p-6 bg-red-600 rounded-t-xl">
                                    <h2 className="text-xl font-bold text-white">Delete Vendor</h2>
                                    <button
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        className="text-white hover:opacity-80 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-gray-700">
                                        Are you sure you want to permanently delete <span className="font-semibold">{vendorToDelete?.vendor_name}</span>? This action cannot be undone.
                                    </p>
                                    <div className="flex items-center justify-end gap-4">
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
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
