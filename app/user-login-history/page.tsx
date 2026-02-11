'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ChevronLeft, ChevronRight, X, Pencil, Clock } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { userLoginHistoryAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
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

interface LoginHistory {
    _id?: string;
    user_id: string;
    login_date: string;
    login_time: string;
    logout_date?: string;
    logout_time?: string;
}

// Helper function to format dates to DD-MM-YYYY
function formatDate(dateString: string | undefined): string {
    if (!dateString) return "-";
    try {
        // Handle YYYY-MM-DD format from API
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // If already in DD-MM-YYYY format, return as is
        if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
            return dateString;
        }
        return dateString;
    } catch {
        return dateString;
    }
}

// Helper function to format time to HH:MM:SS
function formatTime(timeString: string | undefined): string {
    if (!timeString) return "-";
    // If already in HH:MM:SS format, return as is
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timeString;
    }
    // If in HH:MM format, add :00 for seconds
    if (timeString.match(/^\d{2}:\d{2}$/)) {
        return `${timeString}:00`;
    }
    return timeString;
}

export default function UserLoginHistoryPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [historyToCancel, setHistoryToCancel] = useState<LoginHistory | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<LoginHistory | null>(null);
    const [loginHistories, setLoginHistories] = useState<LoginHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUser, setFilterUser] = useState<string>("all");
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: LoginHistory } | null>(null);
    const [cancelledHistories, setCancelledHistories] = useState<Set<string>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        user_id: "",
        login_date: "",
        login_time: "",
        logout_date: "",
        logout_time: "",
    });

    const loadLoginHistories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await userLoginHistoryAPI.getAll();
            setLoginHistories(data.map((h: any) => ({
                _id: h._id,
                user_id: h.user_id,
                login_date: h.Date_login_Date ? h.Date_login_Date.split('T')[0] : '',
                login_time: h.Time_login_Time || '',
                logout_date: h.Date_Logout_Date ? h.Date_Logout_Date.split('T')[0] : undefined,
                logout_time: h.Time_Logout_Time || undefined,
            })));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load login histories",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadLoginHistories();
    }, [loadLoginHistories]);

    const filteredHistories = loginHistories.filter((history) => {
        const matchesSearch = history.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            history.login_date.includes(searchQuery);
        
        const matchesUser = filterUser === "all" || history.user_id === filterUser;
        
        return matchesSearch && matchesUser;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredHistories.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedHistories = filteredHistories.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterUser, rowsPerPage]);

    const uniqueUsers = Array.from(new Set(loginHistories.map(h => h.user_id)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (history: LoginHistory) => {
        setSelectedHistory(history);
        setFormData({
            user_id: history.user_id,
            login_date: history.login_date,
            login_time: history.login_time,
            logout_date: history.logout_date || "",
            logout_time: history.logout_time || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHistory || !selectedHistory._id) return;
        
        // Store previous state for undo
        const previousData = { ...selectedHistory };
        
        try {
            await userLoginHistoryAPI.update(selectedHistory._id, {
                Date_login_Date: formData.login_date,
                Time_login_Time: formData.login_time,
                Date_Logout_Date: formData.logout_date || undefined,
                Time_Logout_Time: formData.logout_time || undefined,
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Login history updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedHistory(null);
            setFormData({ user_id: "", login_date: "", login_time: "", logout_date: "", logout_time: "" });
            loadLoginHistories();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update login history",
                variant: "destructive",
            });
        }
    };
    
    const handleUndo = async () => {
        if (!lastAction || !lastAction.data._id) return;
        
        try {
            if (lastAction.type === 'edit') {
                // Restore previous data
                await userLoginHistoryAPI.update(lastAction.data._id, {
                    Date_login_Date: lastAction.data.login_date,
                    Time_login_Time: lastAction.data.login_time,
                    Date_Logout_Date: lastAction.data.logout_date || undefined,
                    Time_Logout_Time: lastAction.data.logout_time || undefined,
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadLoginHistories();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };


    const handleCancel = (history: LoginHistory) => {
        setHistoryToCancel(history);
        setIsCancelItemDialogOpen(true);
    };

    const confirmCancelItem = async () => {
        if (!historyToCancel || !historyToCancel._id) return;
        
        const historyKey = historyToCancel._id || `${historyToCancel.user_id}-${historyToCancel.login_date}-${historyToCancel.login_time}`;
        const isCancelled = cancelledHistories.has(historyKey);
        const newActiveStatus = !isCancelled; // false when cancelling, true when restoring
        
        try {
            await userLoginHistoryAPI.update(historyToCancel._id, {
                active: newActiveStatus,
                last_modified_user_id: "ADMIN",
            });
            
            setCancelledHistories(prev => {
                const newSet = new Set(prev);
                if (isCancelled) {
                    newSet.delete(historyKey);
                    toast({
                        title: "Restored",
                        description: `Login history for user ${historyToCancel.user_id} has been restored`,
                    });
                } else {
                    newSet.add(historyKey);
                    toast({
                        title: "Cancelled",
                        description: `Login history for user ${historyToCancel.user_id} has been cancelled`,
                    });
                }
                return newSet;
            });
            
            loadLoginHistories(); // Reload data from API
            setIsCancelItemDialogOpen(false);
            setHistoryToCancel(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isCancelled ? 'restore' : 'cancel'} login history`,
                variant: "destructive",
            });
        }
    };

    const handleCancelClick = (modalType: 'edit') => {
        setIsCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        setIsEditModalOpen(false);
        setSelectedHistory(null);
        setFormData({ user_id: "", login_date: "", login_time: "", logout_date: "", logout_time: "" });
        setIsCancelDialogOpen(false);
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">User Login History</h1>
                                <p className="text-muted-foreground">Track and manage user login and logout activities</p>
                            </div>
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
                                        placeholder="Search by user ID or date..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredHistories.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredHistories.length)} OF {filteredHistories.length}
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
                                                <Label className="text-sm font-semibold text-foreground">User ID</Label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ulh-user-all" 
                                                            name="ulhUserFilter"
                                                            checked={filterUser === "all"}
                                                            onChange={() => setFilterUser("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ulh-user-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {uniqueUsers.map((user) => (
                                                        <div key={user} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`ulh-user-${user}`} 
                                                                name="ulhUserFilter"
                                                                checked={filterUser === user}
                                                                onChange={() => setFilterUser(user)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`ulh-user-${user}`} className="text-sm font-normal cursor-pointer text-foreground">{user}</Label>
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
                                                onClick={() => setFilterUser("all")}
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
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">user id</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">login Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">login Time</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Logout Date</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Logout Time</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredHistories.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No login histories found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedHistories.map((history, index) => {
                                                const historyKey = history._id || `${history.user_id}-${history.login_date}-${history.login_time}`;
                                                const isCancelled = cancelledHistories.has(historyKey);
                                                return (
                                            <motion.tr
                                                key={historyKey}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-mono text-foreground">{history.user_id}</span>
                                                        <span className="text-xs text-muted-foreground">{history.user_id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatDate(history.login_date)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatTime(history.login_time)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatDate(history.logout_date)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{formatTime(history.logout_time)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(history);
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
                                                                handleCancel(history);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore history" : "Cancel history"}
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

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">ALL SYSTEMS OPERATIONAL</span>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => handleCancelClick('edit')} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Login Record</h2>
                                    <button onClick={() => handleCancelClick('edit')} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">User ID <span className="text-red-500">*</span></label>
                                        <Input name="user_id" value={formData.user_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Login Date <span className="text-red-500">*</span></label>
                                        <Input type="date" name="login_date" value={formData.login_date} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Login Time <span className="text-red-500">*</span></label>
                                        <Input type="time" name="login_time" value={formData.login_time} onChange={handleInputChange} required />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Logout Date</label>
                                        <Input type="date" name="logout_date" value={formData.logout_date} onChange={handleInputChange} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Logout Time</label>
                                        <Input type="time" name="logout_time" value={formData.logout_time} onChange={handleInputChange} />
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Record</Button>
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
                            {historyToCancel && cancelledHistories.has(historyToCancel._id || `${historyToCancel.user_id}-${historyToCancel.login_date}-${historyToCancel.login_time}`) 
                                ? "Confirm Restore" 
                                : "Confirm Cancel"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {historyToCancel && cancelledHistories.has(historyToCancel._id || `${historyToCancel.user_id}-${historyToCancel.login_date}-${historyToCancel.login_time}`)
                                ? `Are you sure you want to restore login history for user "${historyToCancel.user_id}"?`
                                : `Are you sure you want to cancel login history for user "${historyToCancel?.user_id}"? This action can be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsCancelItemDialogOpen(false);
                            setHistoryToCancel(null);
                        }}>
                            No, Keep Current Status
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancelItem} 
                            className={historyToCancel && cancelledHistories.has(historyToCancel._id || `${historyToCancel.user_id}-${historyToCancel.login_date}-${historyToCancel.login_time}`) 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            Yes, {historyToCancel && cancelledHistories.has(historyToCancel._id || `${historyToCancel.user_id}-${historyToCancel.login_date}-${historyToCancel.login_time}`) ? "Restore" : "Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}



