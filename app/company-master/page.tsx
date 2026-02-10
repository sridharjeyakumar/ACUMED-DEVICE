'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Upload } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { companyAPI } from "@/services/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Company {
    comp_id: string; // Char(4) - PK
    company_name: string; // Char(100)
    company_short_name?: string; // Char(50)
    address_1?: string; // Char(100)
    address_2?: string; // Char(100)
    city?: string; // Char(50)
    state?: string; // Char(50)
    pincode?: number; // N(6)
    gst_no?: string; // Char(15)
    cin_no?: string; // Char(21)
    pan_no?: string; // Char(15)
    email_id?: string; // Char(50)
    website?: string; // Char(50)
    contact_person?: string; // Char(50)
    contact_no?: number; // N(10)
    logo?: string; // image (URL or base64)
    last_modified_user_id?: string; // Char(5) - user ID
    last_modified_date_time?: Date; // Date
}

export default function CompanyMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<'add' | 'edit' | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [filterState, setFilterState] = useState<string>("all");
    const [filterCity, setFilterCity] = useState<string>("all");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelledCompanies, setCancelledCompanies] = useState<Set<string>>(new Set());
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [companyToCancel, setCompanyToCancel] = useState<Company | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        comp_id: "",
        company_name: "",
        company_short_name: "",
        address_1: "",
        address_2: "",
        city: "",
        state: "",
        pincode: "",
        gst_no: "",
        cin_no: "",
        pan_no: "",
        email_id: "",
        website: "",
        contact_person: "",
        contact_no: "",
        logo: "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: Company } | null>(null);

    const handleCancelClick = (modalType: 'add' | 'edit') => {
        setCancelModalType(modalType);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (cancelModalType === 'add') {
            setIsAddModalOpen(false);
            setFormData({
                comp_id: "",
                company_name: "",
                company_short_name: "",
                address_1: "",
                address_2: "",
                city: "",
                state: "",
                pincode: "",
                gst_no: "",
                cin_no: "",
                pan_no: "",
                email_id: "",
                website: "",
                contact_person: "",
                contact_no: "",
                logo: "",
            });
        } else if (cancelModalType === 'edit') {
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            setFormData({
                comp_id: "",
                company_name: "",
                company_short_name: "",
                address_1: "",
                address_2: "",
                city: "",
                state: "",
                pincode: "",
                gst_no: "",
                cin_no: "",
                pan_no: "",
                email_id: "",
                website: "",
                contact_person: "",
                contact_no: "",
                logo: "",
            });
        }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                comp_id: "",
                company_name: "",
                company_short_name: "",
                address_1: "",
                address_2: "",
                city: "",
                state: "",
                pincode: "",
                gst_no: "",
                cin_no: "",
                pan_no: "",
                email_id: "",
                website: "",
                contact_person: "",
                contact_no: "",
                logo: "",
            });
        }
    }, [isAddModalOpen]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const data = await companyAPI.getAll();
            setCompanies(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load companies",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter((company) => {
        const matchesSearch = company.comp_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.company_short_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesState = filterState === "all" || company.state === filterState;
        const matchesCity = filterCity === "all" || company.city === filterCity;
        
        return matchesSearch && matchesState && matchesCity;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterState, filterCity, rowsPerPage]);

    const uniqueStates = Array.from(new Set(companies.map(c => c.state).filter(s => s)));
    const uniqueCities = Array.from(new Set(companies.map(c => c.city).filter(c => c)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await companyAPI.create({
                comp_id: formData.comp_id,
                company_name: formData.company_name,
                company_short_name: formData.company_short_name || undefined,
                address_1: formData.address_1 || undefined,
                address_2: formData.address_2 || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                pincode: formData.pincode ? parseInt(formData.pincode) : undefined,
                gst_no: formData.gst_no || undefined,
                cin_no: formData.cin_no || undefined,
                pan_no: formData.pan_no || undefined,
                email_id: formData.email_id || undefined,
                website: formData.website || undefined,
                contact_person: formData.contact_person || undefined,
                contact_no: formData.contact_no ? parseInt(formData.contact_no) : undefined,
                logo: formData.logo || undefined,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Company created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                comp_id: "",
                company_name: "",
                company_short_name: "",
                address_1: "",
                address_2: "",
                city: "",
                state: "",
                pincode: "",
                gst_no: "",
                cin_no: "",
                pan_no: "",
                email_id: "",
                website: "",
                contact_person: "",
                contact_no: "",
                logo: "",
            });
            loadCompanies();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create company",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setFormData({
            comp_id: company.comp_id,
            company_name: company.company_name,
            company_short_name: company.company_short_name || "",
            address_1: company.address_1 || "",
            address_2: company.address_2 || "",
            city: company.city || "",
            state: company.state || "",
            pincode: company.pincode?.toString() || "",
            gst_no: company.gst_no || "",
            cin_no: company.cin_no || "",
            pan_no: company.pan_no || "",
            email_id: company.email_id || "",
            website: company.website || "",
            contact_person: company.contact_person || "",
            contact_no: company.contact_no?.toString() || "",
            logo: company.logo || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedCompany) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedCompany };
        
        try {
            await companyAPI.update(selectedCompany.comp_id, {
                company_name: formData.company_name,
                company_short_name: formData.company_short_name || undefined,
                address_1: formData.address_1 || undefined,
                address_2: formData.address_2 || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                pincode: formData.pincode ? parseInt(formData.pincode) : undefined,
                gst_no: formData.gst_no || undefined,
                cin_no: formData.cin_no || undefined,
                pan_no: formData.pan_no || undefined,
                email_id: formData.email_id || undefined,
                website: formData.website || undefined,
                contact_person: formData.contact_person || undefined,
                contact_no: formData.contact_no ? parseInt(formData.contact_no) : undefined,
                logo: formData.logo || undefined,
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Company updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedCompany(null);
            setFormData({
                comp_id: "",
                company_name: "",
                company_short_name: "",
                address_1: "",
                address_2: "",
                city: "",
                state: "",
                pincode: "",
                gst_no: "",
                cin_no: "",
                pan_no: "",
                email_id: "",
                website: "",
                contact_person: "",
                contact_no: "",
                logo: "",
            });
            loadCompanies();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update company",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };
    
    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            // Restore previous data
            await companyAPI.update(lastAction.data.comp_id, {
                company_name: lastAction.data.company_name,
                company_short_name: lastAction.data.company_short_name || undefined,
                address_1: lastAction.data.address_1 || undefined,
                address_2: lastAction.data.address_2 || undefined,
                city: lastAction.data.city || undefined,
                state: lastAction.data.state || undefined,
                pincode: lastAction.data.pincode || undefined,
                gst_no: lastAction.data.gst_no || undefined,
                cin_no: lastAction.data.cin_no || undefined,
                pan_no: lastAction.data.pan_no || undefined,
                email_id: lastAction.data.email_id || undefined,
                website: lastAction.data.website || undefined,
                contact_person: lastAction.data.contact_person || undefined,
                contact_no: lastAction.data.contact_no || undefined,
                logo: lastAction.data.logo || undefined,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Undone",
                description: "Changes have been reverted",
            });
            setLastAction(null);
            loadCompanies();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (company: Company) => {
        setCompanyToCancel(company);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!companyToCancel) return;
        
        const isCancelled = cancelledCompanies.has(companyToCancel.comp_id);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await companyAPI.update(companyToCancel.comp_id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledCompanies(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(companyToCancel.comp_id);
                    toast({
                        title: "Restored",
                        description: `Company ${companyToCancel.company_name} has been restored`,
                    });
                } else {
                    newSet.add(companyToCancel.comp_id);
                    toast({
                        title: "Cancelled",
                        description: `Company ${companyToCancel.company_name} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadCompanies(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setCompanyToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} company`,
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Company Master</h1>
                                <p className="text-muted-foreground">Manage company information and details</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Company
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
                                        placeholder="Search by Company ID, Name, or Short Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredCompanies.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredCompanies.length)} OF {filteredCompanies.length}
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
                                            {uniqueStates.length > 0 && (
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-semibold text-foreground">State</Label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="comp-state-all" 
                                                                name="compStateFilter"
                                                                checked={filterState === "all"}
                                                                onChange={() => setFilterState("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="comp-state-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueStates.map((state) => (
                                                            <div key={state} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`comp-state-${state}`} 
                                                                    name="compStateFilter"
                                                                    checked={filterState === state}
                                                                    onChange={() => setFilterState(state)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`comp-state-${state}`} className="text-sm font-normal cursor-pointer text-foreground">{state}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {uniqueCities.length > 0 && (
                                                <div className="space-y-3 pt-3 border-t border-border">
                                                    <Label className="text-sm font-semibold text-foreground">City</Label>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="comp-city-all" 
                                                                name="compCityFilter"
                                                                checked={filterCity === "all"}
                                                                onChange={() => setFilterCity("all")}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor="comp-city-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                        </div>
                                                        {uniqueCities.map((city) => (
                                                            <div key={city} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`comp-city-${city}`} 
                                                                    name="compCityFilter"
                                                                    checked={filterCity === city}
                                                                    onChange={() => setFilterCity(city)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <Label htmlFor={`comp-city-${city}`} className="text-sm font-normal cursor-pointer text-foreground">{city}</Label>
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
                                                    setFilterState("all");
                                                    setFilterCity("all");
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">comp id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">company name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">company short name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">address 1</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">address 2</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">city</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">state</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">pincode</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">GST No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">CIN No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">PAN No.</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">email id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">website</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>contact</span>
                                                    <span>Person</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Contact No</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">logo</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>user id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>last modified</span>
                                                    <span>date & time</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={19} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading companies...
                                                </td>
                                            </tr>
                                        ) : filteredCompanies.length === 0 ? (
                                            <tr>
                                                <td colSpan={19} className="px-6 py-4 text-center text-muted-foreground">
                                                    No companies found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedCompanies.map((company, index) => {
                                                const isCancelled = cancelledCompanies.has(company.comp_id);
                                                return (
                                                <motion.tr
                                                    key={company.comp_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground font-mono">{company.comp_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.company_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.company_short_name || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.address_1 || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.address_2 || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.city || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.state || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.pincode || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-mono">{company.gst_no || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-mono">{company.cin_no || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-mono">{company.pan_no || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.email_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.website || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.contact_person || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.contact_no || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {company.logo ? (
                                                            <img src={company.logo} alt="Logo" className="w-10 h-10 object-contain mx-auto" />
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{company.last_modified_user_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {company.last_modified_date_time ? new Date(company.last_modified_date_time).toLocaleString() : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(company);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                disabled={isCancelled}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(company);
                                                                }}
                                                                className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={isCancelled ? "Restore company" : "Cancel company"}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE {currentPage} OF {totalPages || 1}</span>
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

            {/* Add Company Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => handleCancelClick('add')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Company</h2>
                                    <button
                                        onClick={() => handleCancelClick('add')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {/* Company Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Company Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Company ID <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="comp_id"
                                                    value={formData.comp_id}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., CORP, FACT"
                                                    required
                                                    maxLength={4}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Company Name <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="company_name"
                                                    value={formData.company_name}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter company name"
                                                    required
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Company Short Name
                                                </label>
                                                <Input
                                                    name="company_short_name"
                                                    value={formData.company_short_name}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter short name"
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Logo
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Upload Logo
                                                    </Button>
                                                    {formData.logo && (
                                                        <img src={formData.logo} alt="Logo preview" className="w-16 h-16 object-contain border border-border rounded" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statutory Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Statutory Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    GST No.
                                                </label>
                                                <Input
                                                    name="gst_no"
                                                    value={formData.gst_no}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter GST number"
                                                    maxLength={15}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    CIN No.
                                                </label>
                                                <Input
                                                    name="cin_no"
                                                    value={formData.cin_no}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter CIN number"
                                                    maxLength={21}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    PAN No.
                                                </label>
                                                <Input
                                                    name="pan_no"
                                                    value={formData.pan_no}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter PAN number"
                                                    maxLength={15}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Address Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Address 1
                                                </label>
                                                <Input
                                                    name="address_1"
                                                    value={formData.address_1}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter address line 1"
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Address 2
                                                </label>
                                                <Input
                                                    name="address_2"
                                                    value={formData.address_2}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter address line 2"
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    City
                                                </label>
                                                <Input
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter city"
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    State
                                                </label>
                                                <Input
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter state"
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Pincode
                                                </label>
                                                <Input
                                                    name="pincode"
                                                    type="number"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter pincode"
                                                    maxLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Contact Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Email ID
                                                </label>
                                                <Input
                                                    name="email_id"
                                                    type="email"
                                                    value={formData.email_id}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter email address"
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Website
                                                </label>
                                                <Input
                                                    name="website"
                                                    value={formData.website}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter website URL"
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Contact Person
                                                </label>
                                                <Input
                                                    name="contact_person"
                                                    value={formData.contact_person}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter contact person name"
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Contact No.
                                                </label>
                                                <Input
                                                    name="contact_no"
                                                    type="number"
                                                    value={formData.contact_no}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter contact number"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
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
                            onClick={() => handleCancelClick('edit')}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Company</h2>
                                    <button
                                        onClick={() => handleCancelClick('edit')}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {/* Company Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Company Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Company ID <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="comp_id"
                                                    value={formData.comp_id}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Company Name <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    name="company_name"
                                                    value={formData.company_name}
                                                    onChange={handleInputChange}
                                                    required
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Company Short Name
                                                </label>
                                                <Input
                                                    name="company_short_name"
                                                    value={formData.company_short_name}
                                                    onChange={handleInputChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Logo
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Upload Logo
                                                    </Button>
                                                    {formData.logo && (
                                                        <img src={formData.logo} alt="Logo preview" className="w-16 h-16 object-contain border border-border rounded" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statutory Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Statutory Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    GST No.
                                                </label>
                                                <Input
                                                    name="gst_no"
                                                    value={formData.gst_no}
                                                    onChange={handleInputChange}
                                                    maxLength={15}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    CIN No.
                                                </label>
                                                <Input
                                                    name="cin_no"
                                                    value={formData.cin_no}
                                                    onChange={handleInputChange}
                                                    maxLength={21}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    PAN No.
                                                </label>
                                                <Input
                                                    name="pan_no"
                                                    value={formData.pan_no}
                                                    onChange={handleInputChange}
                                                    maxLength={15}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Address Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Address 1
                                                </label>
                                                <Input
                                                    name="address_1"
                                                    value={formData.address_1}
                                                    onChange={handleInputChange}
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Address 2
                                                </label>
                                                <Input
                                                    name="address_2"
                                                    value={formData.address_2}
                                                    onChange={handleInputChange}
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    City
                                                </label>
                                                <Input
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    State
                                                </label>
                                                <Input
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Pincode
                                                </label>
                                                <Input
                                                    name="pincode"
                                                    type="number"
                                                    value={formData.pincode}
                                                    onChange={handleInputChange}
                                                    maxLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Contact Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Email ID
                                                </label>
                                                <Input
                                                    name="email_id"
                                                    type="email"
                                                    value={formData.email_id}
                                                    onChange={handleInputChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Website
                                                </label>
                                                <Input
                                                    name="website"
                                                    value={formData.website}
                                                    onChange={handleInputChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Contact Person
                                                </label>
                                                <Input
                                                    name="contact_person"
                                                    value={formData.contact_person}
                                                    onChange={handleInputChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    Contact No.
                                                </label>
                                                <Input
                                                    name="contact_no"
                                                    type="number"
                                                    value={formData.contact_no}
                                                    onChange={handleInputChange}
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
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

            {/* Cancel Confirmation Dialog (for modals) */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel? Any unsaved changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelDialogOpen(false)}>
                            No, Continue Editing
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
                            Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Item Confirmation Dialog (for table actions) */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {companyToCancel && cancelledCompanies.has(companyToCancel.comp_id) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {companyToCancel && cancelledCompanies.has(companyToCancel.comp_id)
                                ? `Are you sure you want to restore company "${companyToCancel.company_name}"?`
                                : `Are you sure you want to cancel company "${companyToCancel?.company_name}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setCompanyToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={companyToCancel && cancelledCompanies.has(companyToCancel.comp_id) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {companyToCancel && cancelledCompanies.has(companyToCancel.comp_id) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
