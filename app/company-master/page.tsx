'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2, Upload } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { companyAPI } from "@/services/api";

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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [filterState, setFilterState] = useState<string>("all");
    const [filterCity, setFilterCity] = useState<string>("all");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
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
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: Company } | null>(null);

    useEffect(() => {
        loadCompanies();
    }, []);

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
            if (lastAction.type === 'edit') {
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
            } else if (lastAction.type === 'delete') {
                // Restore deleted company
                await companyAPI.create({
                    comp_id: lastAction.data.comp_id,
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
                    description: "Company has been restored",
                });
            }
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

    const handleDelete = (company: Company) => {
        setSelectedCompany(company);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (isSubmittingRef.current) return;
        if (!selectedCompany) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedCompany };
        
        try {
            await companyAPI.delete(selectedCompany.comp_id);
            
            // Store last action for undo
            setLastAction({ type: 'delete', data: previousData });
            
            toast({
                title: "Success",
                description: "Company deleted successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsDeleteDialogOpen(false);
            setSelectedCompany(null);
            loadCompanies();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete company",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
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
                                    SHOWING 1-{filteredCompanies.length} OF {companies.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                        <div className="flex flex-wrap gap-6 items-start">
                                            {uniqueStates.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">State</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="comp-state-all" 
                                                                name="compStateFilter"
                                                                checked={filterState === "all"}
                                                                onChange={() => setFilterState("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="comp-state-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueStates.map((state) => (
                                                            <div key={state} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`comp-state-${state}`} 
                                                                    name="compStateFilter"
                                                                    checked={filterState === state}
                                                                    onChange={() => setFilterState(state)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`comp-state-${state}`} className="text-sm font-normal cursor-pointer">{state}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {uniqueCities.length > 0 && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">City</Label>
                                                    <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="comp-city-all" 
                                                                name="compCityFilter"
                                                                checked={filterCity === "all"}
                                                                onChange={() => setFilterCity("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="comp-city-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueCities.map((city) => (
                                                            <div key={city} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`comp-city-${city}`} 
                                                                    name="compCityFilter"
                                                                    checked={filterCity === city}
                                                                    onChange={() => setFilterCity(city)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`comp-city-${city}`} className="text-sm font-normal cursor-pointer">{city}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-end">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setFilterState("all");
                                                        setFilterCity("all");
                                                    }}
                                                >
                                                    Clear Filters
                                                </Button>
                                            </div>
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-20">COMP ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[200px]">COMPANY NAME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[120px]">SHORT NAME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">ADDRESS 1</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">ADDRESS 2</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">CITY</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">STATE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">PINCODE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">GST NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">CIN NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">PAN NO.</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">EMAIL ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">WEBSITE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-36">CONTACT PERSON</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">CONTACT NO</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">LOGO</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={17} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading companies...
                                                </td>
                                            </tr>
                                        ) : filteredCompanies.length === 0 ? (
                                            <tr>
                                                <td colSpan={17} className="px-6 py-4 text-center text-muted-foreground">
                                                    No companies found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCompanies.map((company, index) => (
                                                <motion.tr
                                                    key={company.comp_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors"
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
                                            ))
                                        )}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Company</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                        <div>
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
                                        <div>
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
                                                maxLength={15}
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
                                    <div className="mb-6">
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
                            onClick={() => setIsEditModalOpen(false)}
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
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                        <div>
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
                                        <div>
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
                                                maxLength={15}
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
                                    <div className="mb-6">
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

            {/* Delete Dialog */}
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
                                        Are you sure you want to delete company <strong>{selectedCompany?.company_name}</strong> ({selectedCompany?.comp_id})?
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
                                            disabled={isSubmittingRef.current}
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
