'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, X, CheckCircle2, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { coaGenerationAPI, userAPI, companyAPI, productAPI, employeeAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";

// ─── Types ──────────────────────────────────────────────────────────────────

interface COAHeader {
  _id?: string;
  coa_no: string;
  coa_date: string;
  batch_no: string;
  product_id: string;
  manufactured_date: string;
  expiry_date: string;
  coa_checklist_id: string;
  coa_overall_result: string;
  remarks?: string;
  entered_by_user_id: string;
  entered_date_time: string;
  approval_remarks?: string;
  approved_by_user_id?: string;
  approved_date_time?: string;
  review_by_user_id?: string;
  review_date_time?: string;
  status: string;
}

interface DetailRow {
  checklist_sno: number;
  checklist_parameter: string;
  expected_result: string;
  expected_value_1?: number;
  expected_value_2?: number;
  expected_text?: string;
  actual_value: string;
  actual_text: string;
  actual_result: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string | undefined) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
}

function fmtDT(d: string | undefined) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '00')}-${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

function toDateTimeLocal(d: string | Date | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

const STATUS_BADGE: Record<string, string> = {
  E: 'bg-blue-50 text-blue-700 border border-blue-200',
  A: 'bg-green-50 text-green-700 border border-green-200',
  X: 'bg-red-50 text-red-700 border border-red-200',
};
const STATUS_LABEL: Record<string, string> = { E: 'Entered', A: 'Approved', X: 'Cancelled' };
const RESULT_BADGE: Record<string, string> = {
  P: 'bg-green-50 text-green-700',
  F: 'bg-red-50 text-red-700',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function COAApprovalPage() {
  const { toast } = useToast();
  const userId = getSessionUser()?.user_id || 'ADMIN';

  // List state
  const [coaList, setCoaList]           = useState<COAHeader[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage]   = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailCache, setDetailCache]   = useState<Record<string, any[]>>({});

  // Approval state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedCOA,         setSelectedCOA]         = useState<COAHeader | null>(null);
  const [approvalRemarks,     setApprovalRemarks]     = useState('');
  const [approvalDetails,     setApprovalDetails]     = useState<DetailRow[]>([]);
  const [reviewByUserId,      setReviewByUserId]      = useState('');
  const [reviewDateTime,      setReviewDateTime]      = useState('');
  const [usersList,           setUsersList]           = useState<{ user_id: string }[]>([]);

  // Print state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printCOA,         setPrintCOA]         = useState<COAHeader | null>(null);
  const [printDetails,     setPrintDetails]     = useState<any[]>([]);
  const [printMetaMap,     setPrintMetaMap]     = useState<Record<number, any>>({});
  const [printCompany,     setPrintCompany]     = useState<any>(null);
  const [printProductName, setPrintProductName] = useState<string>('');
  const [printUserNames,   setPrintUserNames]   = useState<Record<string, string>>({});

  // ── Load list ───────────────────────────────────────────────────────────────

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coaGenerationAPI.getAll();
      setCoaList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadList(); }, [loadList]);

  // ── Expand rows ─────────────────────────────────────────────────────────────

  const toggleRow = async (coaNo: string, checklistId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(coaNo) ? next.delete(coaNo) : next.add(coaNo);
      return next;
    });
    if (!detailCache[coaNo]) {
      try {
        const [res, items] = await Promise.all([
          coaGenerationAPI.getById(coaNo),
          coaGenerationAPI.getChecklistItems(checklistId).catch(() => []),
        ]);
        const metaMap: Record<number, any> = {};
        (Array.isArray(items) ? items : []).forEach((item: any) => { metaMap[item.checklist_sno] = item; });
        const merged = (res.details || []).map((d: any) => {
          const m = metaMap[d.checklist_sno] || {};
          return {
            ...d,
            checklist_parameter: m.checklist_parameter || d.checklist_parameter || '',
            expected_result:     m.expected_result     || d.expected_result     || '',
            expected_value_1:    m.expected_value_1    ?? d.expected_value_1,
            expected_value_2:    m.expected_value_2    ?? d.expected_value_2,
            expected_text:       m.expected_text       || d.expected_text       || '',
          };
        });
        setDetailCache(prev => ({ ...prev, [coaNo]: merged }));
      } catch {
        setDetailCache(prev => ({ ...prev, [coaNo]: [] }));
      }
    }
  };

  // ── Load users when approval modal opens ────────────────────────────────────

  useEffect(() => {
    if (isApprovalModalOpen && usersList.length === 0) {
      userAPI.getAll()
        .then((data: any) => setUsersList(Array.isArray(data) ? data : []))
        .catch(() => setUsersList([]));
    }
  }, [isApprovalModalOpen]);

  // ── Open Approval ───────────────────────────────────────────────────────────

  const handleOpenApproval = async (coa: COAHeader) => {
    setSelectedCOA(coa);
    setApprovalRemarks('');
    setReviewByUserId('');
    setReviewDateTime(toDateTimeLocal(new Date()));
    try {
      const [res, items] = await Promise.all([
        coaGenerationAPI.getById(coa.coa_no),
        coaGenerationAPI.getChecklistItems(coa.coa_checklist_id).catch(() => []),
      ]);
      const metaMap: Record<number, any> = {};
      (Array.isArray(items) ? items : []).forEach((item: any) => { metaMap[item.checklist_sno] = item; });
      setApprovalDetails((res.details || []).map((d: any) => {
        const m = metaMap[d.checklist_sno] || {};
        return {
          checklist_sno:       d.checklist_sno,
          checklist_parameter: m.checklist_parameter || '',
          expected_result:     m.expected_result || '',
          expected_value_1:    m.expected_value_1,
          expected_value_2:    m.expected_value_2,
          expected_text:       m.expected_text,
          actual_value:        d.actual_value !== undefined ? String(d.actual_value) : '',
          actual_text:         d.actual_text || '',
          actual_result:       d.actual_result || 'F',
        };
      }));
    } catch {
      setApprovalDetails([]);
    }
    setIsApprovalModalOpen(true);
  };

  // ── Submit Approval ─────────────────────────────────────────────────────────

  const handleApprovalSubmit = async (action: 'A' | 'X') => {
    if (!selectedCOA) return;
    if (action === 'A' && !approvalRemarks.trim()) {
      toast({ title: 'Required', description: 'Approval remarks are required', variant: 'destructive' });
      return;
    }
    if (!reviewByUserId) {
      toast({ title: 'Required', description: 'Review By User ID is required', variant: 'destructive' });
      return;
    }
    if (!reviewDateTime) {
      toast({ title: 'Required', description: 'Review Date & Time is required', variant: 'destructive' });
      return;
    }
    const reviewDT  = new Date(reviewDateTime);
    const enteredDT = new Date(selectedCOA.entered_date_time);
    const nowDT     = new Date();
    if (reviewDT < enteredDT) {
      toast({ title: 'Invalid Date', description: 'Review Date & Time must be on or after Entered Date & Time', variant: 'destructive' });
      return;
    }
    if (reviewDT > nowDT) {
      toast({ title: 'Invalid Date', description: 'Review Date & Time cannot be in the future', variant: 'destructive' });
      return;
    }
    try {
      await coaGenerationAPI.update(selectedCOA.coa_no, {
        mode: 'approval',
        status: action,
        approval_remarks: approvalRemarks,
        approved_by_user_id: userId,
        review_by_user_id: reviewByUserId,
        review_date_time: reviewDateTime,
      });
      toast({
        title: action === 'A' ? 'Approved' : 'Cancelled',
        description: `${selectedCOA.coa_no} ${action === 'A' ? 'approved' : 'cancelled'} successfully`,
      });
      setIsApprovalModalOpen(false);
      setSelectedCOA(null);
      loadList();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update', variant: 'destructive' });
    }
  };

  // ── Open Print ──────────────────────────────────────────────────────────────

  const handleOpenPrint = async (coa: COAHeader) => {
    setPrintCOA(coa);
    setPrintDetails([]);
    setPrintMetaMap({});
    setPrintCompany(null);
    setPrintProductName('');
    setPrintUserNames({});
    try {
      const [res, items, allCompanies, productInfo, allUsers, allEmployees] = await Promise.all([
        coaGenerationAPI.getById(coa.coa_no),
        coaGenerationAPI.getChecklistItems(coa.coa_checklist_id).catch(() => []),
        companyAPI.getAll().catch(() => []),
        productAPI.getById(coa.product_id).catch(() => null),
        userAPI.getAll().catch(() => []),
        employeeAPI.getAll().catch(() => []),
      ]);

      // emp_id → emp_name
      const empNameMap: Record<string, string> = {};
      (Array.isArray(allEmployees) ? allEmployees : []).forEach((e: any) => {
        if (e.emp_id && e.emp_name) empNameMap[e.emp_id] = e.emp_name;
      });

      // user_id → emp_name (via employee_id)
      const nameMap: Record<string, string> = {};
      (Array.isArray(allUsers) ? allUsers : []).forEach((u: any) => {
        if (u.user_id && u.employee_id && empNameMap[u.employee_id]) {
          nameMap[u.user_id] = empNameMap[u.employee_id];
        }
      });
      setPrintUserNames(nameMap);
      setPrintProductName(productInfo?.product_name || '');

      const meta: Record<number, any> = {};
      (Array.isArray(items) ? items : []).forEach((item: any) => { meta[item.checklist_sno] = item; });
      setPrintMetaMap(meta);
      setPrintDetails(res.details || []);

      const corp = (Array.isArray(allCompanies) ? allCompanies : []).find((c: any) => c.comp_id === 'CORP') || null;
      setPrintCompany(corp);
    } catch {
      setPrintDetails([]);
    }
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => { window.print(); };

  // ── Filter / Pagination ─────────────────────────────────────────────────────

  const filtered = coaList.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = c.coa_no.toLowerCase().includes(q) ||
      c.batch_no.toLowerCase().includes(q) ||
      c.product_id.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

  // ─── Read-only detail table ──────────────────────────────────────────────────

  const renderDetailTable = (rows: DetailRow[]) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-border">
            <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">Sno</th>
            <th className="px-3 py-2 text-left font-semibold text-xs">Parameter</th>
            <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Exp. Result</th>
            <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Exp. Val 1</th>
            <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Exp. Val 2</th>
            <th className="px-3 py-2 text-left font-semibold text-xs">Exp. Text</th>
            <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Actual Value</th>
            <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">Actual Text</th>
            <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">Actual Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground text-xs">No detail records</td>
            </tr>
          ) : rows.map(row => (
            <tr key={row.checklist_sno} className="hover:bg-muted/20">
              <td className="px-3 py-2 text-center text-xs font-mono">{row.checklist_sno}</td>
              <td className="px-3 py-2 text-xs">{row.checklist_parameter}</td>
              <td className="px-3 py-2 text-center">
                <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">{row.expected_result}</span>
              </td>
              <td className="px-3 py-2 text-center text-xs font-mono">{row.expected_value_1 !== undefined ? row.expected_value_1 : '-'}</td>
              <td className="px-3 py-2 text-center text-xs font-mono">{row.expected_value_2 !== undefined ? row.expected_value_2 : '-'}</td>
              <td className="px-3 py-2 text-xs">{row.expected_text || '-'}</td>
              <td className="px-3 py-2 text-center text-xs font-mono">{row.actual_value !== '' ? row.actual_value : '-'}</td>
              <td className="px-3 py-2 text-xs">{row.actual_text || '-'}</td>
              <td className="px-3 py-2 text-center">
                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${RESULT_BADGE[row.actual_result] || ''}`}>
                  {row.actual_result === 'P' ? 'Pass' : row.actual_result === 'F' ? 'Fail' : row.actual_result || '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className="p-8">

          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">COA Approval</h1>
              <p className="text-muted-foreground">Review, approve, and print Certificate of Analysis</p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search COA No., Batch, Product..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="E">Entered</option>
                  <option value="A">Approved</option>
                  <option value="X">Cancelled</option>
                </select>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-auto">
                  {loading ? 'LOADING...' : `${filtered.length} OF ${coaList.length} RECORDS`}
                </span>
              </div>
            </Card>
          </motion.div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-border">
                      <th className="w-10 px-3 py-3"></th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">COA No.</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">COA Date</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Batch No.</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Product ID</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Manufacture Date</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Expiry Date</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Checklist ID</th>
                      <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Overall Result</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Remark</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Entered By UserID</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Entered By Date & Time</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Reviewed By UserID</th>
                      <th className="px-4 py-3 text-sm font-semibold text-left whitespace-nowrap">Reviewed Date & Time</th>
                      <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-sm font-semibold text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr><td colSpan={16} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={16} className="px-4 py-8 text-center text-muted-foreground">No COA records found</td></tr>
                    ) : paginated.map((coa, idx) => (
                      <React.Fragment key={coa.coa_no}>
                        <motion.tr
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 py-4 text-center">
                            <button
                              onClick={() => toggleRow(coa.coa_no, coa.coa_checklist_id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {expandedRows.has(coa.coa_no) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{coa.coa_no}</span>
                          </td>
                          <td className="px-4 py-4 text-sm">{fmt(coa.coa_date)}</td>
                          <td className="px-4 py-4"><span className="font-mono text-sm">{coa.batch_no}</span></td>
                          <td className="px-4 py-4 text-sm">{coa.product_id}</td>
                          <td className="px-4 py-4 text-sm">{fmt(coa.manufactured_date)}</td>
                          <td className="px-4 py-4 text-sm">{fmt(coa.expiry_date)}</td>
                          <td className="px-4 py-4 text-sm font-mono">{coa.coa_checklist_id}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${RESULT_BADGE[coa.coa_overall_result] || ''}`}>
                              {coa.coa_overall_result === 'P' ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">{coa.remarks || '-'}</td>
                          <td className="px-4 py-4 text-sm font-mono">{coa.entered_by_user_id}</td>
                          <td className="px-4 py-4 text-sm">{fmtDT(coa.entered_date_time)}</td>
                          <td className="px-4 py-4 text-sm font-mono">{coa.review_by_user_id || '-'}</td>
                          <td className="px-4 py-4 text-sm">{coa.review_date_time ? fmtDT(coa.review_date_time) : '-'}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[coa.status] || ''}`}>
                              {STATUS_LABEL[coa.status] || coa.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {coa.status === 'E' && (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => handleOpenApproval(coa)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs px-2 h-7 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleOpenPrint(coa)}
                                disabled={coa.status === 'X'}
                                className={`text-xs px-2 h-7 flex items-center gap-1 ${coa.status === 'X' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                              >
                                <Printer className="w-3.5 h-3.5" /> 
                              </Button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expanded detail row */}
                        <AnimatePresence>
                          {expandedRows.has(coa.coa_no) && (
                            <motion.tr
                              key={`${coa.coa_no}-detail`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <td colSpan={16} className="px-6 py-4 bg-muted/10 border-b border-border">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">COA Detail</p>
                                {detailCache[coa.coa_no] === undefined ? (
                                  <p className="text-xs text-muted-foreground">Loading details...</p>
                                ) : detailCache[coa.coa_no].length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No detail records found</p>
                                ) : (
                                  <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-border">
                                        <th className="px-3 py-2 text-left font-semibold">Sno</th>
                                        <th className="px-3 py-2 text-left font-semibold">Parameter</th>
                                        <th className="px-3 py-2 text-left font-semibold">Expected Result Type</th>
                                        <th className="px-3 py-2 text-left font-semibold">Expected Value 1</th>
                                        <th className="px-3 py-2 text-left font-semibold">Expected Value 2</th>
                                        <th className="px-3 py-2 text-left font-semibold">Expected Text</th>
                                        <th className="px-3 py-2 text-center font-semibold">Actual Value</th>
                                        <th className="px-3 py-2 text-left font-semibold">Actual Text</th>
                                        <th className="px-3 py-2 text-center font-semibold">Actual Result</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {detailCache[coa.coa_no].map((d: any) => (
                                        <tr key={d.checklist_sno} className="hover:bg-muted/20">
                                          <td className="px-3 py-1.5 font-mono">{d.checklist_sno}</td>
                                          <td className="px-3 py-1.5">{d.checklist_parameter || '-'}</td>
                                          <td className="px-3 py-1.5">{d.expected_result || '-'}</td>
                                          <td className="px-3 py-1.5 text-center font-mono">{d.expected_value_1 !== undefined ? d.expected_value_1 : '-'}</td>
                                          <td className="px-3 py-1.5 text-center font-mono">{d.expected_value_2 !== undefined ? d.expected_value_2 : '-'}</td>
                                          <td className="px-3 py-1.5">{d.expected_text || '-'}</td>
                                          <td className="px-3 py-1.5 text-center font-mono">{d.actual_value !== undefined ? d.actual_value : '-'}</td>
                                          <td className="px-3 py-1.5">{d.actual_text || '-'}</td>
                                          <td className="px-3 py-1.5 text-center">
                                            <span className={`px-1.5 py-0.5 rounded font-semibold ${RESULT_BADGE[d.actual_result] || ''}`}>
                                              {d.actual_result === 'P' ? 'Pass' : d.actual_result === 'F' ? 'Fail' : d.actual_result || '-'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                                {coa.status !== 'E' && coa.approval_remarks && (
                                  <div className="mt-3 p-3 bg-white rounded border border-border text-xs flex flex-wrap gap-4">
                                    <span><span className="font-semibold text-muted-foreground">Approval Remarks: </span>{coa.approval_remarks}</span>
                                    {coa.approved_by_user_id && <span><span className="font-semibold text-muted-foreground">Approved By: </span>{coa.approved_by_user_id}</span>}
                                    {coa.approved_date_time && <span className="text-muted-foreground">{fmtDT(coa.approved_date_time)}</span>}
                                    {coa.review_by_user_id && <span><span className="font-semibold text-muted-foreground">Reviewed By: </span>{coa.review_by_user_id}</span>}
                                    {coa.review_date_time && <span className="text-muted-foreground">Review: {fmtDT(coa.review_date_time)}</span>}
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold">ALL SYSTEMS OPERATIONAL</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Real-time Data Sync • ACUMED Manufacturing Cloud v4.2</p>
          </motion.div>
        </div>
      </main>

      {/* ── APPROVAL MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isApprovalModalOpen && selectedCOA && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsApprovalModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xl font-bold">COA Approval — {selectedCOA.coa_no}</h2>
                  <button onClick={() => setIsApprovalModalOpen(false)} className="text-white hover:bg-amber-700 rounded-lg p-2 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {/* Header display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 border-b pb-2">COA Header</h3>
                    </div>
                    {([
                      { label: 'COA No.',          value: selectedCOA.coa_no },
                      { label: 'COA Date',          value: fmt(selectedCOA.coa_date) },
                      { label: 'Batch No.',         value: selectedCOA.batch_no },
                      { label: 'Product ID',        value: selectedCOA.product_id },
                      { label: 'Checklist ID',      value: selectedCOA.coa_checklist_id },
                      { label: 'Overall Result',    value: selectedCOA.coa_overall_result === 'P' ? 'Pass (P)' : 'Fail (F)' },
                      { label: 'Entered By',        value: selectedCOA.entered_by_user_id },
                      { label: 'Entered Date/Time', value: fmtDT(selectedCOA.entered_date_time) },
                      { label: 'Remarks',           value: selectedCOA.remarks || '-', span: 2 },
                    ] as { label: string; value: string; span?: number }[]).map(f => (
                      <div key={f.label} className={f.span === 2 ? 'col-span-2' : ''}>
                        <label className="block text-xs font-semibold text-foreground mb-1">{f.label}</label>
                        <Input value={f.value} disabled className="bg-gray-50 text-sm" />
                      </div>
                    ))}
                  </div>

                  {/* Detail (read-only) */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider border-b pb-2 mb-3">COA Detail</h3>
                    {renderDetailTable(approvalDetails)}
                  </div>

                  {/* Approval entry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 border-b pb-2">Approval</h3>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Approval Remarks <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={approvalRemarks}
                        onChange={e => setApprovalRemarks(e.target.value)}
                        placeholder="Enter approval remarks"
                        maxLength={100}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Approved By</label>
                      <Input value={userId} disabled className="bg-gray-50 font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Approved Date/Time</label>
                      <Input value={fmtDT(new Date().toISOString())} disabled className="bg-gray-50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Review By User ID <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={reviewByUserId}
                        onChange={e => setReviewByUserId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        required
                      >
                        <option value="">Select User</option>
                        {usersList.map((u: any) => (
                          <option key={u.user_id} value={u.user_id}>{u.user_id}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Review Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={reviewDateTime}
                        onChange={e => setReviewDateTime(e.target.value)}
                        min={toDateTimeLocal(selectedCOA?.entered_date_time)}
                        max={toDateTimeLocal(new Date())}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">Must be between Entered Date/Time and now</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsApprovalModalOpen(false)}>Close</Button>
                    <Button type="button" onClick={() => handleApprovalSubmit('X')} className="bg-red-600 hover:bg-red-700 text-white px-5 flex items-center gap-2">
                      <X className="w-4 h-4" /> Cancel COA
                    </Button>
                    <Button type="button" onClick={() => handleApprovalSubmit('A')} className="bg-green-600 hover:bg-green-700 text-white px-5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Approve COA
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PRINT MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPrintModalOpen && printCOA && (
          <>
            <style>{`
              @page { margin: 0; size: A4; }
              @media print {
                body * { visibility: hidden !important; }
                #coa-print-content, #coa-print-content * { visibility: visible !important; }
                #coa-print-content {
                  position: absolute !important;
                  top: 0; left: 0;
                  width: 210mm;
                  min-height: 297mm;
                  padding: 12mm 14mm;
                  background: white;
                  font-family: Arial, sans-serif;
                  box-sizing: border-box;
                }
              }
            `}</style>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsPrintModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden">

                {/* Modal toolbar */}
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-xl">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Printer className="w-5 h-5" /> Print Preview — {printCOA.coa_no}
                  </h2>
                  <button onClick={() => setIsPrintModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-1.5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable preview area */}
                <div className="flex-1 overflow-y-auto bg-gray-200 p-6">
                  <div
                    id="coa-print-content"
                    className="bg-white mx-auto shadow-md"
                    style={{ width: '100%', maxWidth: '760px', padding: '32px 40px', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#000', lineHeight: '1.6' }}
                  >
                    {/* Company header */}
                    <div style={{ position: 'relative', textAlign: 'center', marginBottom: '14px', borderBottom: '2px solid #555', paddingBottom: '12px', minHeight: '54px' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0 }}>
                        {printCompany?.logo
                          ? <img src={printCompany.logo} style={{ height: '44px', maxWidth: '80px', objectFit: 'contain' }} alt="Logo" />
                          : <div style={{ width: '80px', height: '44px', border: '1px solid #aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#888', textAlign: 'center' }}>Company<br/>Logo</div>
                        }
                      </div>
                      <div style={{ display: 'inline-block', textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1a4fa8' }}>{printCompany?.company_name || '< COMPANY NAME >'}</div>
                        <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6', marginTop: '3px' }}>
                          {(printCompany?.address_1 || printCompany?.address_2) && (
                            <div>{[printCompany?.address_1, printCompany?.address_2].filter(Boolean).join(' ')}</div>
                          )}
                          {(printCompany?.city || printCompany?.pincode || printCompany?.state) && (
                            <div>{[printCompany?.city, printCompany?.pincode ? `- ${printCompany.pincode}` : '', printCompany?.state ? `, ${printCompany.state}` : ''].filter(Boolean).join(' ')}</div>
                          )}
                          {(printCompany?.website || printCompany?.email_id) && (
                            <div>
                              {printCompany?.website && <span>website : {printCompany.website}</span>}
                              {printCompany?.website && printCompany?.email_id && <span>&nbsp;&nbsp;&nbsp;</span>}
                              {printCompany?.email_id && <span>email id : {printCompany.email_id}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #555', borderBottom: '1px solid #555', padding: '10px 12px', marginBottom: '16px', letterSpacing: '3px', color: '#1a4fa8', background: '#dce6f7' }}>
                      CERTIFICATE OF ANALYSIS
                    </div>

                    {/* Header fields */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        {[
                          { l1: 'COA No.',       v1: printCOA.coa_no,                                                                                         l2: 'COA Date',          v2: fmt(printCOA.coa_date) },
                          { l1: 'Product',        v1: printProductName ? `${printProductName} (${printCOA.product_id})` : printCOA.product_id,                  l2: 'Batch No.',         v2: printCOA.batch_no },
                          { l1: 'Checklist',      v1: printCOA.coa_checklist_id,                                                                               l2: 'Manufactured Date', v2: fmt(printCOA.manufactured_date) },
                          { l1: 'Overall Result', v1: printCOA.coa_overall_result === 'P' ? 'Pass' : 'Fail', v1Bold: true, l2: 'Expiry Date',                  v2: fmt(printCOA.expiry_date) },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td style={{ width: '20%', padding: '7px 10px', fontWeight: 'bold', whiteSpace: 'nowrap', color: '#1a4fa8' }}>{row.l1}</td>
                            <td style={{ width: '30%', border: '1px solid #555', padding: '7px 10px', fontWeight: (row as any).v1Bold ? 'bold' : 'normal' }}>{row.v1}</td>
                            <td style={{ width: '20%', padding: '7px 10px', fontWeight: 'bold', whiteSpace: 'nowrap', color: '#1a4fa8' }}>{row.l2}</td>
                            <td style={{ width: '30%', border: '1px solid #555', padding: '7px 10px' }}>{row.v2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Detail table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <thead>
                        <tr style={{ background: '#dce6f7' }}>
                          <th style={{ border: '1px solid #555', padding: '8px 10px', textAlign: 'center', width: '8%', fontWeight: 'bold' }}>S.No</th>
                          <th style={{ border: '1px solid #555', padding: '8px 10px', textAlign: 'center', width: '32%', fontWeight: 'bold' }}>Test Parameter</th>
                          <th style={{ border: '1px solid #555', padding: '8px 10px', textAlign: 'center', width: '22%', fontWeight: 'bold' }}>Expected Result</th>
                          <th style={{ border: '1px solid #555', padding: '8px 10px', textAlign: 'center', width: '22%', fontWeight: 'bold' }}>Actual Result</th>
                          <th style={{ border: '1px solid #555', padding: '8px 10px', textAlign: 'center', width: '16%', fontWeight: 'bold' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printDetails.length === 0 ? (
                          <tr><td colSpan={5} style={{ border: '1px solid #555', padding: '14px', textAlign: 'center' }}>No detail records</td></tr>
                        ) : printDetails.map((d: any) => {
                          const meta = printMetaMap[d.checklist_sno] || {};
                          const er   = (meta.expected_result || '').toUpperCase();

                          let expectedDisplay = '';
                          if (er === 'P')      expectedDisplay = 'Pass / Fail';
                          else if (er === 'E') expectedDisplay = `${meta.expected_value_1 ?? ''}`;
                          else if (er === 'R') expectedDisplay = `${meta.expected_value_1 ?? ''} to ${meta.expected_value_2 ?? ''}`;
                          else if (er === 'T') expectedDisplay = meta.expected_text || '';
                          else                 expectedDisplay = meta.expected_result || '';

                          let actualDisplay = '';
                          if (er === 'E' || er === 'R') actualDisplay = d.actual_value !== undefined ? String(d.actual_value) : '-';
                          else if (er === 'T')          actualDisplay = d.actual_text || '-';
                          else                          actualDisplay = d.actual_result === 'P' ? 'Pass' : d.actual_result === 'F' ? 'Fail' : d.actual_result || '-';

                          return (
                            <tr key={d.checklist_sno}>
                              <td style={{ border: '1px solid #555', padding: '7px 10px', textAlign: 'center' }}>{d.checklist_sno}</td>
                              <td style={{ border: '1px solid #555', padding: '7px 10px' }}>{meta.checklist_parameter || '-'}</td>
                              <td style={{ border: '1px solid #555', padding: '7px 10px', textAlign: 'center' }}>{expectedDisplay}</td>
                              <td style={{ border: '1px solid #555', padding: '7px 10px', textAlign: 'center' }}>{actualDisplay}</td>
                              <td style={{ border: '1px solid #555', padding: '7px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                                {d.actual_result === 'P' ? 'Pass' : 'Fail'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Remarks */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '7px 10px', fontWeight: 'bold', width: '160px', whiteSpace: 'nowrap', color: '#1a4fa8' }}>Remarks :</td>
                          <td style={{ border: '1px solid #555', padding: '7px 10px', minHeight: '32px' }}>{printCOA.remarks || ' '}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Approval Remarks */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '7px 10px', fontWeight: 'bold', width: '160px', whiteSpace: 'nowrap', color: '#1a4fa8' }}>Approval Remarks :</td>
                          <td style={{ border: '1px solid #555', padding: '7px 10px', minHeight: '32px' }}>{printCOA.approval_remarks || ' '}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Signature section */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '10%', border: '1px solid #555', padding: '8px 12px', background: '#dce6f7' }}></td>
                          <td style={{ width: '30%', border: '1px solid #555', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#dce6f7', color: '#1a4fa8' }}>Executed By :</td>
                          <td style={{ width: '30%', border: '1px solid #555', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#dce6f7', color: '#1a4fa8' }}>Reviewed By :</td>
                          <td style={{ width: '30%', border: '1px solid #555', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', background: '#dce6f7', color: '#1a4fa8' }}>Approved By :</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #555', padding: '8px 12px', fontWeight: 'bold', color: '#1a4fa8', whiteSpace: 'nowrap' }}>Name :</td>
                          <td style={{ border: '1px solid #555', padding: '8px 12px' }}>{printCOA.entered_by_user_id ? (printUserNames[printCOA.entered_by_user_id] || printCOA.entered_by_user_id) : ' '}</td>
                          <td style={{ border: '1px solid #555', padding: '8px 12px' }}>{printCOA.review_by_user_id ? (printUserNames[printCOA.review_by_user_id] || printCOA.review_by_user_id) : ' '}</td>
                          <td style={{ border: '1px solid #555', padding: '8px 12px', fontStyle: printCOA.status !== 'A' ? 'italic' : 'normal', color: printCOA.status !== 'A' ? '#888' : 'inherit' }}>{printCOA.status === 'A' ? (printCOA.approved_by_user_id ? (printUserNames[printCOA.approved_by_user_id] || printCOA.approved_by_user_id) : ' ') : 'COA Not yet Approved'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #555', padding: '8px 12px', fontWeight: 'bold', color: '#1a4fa8', whiteSpace: 'nowrap' }}>Date :</td>
                          <td style={{ border: '1px solid #555', padding: '8px 12px' }}>{fmt(printCOA.entered_date_time)}</td>
                          <td style={{ border: '1px solid #555', padding: '8px 12px' }}>{printCOA.review_date_time ? fmt(printCOA.review_date_time) : ' '}</td>
                          <td style={{ border: '1px solid #555', padding: '8px 12px' }}>{printCOA.approved_date_time ? fmt(printCOA.approved_date_time) : ' '}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Footer */}
                    <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#555', marginTop: '10px', whiteSpace: 'nowrap' }}>* This is a system-generated COA and does not require a physical signature. For any queries, contact accumed.devices@gmail.com</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0 rounded-b-xl">
                  <Button variant="outline" onClick={() => setIsPrintModalOpen(false)} className="px-5">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center gap-2">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
