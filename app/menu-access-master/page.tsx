'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Key } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { menuAccessAPI, roleAPI, menuAPI, userAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";

interface MenuAccess {
    rold_id: string;
    menu_id: string;
    access: boolean;
    can_add: boolean;
    can_edit: boolean;
    can_view: boolean;
    can_cancel: boolean;
    last_modified_user_id?: string; // Char(5)
    last_modified_date_time?: Date | string; // Date
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

export default function MenuAccessMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAccess, setSelectedAccess] = useState<MenuAccess | null>(null);
    const [menuAccesses, setMenuAccesses] = useState<MenuAccess[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [menus, setMenus] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState<string>("all");
    const [filterMenu, setFilterMenu] = useState<string>("all");
    const [filterAccess, setFilterAccess] = useState<string>("all");
    const [lastAction, setLastAction] = useState<{ type: 'edit'; data: MenuAccess } | null>(null);
    const [cancelledAccesses, setCancelledAccesses] = useState<Set<string>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [formData, setFormData] = useState({
        rold_id: "",
        menu_id: "",
        access: true,
        can_add: true,
        can_edit: true,
        can_view: true,
        can_cancel: true,
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [accessesData, rolesData, menusData, usersData] = await Promise.all([
                menuAccessAPI.getAll(),
                roleAPI.getAll(),
                menuAPI.getAll(),
                userAPI.getAll(),
            ]);
            setMenuAccesses(accessesData);
            setRoles(rolesData);
            setMenus(menusData);
            setUsers(usersData);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Create lookup maps for quick access
    const roleMap = new Map(roles.map(r => [r.roll_id, r.roll_description]));
    const menuMap = new Map(menus.map(m => [m.menu_id, m.menu_desc]));
    const userMap = new Map(users.map(u => [u.user_id, u.user_id])); // user_id is the name itself

    const filteredAccesses = menuAccesses.filter((access) => {
        const matchesSearch = access.rold_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            access.menu_id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRole = filterRole === "all" || access.rold_id === filterRole;
        const matchesMenu = filterMenu === "all" || access.menu_id === filterMenu;
        const matchesAccess = filterAccess === "all" || 
            (filterAccess === "active" && access.access === true) ||
            (filterAccess === "inactive" && access.access === false);
        
        return matchesSearch && matchesRole && matchesMenu && matchesAccess;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredAccesses.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedAccesses = filteredAccesses.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterRole, filterMenu, filterAccess, rowsPerPage]);

    const uniqueRoles = Array.from(new Set(menuAccesses.map(a => a.rold_id)));
    const uniqueMenus = Array.from(new Set(menuAccesses.map(a => a.menu_id)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await menuAccessAPI.create(formData);
            toast({
                title: "Success",
                description: "Menu access created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ rold_id: "", menu_id: "", access: true, can_add: true, can_edit: true, can_view: true, can_cancel: true });
            loadMenuAccesses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create menu access",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (access: MenuAccess) => {
        setSelectedAccess(access);
        setFormData({
            rold_id: access.rold_id,
            menu_id: access.menu_id,
            access: access.access,
            can_add: access.can_add,
            can_edit: access.can_edit,
            can_view: access.can_view,
            can_cancel: access.can_cancel,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccess) return;
        
        // Store previous state for undo
        const previousData = { ...selectedAccess };
        
        try {
            await menuAccessAPI.update(selectedAccess.rold_id, selectedAccess.menu_id, {
                access: formData.access,
                can_add: formData.can_add,
                can_edit: formData.can_edit,
                can_view: formData.can_view,
                can_cancel: formData.can_cancel,
            });
            
            // Store last action for undo
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Menu access updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedAccess(null);
            setFormData({ rold_id: "", menu_id: "", access: true, can_add: true, can_edit: true, can_view: true, can_cancel: true });
            loadMenuAccesses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update menu access",
                variant: "destructive",
            });
        }
    };
    
    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            if (lastAction.type === 'edit') {
                // Restore previous data
                await menuAccessAPI.update(lastAction.data.rold_id, lastAction.data.menu_id, {
                    access: lastAction.data.access,
                    can_add: lastAction.data.can_add,
                    can_edit: lastAction.data.can_edit,
                    can_view: lastAction.data.can_view,
                    can_cancel: lastAction.data.can_cancel,
                });
                toast({
                    title: "Undone",
                    description: "Changes have been reverted",
                });
            }
            setLastAction(null);
            loadMenuAccesses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
        }
    };


    const handleCancel = (access: MenuAccess) => {
        const accessKey = `${access.rold_id}-${access.menu_id}`;
        setCancelledAccesses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(accessKey)) {
                newSet.delete(accessKey);
                toast({
                    title: "Restored",
                    description: `Menu access for Role ${access.rold_id} - Menu ${access.menu_id} has been restored`,
                });
            } else {
                newSet.add(accessKey);
                toast({
                    title: "Cancelled",
                    description: `Menu access for Role ${access.rold_id} - Menu ${access.menu_id} has been cancelled`,
                });
            }
            return newSet;
        });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Menu Access Master</h1>
                                <p className="text-muted-foreground">Manage role-based menu access and permissions</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Access
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
                                        placeholder="Search by role ID or menu ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredAccesses.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredAccesses.length)} OF {filteredAccesses.length}
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
                                                <Label className="text-sm font-semibold text-foreground">Role ID</Label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ma-role-all" 
                                                            name="maRoleFilter"
                                                            checked={filterRole === "all"}
                                                            onChange={() => setFilterRole("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ma-role-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {uniqueRoles.map((role) => (
                                                        <div key={role} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`ma-role-${role}`} 
                                                                name="maRoleFilter"
                                                                checked={filterRole === role}
                                                                onChange={() => setFilterRole(role)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`ma-role-${role}`} className="text-sm font-normal cursor-pointer text-foreground">{role}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Menu ID</Label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ma-menu-all" 
                                                            name="maMenuFilter"
                                                            checked={filterMenu === "all"}
                                                            onChange={() => setFilterMenu("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ma-menu-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {uniqueMenus.map((menu) => (
                                                        <div key={menu} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`ma-menu-${menu}`} 
                                                                name="maMenuFilter"
                                                                checked={filterMenu === menu}
                                                                onChange={() => setFilterMenu(menu)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`ma-menu-${menu}`} className="text-sm font-normal cursor-pointer text-foreground">{menu}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Access Status</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ma-access-all" 
                                                            name="maAccessFilter"
                                                            checked={filterAccess === "all"}
                                                            onChange={() => setFilterAccess("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ma-access-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ma-access-active" 
                                                            name="maAccessFilter"
                                                            checked={filterAccess === "active"}
                                                            onChange={() => setFilterAccess("active")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ma-access-active" className="text-sm font-normal cursor-pointer text-foreground">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="ma-access-inactive" 
                                                            name="maAccessFilter"
                                                            checked={filterAccess === "inactive"}
                                                            onChange={() => setFilterAccess("inactive")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="ma-access-inactive" className="text-sm font-normal cursor-pointer text-foreground">Inactive</Label>
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
                                                onClick={() => {
                                                    setFilterRole("all");
                                                    setFilterMenu("all");
                                                    setFilterAccess("all");
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ROLE ID / NAME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">MENU ID / NAME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ACCESS</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ADD</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">EDIT</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">VIEW</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">CANCEL</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">LAST MODIFIED USER ID / NAME</th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">LAST MODIFIED DATE & TIME</th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredAccesses.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-4 text-center text-muted-foreground">
                                                    No menu accesses found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedAccesses.map((access, index) => {
                                                const accessKey = `${access.rold_id}-${access.menu_id}`;
                                                const isCancelled = cancelledAccesses.has(accessKey);
                                                return (
                                            <motion.tr
                                                key={accessKey}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={`hover:bg-muted/30 transition-colors ${isCancelled ? 'opacity-40' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-mono text-foreground">{access.rold_id}</span>
                                                        <span className="text-xs text-muted-foreground">{roleMap.get(access.rold_id) || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-mono text-foreground">{access.menu_id}</span>
                                                        <span className="text-xs text-muted-foreground">{menuMap.get(access.menu_id) || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.access ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_add ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_edit ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_view ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`w-3 h-3 rounded-full inline-block ${access.can_cancel ? "bg-green-500" : "bg-red-500"}`}></span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {access.last_modified_user_id ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-mono text-foreground">{access.last_modified_user_id}</span>
                                                            <span className="text-xs text-muted-foreground">{userMap.get(access.last_modified_user_id) || "-"}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {access.last_modified_date_time 
                                                            ? formatDateTime(access.last_modified_date_time)
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
                                                                handleEdit(access);
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
                                                                handleCancel(access);
                                                            }}
                                                            className={`${isCancelled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            title={isCancelled ? "Restore access" : "Cancel access"}
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

            {/* Add Modal */}
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
                                    <h2 className="text-2xl font-bold">Add Menu Access</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Role ID <span className="text-red-500">*</span></label>
                                        <Input name="rold_id" value={formData.rold_id} onChange={handleInputChange} placeholder="e.g., ADM, OPR" required maxLength={3} />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Menu ID <span className="text-red-500">*</span></label>
                                        <Input name="menu_id" value={formData.menu_id} onChange={handleInputChange} placeholder="e.g., M00, T01" required maxLength={3} />
                                    </div>
                                    <div className="mb-6 space-y-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="access" checked={formData.access} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Access</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_add" checked={formData.can_add} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can Add</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_edit" checked={formData.can_edit} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can Edit</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_view" checked={formData.can_view} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can View</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="can_cancel" checked={formData.can_cancel} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Can Cancel</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save Access</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Menu Access</h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2"><X className="w-6 h-6" /></button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Role ID <span className="text-red-500">*</span></label>
                                        <Input name="rold_id" value={formData.rold_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Menu ID <span className="text-red-500">*</span></label>
                                        <Input name="menu_id" value={formData.menu_id} onChange={handleInputChange} required disabled />
                                    </div>
                                    <div className="mb-6 space-y-3">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="access" checked={formData.access} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Access</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_add" checked={formData.can_add} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can Add</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_edit" checked={formData.can_edit} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can Edit</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_view" checked={formData.can_view} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can View</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="can_cancel" checked={formData.can_cancel} onChange={handleInputChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium">Can Cancel</span></label>
                                    </div>
                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update Access</Button>
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



