'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { productStockAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface ProductStock {
    _id?: string;
    batch_no: string;
    product_id: string;
    pack_size_id: string;
    product_status_id: string;
    total_no_of_packs: number;
    total_no_of_sachets: number;
    carton_type_id: string;
    total_no_of_cartons: number;
    last_modified_user_id: string;
    last_modified_date_time: string;
}

function formatDateTime(value: string | undefined): string {
    if (!value) return "-";
    try {
        const date = new Date(value);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    } catch {
        return value;
    }
}

export default function ProductStockReportPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [stocks, setStocks] = useState<ProductStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterProductId, setFilterProductId] = useState<string>("all");
    const [filterStatusId, setFilterStatusId] = useState<string>("all");
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const loadStocks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await productStockAPI.getAll();
            setStocks(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load product stock",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadStocks();
    }, [loadStocks]);

    const filteredStocks = stocks.filter((s) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            s.batch_no.toLowerCase().includes(q) ||
            s.product_id.toLowerCase().includes(q) ||
            s.pack_size_id.toLowerCase().includes(q) ||
            s.carton_type_id.toLowerCase().includes(q);

        const matchesProduct = filterProductId === "all" || s.product_id === filterProductId;
        const matchesStatus = filterStatusId === "all" || s.product_status_id === filterStatusId;

        return matchesSearch && matchesProduct && matchesStatus;
    });

    const totalPages = Math.ceil(filteredStocks.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterProductId, filterStatusId, rowsPerPage]);

    const uniqueProducts = Array.from(new Set(stocks.map(s => s.product_id)));
    const uniqueStatuses = Array.from(new Set(stocks.map(s => s.product_status_id)));

    const clearFilters = () => {
        setFilterProductId("all");
        setFilterStatusId("all");
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Product Stock Report</h1>
                                <p className="text-muted-foreground">View current stock levels across all batches</p>
                            </div>
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
                                        placeholder="Search by batch no, product ID, pack size..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    SHOWING {filteredStocks.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredStocks.length)} OF {filteredStocks.length}
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
                                                <Label className="text-sm font-semibold text-foreground">Product ID</Label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            id="psr-product-all"
                                                            name="psrProductFilter"
                                                            checked={filterProductId === "all"}
                                                            onChange={() => setFilterProductId("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="psr-product-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {uniqueProducts.map((pid) => (
                                                        <div key={pid} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`psr-product-${pid}`}
                                                                name="psrProductFilter"
                                                                checked={filterProductId === pid}
                                                                onChange={() => setFilterProductId(pid)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`psr-product-${pid}`} className="text-sm font-normal cursor-pointer text-foreground">{pid}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">Product Status</Label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            id="psr-status-all"
                                                            name="psrStatusFilter"
                                                            checked={filterStatusId === "all"}
                                                            onChange={() => setFilterStatusId("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="psr-status-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {uniqueStatuses.map((sid) => (
                                                        <div key={sid} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id={`psr-status-${sid}`}
                                                                name="psrStatusFilter"
                                                                checked={filterStatusId === sid}
                                                                onChange={() => setFilterStatusId(sid)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`psr-status-${sid}`} className="text-sm font-normal cursor-pointer text-foreground">{sid}</Label>
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
                                                onClick={clearFilters}
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
                            <div className="overflow-auto max-h-[420px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch No</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Product ID</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Pack Size</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Total Packs</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Total Sachets</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Carton Type</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Total Cartons</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Last Modified By</th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Last Modified</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : paginatedStocks.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-4 text-center text-muted-foreground">
                                                    No stock records found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedStocks.map((stock, index) => (
                                                <motion.tr
                                                    key={stock.batch_no}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    className="hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-mono font-semibold text-foreground">{stock.batch_no}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{stock.product_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{stock.pack_size_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {stock.product_status_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-mono text-foreground">{stock.total_no_of_packs.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-mono text-foreground">{stock.total_no_of_sachets.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{stock.carton_type_id || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-mono text-foreground">{stock.total_no_of_cartons.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-foreground">{stock.last_modified_user_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-muted-foreground">{formatDateTime(stock.last_modified_date_time)}</span>
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
        </div>
    );
}
