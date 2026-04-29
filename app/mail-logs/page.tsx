'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Filter, ChevronLeft, ChevronRight, Mail, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mailLogsAPI } from "@/services/api";

interface MailLog {
    _id?: string;
    mail_log_id: number;
    mail_template_id?: string;
    mail_to: string;
    mail_cc?: string;
    mail_subject: string;
    mail_sent_date_time: string;
    mail_sent_status: string;
    log_message?: string;
}

function formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    S: { label: 'Sent',   color: 'bg-green-50 text-green-700 border border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    F: { label: 'Failed', color: 'bg-red-50 text-red-700 border border-red-200',       icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function MailLogsPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<MailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'S' | 'F'>('all');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await mailLogsAPI.getAll();
            setLogs(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load mail logs", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadLogs(); }, [loadLogs]);
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, rowsPerPage]);

    const filtered = logs.filter(log => {
        const matchStatus = filterStatus === 'all' || log.mail_sent_status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
            log.mail_to.toLowerCase().includes(q) ||
            log.mail_subject.toLowerCase().includes(q) ||
            String(log.mail_log_id).includes(q) ||
            (log.mail_template_id || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

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

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }} className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                                    <Mail className="w-7 h-7 text-blue-600" />
                                    Mail Logs
                                </h1>
                                <p className="text-sm text-muted-foreground">View all outgoing mail records and their delivery status</p>
                            </div>
                            <Button variant="outline" onClick={loadLogs} className="text-sm">
                                Refresh
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search + Filter */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }} className="mb-6"
                    >
                        <Card className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Status filter tabs */}
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                    {([
                                        { value: 'all', label: 'All' },
                                        { value: 'S',   label: 'Sent' },
                                        { value: 'F',   label: 'Failed' },
                                    ] as const).map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setFilterStatus(opt.value)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                                filterStatus === opt.value
                                                    ? 'bg-white shadow text-blue-600 font-semibold'
                                                    : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search by Log ID, To, or Subject..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>

                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filtered.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + rowsPerPage, filtered.length)} OF {filtered.length}
                                </span>

                                {/* Rows per page filter */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-0" align="end">
                                        <div className="p-4 border-b border-border">
                                            <h3 className="font-semibold text-sm text-foreground">Filters</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <Label className="text-sm font-semibold text-foreground">Rows per page</Label>
                                            <select
                                                value={rowsPerPage}
                                                onChange={e => setRowsPerPage(parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Log ID</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Template</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">To</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">CC</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Subject</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Sent Date &amp; Time</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Log Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Mail className="w-8 h-8 text-gray-300" />
                                                        <span>No mail logs found</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginated.map((log, index) => {
                                                const status = STATUS_CONFIG[log.mail_sent_status] || {
                                                    label: log.mail_sent_status,
                                                    color: 'bg-gray-100 text-gray-600',
                                                    icon: null,
                                                };
                                                return (
                                                    <motion.tr
                                                        key={log._id || log.mail_log_id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                                        className="hover:bg-muted/30 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-semibold">
                                                                {String(log.mail_log_id).padStart(5, '0')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {log.mail_template_id ? (
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                    {log.mail_template_id}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm max-w-[200px]">
                                                            <div className="flex flex-wrap gap-1">
                                                                {log.mail_to.split(',').map((addr, i) => (
                                                                    <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium truncate max-w-[180px]" title={addr.trim()}>
                                                                        {addr.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm max-w-[180px]">
                                                            {log.mail_cc ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {log.mail_cc.split(',').map((addr, i) => (
                                                                        <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs truncate max-w-[160px]" title={addr.trim()}>
                                                                            {addr.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate" title={log.mail_subject}>
                                                            {log.mail_subject}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap font-mono text-xs">
                                                            {formatDateTime(log.mail_sent_date_time)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                                                {status.icon}
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={log.log_message}>
                                                            {log.log_message || '—'}
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    PAGE {currentPage} OF {totalPages || 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                    </Button>
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}>
                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
