'use client';

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Trash2, Menu as MenuIcon } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { menuAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface Menu {
    menu_id: string;
    menu_desc: string;
    active: boolean;
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
    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
}

export default function MenuMasterPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const isSubmittingRef = useRef(false);
    const [filterActive, setFilterActive] = useState<string>("all");
    const [formData, setFormData] = useState({
        menu_id: "",
        menu_desc: "",
        active: true,
    });

    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:52',message:'useEffect mounted, calling loadMenus',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        loadMenus();
    }, []);

    const loadMenus = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:56',message:'loadMenus called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4,H5'})}).catch(()=>{});
        // #endregion
        try {
            setLoading(true);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:59',message:'Before menuAPI.getAll',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2,H4'})}).catch(()=>{});
            // #endregion
            const data = await menuAPI.getAll();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:62',message:'After menuAPI.getAll',data:{dataType:Array.isArray(data)?'array':'other',dataLength:Array.isArray(data)?data.length:'N/A',firstItem:Array.isArray(data)&&data.length>0?data[0]:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H5'})}).catch(()=>{});
            // #endregion
            setMenus(data);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:65',message:'setMenus called',data:{menusCount:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
            // #endregion
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:67',message:'loadMenus error',data:{error:error.message,errorName:error.name,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Error",
                description: error.message || "Failed to load menus",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredMenus = menus.filter((menu) => {
        const matchesSearch = menu.menu_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            menu.menu_desc.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesActive = filterActive === "all" || 
            (filterActive === "active" && menu.active === true) ||
            (filterActive === "inactive" && menu.active === false);
        
        return matchesSearch && matchesActive;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:82',message:'handleSubmit called',data:{formData,isSubmitting:isSubmittingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
        // #endregion
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:88',message:'Before menuAPI.create',data:{formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            await menuAPI.create(formData);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:90',message:'After menuAPI.create success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Success",
                description: "Menu created successfully",
            });
            setIsAddModalOpen(false);
            setFormData({ menu_id: "", menu_desc: "", active: true });
            loadMenus();
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:99',message:'handleSubmit error',data:{error:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Error",
                description: error.message || "Failed to create menu",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (menu: Menu) => {
        setSelectedMenu(menu);
        setFormData({
            menu_id: menu.menu_id,
            menu_desc: menu.menu_desc,
            active: menu.active,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:117',message:'handleEditSubmit called',data:{selectedMenuId:selectedMenu?.menu_id,formData,isSubmitting:isSubmittingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
        // #endregion
        if (isSubmittingRef.current) return;
        if (!selectedMenu) return;
        isSubmittingRef.current = true;
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:124',message:'Before menuAPI.update',data:{id:selectedMenu.menu_id,updateData:{menu_desc:formData.menu_desc,active:formData.active}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            await menuAPI.update(selectedMenu.menu_id, {
                menu_desc: formData.menu_desc,
                active: formData.active,
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:130',message:'After menuAPI.update success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Success",
                description: "Menu updated successfully",
            });
            setIsEditModalOpen(false);
            setSelectedMenu(null);
            setFormData({ menu_id: "", menu_desc: "", active: true });
            loadMenus();
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:140',message:'handleEditSubmit error',data:{error:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Error",
                description: error.message || "Failed to update menu",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = (menu: Menu) => {
        setSelectedMenu(menu);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:191',message:'confirmDelete called',data:{selectedMenuId:selectedMenu?.menu_id,isSubmitting:isSubmittingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
        // #endregion
        if (isSubmittingRef.current) return;
        if (!selectedMenu) return;
        isSubmittingRef.current = true;
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:196',message:'Before menuAPI.delete',data:{id:selectedMenu.menu_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            await menuAPI.delete(selectedMenu.menu_id);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:198',message:'After menuAPI.delete success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Success",
                description: "Menu deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setSelectedMenu(null);
            loadMenus();
        } catch (error: any) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/menu-master/page.tsx:208',message:'confirmDelete error',data:{error:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            toast({
                title: "Error",
                description: error.message || "Failed to delete menu",
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Menu Master</h1>
                                <p className="text-muted-foreground">Manage application menu items and navigation</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Menu
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
                                        placeholder="Search menus by ID or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING 1-{filteredMenus.length} OF {menus.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                        <div className="flex flex-wrap gap-6 items-start">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <Label className="text-sm font-semibold">Status</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="menu-active-all" 
                                                            name="menuActiveStatus"
                                                            checked={filterActive === "all"}
                                                            onChange={() => setFilterActive("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="menu-active-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="menu-active-true" 
                                                            name="menuActiveStatus"
                                                            checked={filterActive === "active"}
                                                            onChange={() => setFilterActive("active")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="menu-active-true" className="text-sm font-normal cursor-pointer">Active</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="menu-active-false" 
                                                            name="menuActiveStatus"
                                                            checked={filterActive === "inactive"}
                                                            onChange={() => setFilterActive("inactive")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="menu-active-false" className="text-sm font-normal cursor-pointer">Inactive</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => setFilterActive("all")}
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                MENU ID
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                MENU DESCRIPTION
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                STATUS
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-32">
                                                LAST MODIFIED USER ID
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase w-40">
                                                LAST MODIFIED DATE & TIME
                                            </th>
                                            <th className="text-center px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                                                ACTIONS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredMenus.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                                    No menus found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMenus.map((menu, index) => (
                                            <motion.tr
                                                key={menu.menu_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                        {menu.menu_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {menu.menu_desc}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        menu.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    }`}>
                                                        {menu.active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground font-mono">
                                                        {menu.last_modified_user_id || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {menu.last_modified_date_time 
                                                            ? formatDateTime(menu.last_modified_date_time)
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
                                                                handleEdit(menu);
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
                                                                handleDelete(menu);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )))}
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
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time Data Sync • ACUMED DEVICES Manufacturing Cloud v4.2
                        </p>
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
                                    <h2 className="text-2xl font-bold">Add New Menu</h2>
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
                                            Menu ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_id"
                                            value={formData.menu_id}
                                            onChange={handleInputChange}
                                            placeholder="e.g., M00, T01, D00"
                                            required
                                            maxLength={3}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Menu Description <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_desc"
                                            value={formData.menu_desc}
                                            onChange={handleInputChange}
                                            placeholder="Enter menu description"
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
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
                                            Save Menu
                                        </Button>
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
                                    <h2 className="text-2xl font-bold">Edit Menu 1</h2>
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
                                            Menu ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_id"
                                            value={formData.menu_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Menu Description <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="menu_desc"
                                            value={formData.menu_desc}
                                            onChange={handleInputChange}
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-medium">Active</span>
                                        </label>
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
                                            Update Menu
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
                                        Are you sure you want to delete menu <strong>{selectedMenu?.menu_desc}</strong> ({selectedMenu?.menu_id})?
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

