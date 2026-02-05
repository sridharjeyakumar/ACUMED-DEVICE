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
import { weeklyOffAPI } from "@/services/api";
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

interface WeeklyOff {
    _id?: string;
    week_off_id: number; // N(1) - PK
    day_of_week: number; // N(1) - 1=Monday, 2=Tuesday, ..., 7=Sunday
    week_of_month?: number; // N(1) - Optional, week number within month (1-4)
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date | string; // Date
}

// Helper function to get day name from number
function getDayName(dayNumber: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNumber - 1] || '-';
}

// Helper function to format dates consistently (prevents hydration errors)
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

export default function WeeklyOffMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedWeeklyOff, setSelectedWeeklyOff] = useState<WeeklyOff | null>(null);
    const isSubmittingRef = useRef(false);
    const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOff[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: WeeklyOff } | null>(null);
    const [cancelledWeeklyOffs, setCancelledWeeklyOffs] = useState<Set<string>>(new Set());
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [weeklyOffToCancel, setWeeklyOffToCancel] = useState<WeeklyOff | null>(null);
    const [filterDay, setFilterDay] = useState<string>("all");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        loadWeeklyOffs();
    }, []);

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({ week_off_id: "", day_of_week: "", week_of_month: "" });
        }
    }, [isAddModalOpen]);

    const loadWeeklyOffs = async () => {
        try {
            setLoading(true);
            const data = await weeklyOffAPI.getAll();
            setWeeklyOffs(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load weekly off records",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        week_off_id: "",
        day_of_week: "",
        week_of_month: "",
    });

    const filteredWeeklyOffs = weeklyOffs.filter((weeklyOff) => {
        const matchesSearch = weeklyOff.week_off_id.toString().includes(searchQuery) ||
            getDayName(weeklyOff.day_of_week).toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDay = filterDay === "all" || weeklyOff.day_of_week.toString() === filterDay;
        
        return matchesSearch && matchesDay;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredWeeklyOffs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedWeeklyOffs = filteredWeeklyOffs.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterDay, rowsPerPage]);

    const uniqueDays = Array.from(new Set(weeklyOffs.map(w => w.day_of_week.toString()))).sort((a, b) => parseInt(a) - parseInt(b));

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
            await weeklyOffAPI.create({
                week_off_id: formData.week_off_id,
                day_of_week: formData.day_of_week,
                week_of_month: formData.week_of_month || undefined,
                last_modified_user_id: "ADMIN",
            });
            toast({
                title: "Success",
                description: "Weekly off record created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({
                week_off_id: "",
                day_of_week: "",
                week_of_month: "",
            });
            loadWeeklyOffs();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create weekly off record",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (weeklyOff: WeeklyOff) => {
        setSelectedWeeklyOff(weeklyOff);
        setFormData({
            week_off_id: weeklyOff.week_off_id.toString(),
            day_of_week: weeklyOff.day_of_week.toString(),
            week_of_month: weeklyOff.week_of_month?.toString() || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedWeeklyOff || !selectedWeeklyOff._id) return;
        isSubmittingRef.current = true;
        
        // Store previous state for undo
        const previousData = { ...selectedWeeklyOff };
        
        try {
            await weeklyOffAPI.update(selectedWeeklyOff._id, {
                day_of_week: formData.day_of_week,
                week_of_month: formData.week_of_month || undefined,
                last_modified_user_id: "ADMIN",
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Weekly off record updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedWeeklyOff(null);
            setFormData({
                week_off_id: "",
                day_of_week: "",
                week_of_month: "",
            });
            loadWeeklyOffs();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update weekly off record",
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
                // Restore previous data
                await weeklyOffAPI.update(lastAction.data._id, {
                    day_of_week: lastAction.data.day_of_week,
                    week_of_month: lastAction.data.week_of_month,
                    last_modified_user_id: "ADMIN",
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadWeeklyOffs();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };

    const handleCancel = (weeklyOff: WeeklyOff) => {
        setWeeklyOffToCancel(weeklyOff);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = () => {
        if (!weeklyOffToCancel) return;
        
        const weeklyOffKey = weeklyOffToCancel._id || weeklyOffToCancel.week_off_id.toString();
        const isCancelled = cancelledWeeklyOffs.has(weeklyOffKey);
        setCancelledWeeklyOffs(prev => {
            const newSet = new Set(prev);
            if (isCancelled) {
                newSet.delete(weeklyOffKey);
                toast({
                    title: "Restored",
                    description: `Weekly off record has been restored`,
                });
            } else {
                newSet.add(weeklyOffKey);
                toast({
                    title: "Cancelled",
                    description: `Weekly off record has been cancelled`,
                });
            }
            return newSet;
        });
        setIsCancelItemDialogOpen(false);
        setWeeklyOffToCancel(null);
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Weekly Off Master</h1>
                                <p className="text-muted-foreground">Manage weekly off days and schedules</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Weekly Off
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
                                        placeholder="Search by ID or day of week..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredWeeklyOffs.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredWeeklyOffs.length)} OF {filteredWeeklyOffs.length}
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
                                                <Label className="text-sm font-semibold text-foreground">Day of Week</Label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="day-all" 
                                                            name="dayFilter"
                                                            checked={filterDay === "all"}
                                                            onChange={() => setFilterDay("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="day-all" className="text-sm font-normal cursor-pointer text-foreground">All Days</Label>
                                                    </div>
                                                    {uniqueDays.map((day) => (
                                                        <div key={day} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`day-${day}`} 
                                                                name="dayFilter"
                                                                checked={filterDay === day}
                                                                onChange={() => setFilterDay(day)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`day-${day}`} className="text-sm font-normal cursor-pointer text-foreground">
                                                                {getDayName(parseInt(day))} ({day})
                                                            </Label>
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
                                                onClick={() => setFilterDay("all")}
                                            >
                                                Clear Filter
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-24">WEEK OFF ID</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase min-w-[150px]">DAY OF WEEK</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">WEEK OF MONTH</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">LAST MODIFIED USER ID / NAME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">LAST MODIFIED DATE & TIME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading weekly off records...
                                                </td>
                                            </tr>
                                        ) : filteredWeeklyOffs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No weekly off records found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedWeeklyOffs.map((weeklyOff, index) => {
                                                const weeklyOffKey = weeklyOff._id || weeklyOff.week_off_id.toString();
                                                const isCancelled = cancelledWeeklyOffs.has(weeklyOffKey);
                                                return (
                                                <motion.tr
                                                    key={weeklyOffKey}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                                            {weeklyOff.week_off_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{getDayName(weeklyOff.day_of_week)} ({weeklyOff.day_of_week})</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{weeklyOff.week_of_month || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {weeklyOff.last_modified_user_id ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-mono text-foreground">{weeklyOff.last_modified_user_id}</span>
                                                                <span className="text-xs text-muted-foreground">{weeklyOff.last_modified_user_id}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">
                                                            {weeklyOff.last_modified_date_time 
                                                                ? formatDateTime(weeklyOff.last_modified_date_time)
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
                                                                    handleEdit(weeklyOff);
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
                                                                    handleCancel(weeklyOff);
                                                                }}
                                                                className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                                title={isCancelled ? "Restore record" : "Cancel record"}
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

            {/* Add Weekly Off Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Weekly Off</h2>
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
                                            Week Off ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="week_off_id"
                                            type="number"
                                            value={formData.week_off_id}
                                            onChange={handleInputChange}
                                            placeholder="Enter week off ID (1-9)"
                                            required
                                            min={1}
                                            max={9}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Day of Week <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="day_of_week"
                                            value={formData.day_of_week}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            required
                                        >
                                            <option value="">Select day</option>
                                            <option value="1">Monday (1)</option>
                                            <option value="2">Tuesday (2)</option>
                                            <option value="3">Wednesday (3)</option>
                                            <option value="4">Thursday (4)</option>
                                            <option value="5">Friday (5)</option>
                                            <option value="6">Saturday (6)</option>
                                            <option value="7">Sunday (7)</option>
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Week of Month (Optional)
                                        </label>
                                        <select
                                            name="week_of_month"
                                            value={formData.week_of_month}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                        >
                                            <option value="">None</option>
                                            <option value="1">Week 1</option>
                                            <option value="2">Week 2</option>
                                            <option value="3">Week 3</option>
                                            <option value="4">Week 4</option>
                                        </select>
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
                                            Save Weekly Off
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Weekly Off Modal */}
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
                                    <h2 className="text-2xl font-bold">Edit Weekly Off</h2>
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
                                            Week Off ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="week_off_id"
                                            type="number"
                                            value={formData.week_off_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Day of Week <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="day_of_week"
                                            value={formData.day_of_week}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                            required
                                        >
                                            <option value="">Select day</option>
                                            <option value="1">Monday (1)</option>
                                            <option value="2">Tuesday (2)</option>
                                            <option value="3">Wednesday (3)</option>
                                            <option value="4">Thursday (4)</option>
                                            <option value="5">Friday (5)</option>
                                            <option value="6">Saturday (6)</option>
                                            <option value="7">Sunday (7)</option>
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Week of Month (Optional)
                                        </label>
                                        <select
                                            name="week_of_month"
                                            value={formData.week_of_month}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                        >
                                            <option value="">None</option>
                                            <option value="1">Week 1</option>
                                            <option value="2">Week 2</option>
                                            <option value="3">Week 3</option>
                                            <option value="4">Week 4</option>
                                        </select>
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
                                            Update Weekly Off
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Item Confirmation Dialog (for table actions) */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {weeklyOffToCancel && cancelledWeeklyOffs.has(weeklyOffToCancel._id || weeklyOffToCancel.week_off_id.toString()) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {weeklyOffToCancel && cancelledWeeklyOffs.has(weeklyOffToCancel._id || weeklyOffToCancel.week_off_id.toString())
                                ? `Are you sure you want to restore weekly off record for ${getDayName(weeklyOffToCancel.day_of_week)}?`
                                : `Are you sure you want to cancel weekly off record for ${weeklyOffToCancel ? getDayName(weeklyOffToCancel.day_of_week) : ''}? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setWeeklyOffToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={weeklyOffToCancel && cancelledWeeklyOffs.has(weeklyOffToCancel._id || weeklyOffToCancel.week_off_id.toString()) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {weeklyOffToCancel && cancelledWeeklyOffs.has(weeklyOffToCancel._id || weeklyOffToCancel.week_off_id.toString()) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

