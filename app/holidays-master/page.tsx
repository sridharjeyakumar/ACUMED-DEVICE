'use client';

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Calendar } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { holidaysAPI } from "@/services/api";

interface Holiday {
    _id?: string;
    date: Date | string; // Date
    remarks: string; // Char(25)
    year: number; // N(4)
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date | string; // Date
}

// Helper function to format dates consistently (prevents hydration errors)
function formatDate(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
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

export default function HolidaysMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
    const isSubmittingRef = useRef(false);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: Holiday } | null>(null);
    const [cancelledHolidays, setCancelledHolidays] = useState<Set<string>>(new Set());
    const [filterYear, setFilterYear] = useState<string>("all");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        try {
            setLoading(true);
            const data = await holidaysAPI.getAll();
            setHolidays(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load holidays",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        date: "",
        remarks: "",
        year: new Date().getFullYear().toString(),
    });

    const filteredHolidays = holidays.filter((holiday) => {
        const matchesSearch = holiday.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
            formatDate(holiday.date).toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesYear = filterYear === "all" || holiday.year.toString() === filterYear;
        
        return matchesSearch && matchesYear;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredHolidays.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedHolidays = filteredHolidays.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterYear, rowsPerPage]);

    const uniqueYears = Array.from(new Set(holidays.map(h => h.year.toString()))).sort((a, b) => parseInt(b) - parseInt(a));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            await holidaysAPI.create({
                date: formData.date,
                remarks: formData.remarks,
                year: parseInt(formData.year),
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Holiday created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                date: "",
                remarks: "",
                year: new Date().getFullYear().toString(),
            });
            loadHolidays();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create holiday",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (holiday: Holiday) => {
        setSelectedHoliday(holiday);
        const holidayDate = typeof holiday.date === 'string' ? new Date(holiday.date) : holiday.date;
        const dateStr = holidayDate.toISOString().split('T')[0];
        setFormData({
            date: dateStr,
            remarks: holiday.remarks,
            year: holiday.year.toString(),
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedHoliday || !selectedHoliday._id) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedHoliday };
        
        try {
            await holidaysAPI.update(selectedHoliday._id, {
                date: formData.date,
                remarks: formData.remarks,
                year: parseInt(formData.year),
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Holiday updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedHoliday(null);
            setFormData({
                date: "",
                remarks: "",
                year: new Date().getFullYear().toString(),
            });
            loadHolidays();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update holiday",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };
    
    const handleUndo = async () => {
        if (!lastAction || !lastAction.data._id) return;
        
        try {
            if (lastAction.type === 'edit') {
                const holidayDate = typeof lastAction.data.date === 'string' ? new Date(lastAction.data.date) : lastAction.data.date;
                const dateStr = holidayDate.toISOString().split('T')[0];
                // Restore previous data
                await holidaysAPI.update(lastAction.data._id, {
                    date: dateStr,
                    remarks: lastAction.data.remarks,
                    year: lastAction.data.year,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadHolidays();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (holiday: Holiday) => {
        const holidayKey = holiday._id || `${formatDate(holiday.date)}-${holiday.year}`;
        setCancelledHolidays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(holidayKey)) {
                newSet.delete(holidayKey);
                toast({
                    title: "Restored",
                    description: `Holiday ${holiday.remarks} has been restored`,
                });
            } else {
                newSet.add(holidayKey);
                toast({
                    title: "Cancelled",
                    description: `Holiday ${holiday.remarks} has been cancelled`,
                });
            }
            return newSet;
        });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Holidays Master</h1>
                                <p className="text-muted-foreground">Manage holidays and special dates</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Holiday
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
                                        placeholder="Search holidays by date or remarks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredHolidays.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredHolidays.length)} OF {filteredHolidays.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56" align="end">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Year</Label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="year-all" 
                                                            name="yearFilter"
                                                            checked={filterYear === "all"}
                                                            onChange={() => setFilterYear("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="year-all" className="text-sm font-normal cursor-pointer">All Years</Label>
                                                    </div>
                                                    {uniqueYears.map((year) => (
                                                        <div key={year} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`year-${year}`} 
                                                                name="yearFilter"
                                                                checked={filterYear === year}
                                                                onChange={() => setFilterYear(year)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`year-${year}`} className="text-sm font-normal cursor-pointer">{year}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2 border-t border-border pt-4">
                                                <Label className="text-sm font-semibold">No. of rows per screen</Label>
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">DATE</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[200px]">REMARKS</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">YEAR</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">LAST MODIFIED USER ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">LAST MODIFIED DATE & TIME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading holidays...
                                                </td>
                                            </tr>
                                        ) : filteredHolidays.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No holidays found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedHolidays.map((holiday, index) => {
                                                const holidayKey = holiday._id || `${formatDate(holiday.date)}-${holiday.year}`;
                                                const isCancelled = cancelledHolidays.has(holidayKey);
                                                return (
                                                <motion.tr
                                                    key={holidayKey}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-mono">{formatDate(holiday.date)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{holiday.remarks}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{holiday.year}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground font-mono">{holiday.last_modified_user_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {holiday.last_modified_date_time 
                                                                ? formatDateTime(holiday.last_modified_date_time)
                                                                : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(holiday);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                disabled={isCancelled}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(holiday);
                                                                }}
                                                                className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={isCancelled ? "Restore holiday" : "Cancel holiday"}
                                                            >
                                                                Cancel
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

            {/* Add Holiday Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Holiday</h2>
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
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Remarks <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Enter holiday remarks"
                                            required
                                            maxLength={25}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Year <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="year"
                                            type="number"
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            placeholder="Enter year (e.g., 2026)"
                                            required
                                            min={1000}
                                            max={9999}
                                        />
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
                                            Save Holiday
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Holiday Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Holiday</h2>
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
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Remarks <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Enter holiday remarks"
                                            required
                                            maxLength={25}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Year <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="year"
                                            type="number"
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            placeholder="Enter year (e.g., 2026)"
                                            required
                                            min={1000}
                                            max={9999}
                                        />
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
                                            Update Holiday
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}

