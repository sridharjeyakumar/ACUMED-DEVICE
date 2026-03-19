'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Upload, ImageIcon } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { locationAPI } from "@/services/api";
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

interface Location {
    location_id: string; // Char(2) - PK
    location_name: string; // Char(25)
    last_modified_user_id?: string; // Char(5)
    location_icon?: string; // image
    last_modified_date_time?: Date; // Date
    active: boolean;
}

function formatDateTime(date: Date | string): string {
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

export default function LocationMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const isSubmittingRef = useRef(false);
    const addIconInputRef = useRef<HTMLInputElement>(null);
    const editIconInputRef = useRef<HTMLInputElement>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: Location } | null>(null);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [locationToCancel, setLocationToCancel] = useState<Location | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        location_id: "",
        location_name: "",
        location_icon: "",
        active: true,
    });

    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ location_id: "", location_name: "", location_icon: "", active: true });
            if (addIconInputRef.current) addIconInputRef.current.value = "";
        }
    }, [isAddModalOpen]);

    const loadLocations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await locationAPI.getAll();
            const locationsWithActive = data.map((loc: any) => ({
                ...loc,
                active: loc.active !== undefined ? loc.active : true,
            }));
            setLocations(locationsWithActive);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load locations",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const filteredLocations = locations.filter((location) => {
        const matchesSearch =
            location.location_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            location.location_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesActive =
            filterActive === "all" ||
            (filterActive === "active" && location.active) ||
            (filterActive === "inactive" && !location.active);

        return matchesSearch && matchesActive;
    });

    const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActive, rowsPerPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, location_icon: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await locationAPI.create({
                location_id: formData.location_id,
                location_name: formData.location_name,
                location_icon: formData.location_icon || undefined,
                last_modified_user_id: "ADMIN",
                active: formData.active,
            });
            toast({
                title: "Success",
                description: "Location created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ location_id: "", location_name: "", location_icon: "", active: true });
            loadLocations();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create location",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (location: Location) => {
        if (!location.active) {
            toast({
                title: "Cannot Edit",
                description: "Cancelled locations cannot be edited",
                variant: "destructive",
            });
            return;
        }
        setSelectedLocation(location);
        setFormData({
            location_id: location.location_id,
            location_name: location.location_name,
            location_icon: location.location_icon || "",
            active: location.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedLocation) return;

        if (!selectedLocation.active) {
            toast({
                title: "Cannot Edit",
                description: "This location has been cancelled and cannot be edited",
                variant: "destructive",
            });
            setIsEditModalOpen(false);
            return;
        }

        isSubmittingRef.current = true;
        const previousData = { ...selectedLocation };

        try {
            await locationAPI.update(selectedLocation.location_id, {
                location_name: formData.location_name,
                location_icon: formData.location_icon || undefined,
                last_modified_user_id: "ADMIN",
                active: formData.active,
            });

            setLastAction({ type: 'edit', data: previousData });

            toast({
                title: "Success",
                description: "Location updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedLocation(null);
            setFormData({ location_id: "", location_name: "", location_icon: "", active: true });
            loadLocations();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update location",
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
                await locationAPI.update(lastAction.data.location_id, {
                    location_name: lastAction.data.location_name,
                    location_icon: lastAction.data.location_icon || undefined,
                    last_modified_user_id: "ADMIN",
                    active: lastAction.data.active,
                });
                toast({ title: "Undone", description: "Changes have been reverted" });
            }
            setLastAction(null);
            loadLocations();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (location: Location) => {
        if (!location.active) {
            toast({
                title: "Already Cancelled",
                description: "This location is already cancelled",
                variant: "destructive",
            });
            return;
        }
        setLocationToCancel(location);
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = async () => {
        if (!locationToCancel) return;
        try {
            await locationAPI.update(locationToCancel.location_id, {
                location_name: locationToCancel.location_name,
                last_modified_user_id: "ADMIN",
                active: false,
            });
            await loadLocations();
            toast({
                title: "Cancelled",
                description: `Location ${locationToCancel.location_name} has been cancelled`,
            });
            setIsCancelDialogOpen(false);
            setLocationToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel location",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto ml-64">
                <div className="p-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Location Master</h1>
                                <p className="text-muted-foreground">Manage location information and details</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Location
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-4"
                    >
                        <Card className="p-3">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search locations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredLocations.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredLocations.length)} OF {filteredLocations.length}
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
                                                <Label className="text-sm font-semibold text-foreground">Status</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            id="loc-status-all"
                                                            name="locStatusFilter"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="loc-status-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            id="loc-status-active"
                                                            name="locStatusFilter"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="loc-status-active" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            id="loc-status-inactive"
                                                            name="locStatusFilter"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="loc-status-inactive" className="text-sm font-normal cursor-pointer text-foreground">Cancelled</Label>
                                                    </div>
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
                                                onClick={() => setFilterActive("all")}
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
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Location</span>
                                                    <span>Id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Location Name</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Location Icon</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>User Id</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Last Modified</span>
                                                    <span>Date & Time</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading locations...
                                                </td>
                                            </tr>
                                        ) : filteredLocations.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                                                    No locations found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedLocations.map((location, index) => (
                                                <motion.tr
                                                    key={location.location_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${!location.active ? 'opacity-50 bg-gray-50' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                            {location.location_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{location.location_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {location.location_icon ? (
                                                            <img
                                                                src={location.location_icon}
                                                                alt={location.location_name}
                                                                className="w-8 h-8 object-cover rounded-full"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {location.last_modified_user_id ? (
                                                            <span className="text-sm font-mono text-foreground">{location.last_modified_user_id}</span>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {location.last_modified_date_time
                                                                ? formatDateTime(location.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            location.active
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {location.active ? 'Active' : 'Cancelled'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(location);
                                                                }}
                                                                className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${
                                                                    !location.active ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                                disabled={!location.active}
                                                                title={!location.active ? "Cannot edit cancelled locations" : "Edit location"}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(location);
                                                                }}
                                                                className={`${
                                                                    location.active
                                                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        : 'opacity-50 cursor-not-allowed'
                                                                }`}
                                                                disabled={!location.active}
                                                                title={location.active ? "Cancel location" : "Already cancelled"}
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

            {/* Add Location Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Location</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location_id"
                                            value={formData.location_id}
                                            onChange={handleInputChange}
                                            placeholder="e.g., PP, QC"
                                            required
                                            maxLength={2}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location_name"
                                            value={formData.location_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter location name"
                                            required
                                            maxLength={25}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location Icon
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                                onClick={() => addIconInputRef.current?.click()}
                                            >
                                                {formData.location_icon ? (
                                                    <img src={formData.location_icon} alt="icon preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                    onClick={() => addIconInputRef.current?.click()}
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Upload Icon
                                                </Button>
                                                {formData.location_icon && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 text-xs"
                                                        onClick={() => setFormData(prev => ({ ...prev, location_icon: "" }))}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                            <input
                                                ref={addIconInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleIconUpload}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 2MB</p>
                                    </div>
                                    <div className="mb-6 flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="add-active"
                                            checked={formData.active}
                                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="add-active" className="text-sm font-semibold text-foreground cursor-pointer">
                                            Active
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Save Location
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Location Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Location</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location_id"
                                            value={formData.location_id}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location_name"
                                            value={formData.location_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter location name"
                                            required
                                            maxLength={25}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Location Icon
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                                onClick={() => editIconInputRef.current?.click()}
                                            >
                                                {formData.location_icon ? (
                                                    <img src={formData.location_icon} alt="icon preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                    onClick={() => editIconInputRef.current?.click()}
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Upload Icon
                                                </Button>
                                                {formData.location_icon && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 text-xs"
                                                        onClick={() => setFormData(prev => ({ ...prev, location_icon: "" }))}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                            <input
                                                ref={editIconInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleIconUpload}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 2MB</p>
                                    </div>
                                    <div className="mb-6 flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="edit-active"
                                            checked={formData.active}
                                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="edit-active" className="text-sm font-semibold text-foreground cursor-pointer">
                                            Active
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={isSubmittingRef.current}
                                        >
                                            Update Location
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Location Confirmation Dialog */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel location {locationToCancel?.location_name}?
                            This will make it inactive and it cannot be edited or used in the future.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelDialogOpen(false);
                            setLocationToCancel(null);
                        }}>
                            No, Keep Active
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCancel}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Yes, Cancel Location
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
