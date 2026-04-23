'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronDown, ChevronUp, X, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { coaGenerationAPI } from "@/services/api";
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

interface CompletedBatch {
  batch_no: string;
  product_id: string;
  actual_start_date?: string;
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
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
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

function computeActualResult(row: DetailRow): string {
  const er = (row.expected_result || '').toUpperCase();
  if (er === 'E') {
    if (row.actual_value === '' || row.expected_value_1 === undefined) return 'F';
    return Number(row.actual_value) === row.expected_value_1 ? 'P' : 'F';
  }
  if (er === 'R') {
    if (row.actual_value === '' || row.expected_value_1 === undefined || row.expected_value_2 === undefined) return 'F';
    const v = Number(row.actual_value);
    return v >= row.expected_value_1 && v <= row.expected_value_2 ? 'P' : 'F';
  }
  if (er === 'T') {
    if (!row.actual_text || !row.expected_text) return 'F';
    return row.actual_text.trim() === row.expected_text.trim() ? 'P' : 'F';
  }
  return row.actual_result || 'F';
}

function computeOverallResult(rows: DetailRow[]): string {
  if (rows.length === 0) return 'F';
  return rows.every(r => r.actual_result === 'P') ? 'P' : 'F';
}

function emptyDetailRow(item: any): DetailRow {
  return {
    checklist_sno:       item.checklist_sno,
    checklist_parameter: item.checklist_parameter,
    expected_result:     item.expected_result,
    expected_value_1:    item.expected_value_1,
    expected_value_2:    item.expected_value_2,
    expected_text:       item.expected_text,
    actual_value:        '',
    actual_text:         '',
    actual_result:       'F',
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function COAGenerationPage() {
  const { toast } = useToast();
  const isSubmittingRef = useRef(false);
  const userId = getSessionUser()?.user_id || 'ADMIN';
  const isSuperAdmin = getSessionUser()?.super_admin === true;

  // List state
  const [coaList, setCoaList]           = useState<COAHeader[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage]   = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailCache, setDetailCache]   = useState<Record<string, any[]>>({});

  // Modals
  const [isAddModalOpen,  setIsAddModalOpen]  = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCOA,     setSelectedCOA]     = useState<COAHeader | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete,       setItemToDelete]       = useState<COAHeader | null>(null);

  // Add / edit form state
  const [completedBatches, setCompletedBatches] = useState<CompletedBatch[]>([]);
  const [batchInfoLoading, setBatchInfoLoading] = useState(false);
  const [formHeader, setFormHeader] = useState({
    batch_no:            '',
    product_id:          '',
    manufactured_date:   '',
    expiry_date:         '',
    coa_checklist_id:    '',
    coa_overall_result:  'F',
    remarks:             '',
    entered_by_user_id:  userId,
  });
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);

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

  // ── Load completed batches when Add opens ───────────────────────────────────

  useEffect(() => {
    if (isAddModalOpen) {
      coaGenerationAPI.getCompletedBatches()
        .then(data => setCompletedBatches(Array.isArray(data) ? data : []))
        .catch(() => setCompletedBatches([]));
    }
  }, [isAddModalOpen]);

  // ── Reset add form ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isAddModalOpen) {
      setFormHeader({ batch_no: '', product_id: '', manufactured_date: '', expiry_date: '', coa_checklist_id: '', coa_overall_result: 'F', remarks: '', entered_by_user_id: userId });
      setDetailRows([]);
    }
  }, [isAddModalOpen, userId]);

  // ── Batch select → fetch info ───────────────────────────────────────────────

  const handleBatchSelect = async (batchNo: string) => {
    setFormHeader(prev => ({ ...prev, batch_no: batchNo, product_id: '', manufactured_date: '', expiry_date: '', coa_checklist_id: '', coa_overall_result: 'F' }));
    setDetailRows([]);
    if (!batchNo) return;
    try {
      setBatchInfoLoading(true);
      const info = await coaGenerationAPI.getBatchInfo(batchNo);
      setFormHeader(prev => ({
        ...prev,
        batch_no:           batchNo,
        product_id:         info.product_id          || '',
        manufactured_date:  info.manufactured_date   || '',
        expiry_date:        info.expiry_date          || '',
        coa_checklist_id:   info.coa_checklist_id    || '',
        coa_overall_result: 'F',
      }));
      setDetailRows((info.checklist_items || []).map(emptyDetailRow));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch batch info', variant: 'destructive' });
      setFormHeader(prev => ({ ...prev, batch_no: '' }));
    } finally {
      setBatchInfoLoading(false);
    }
  };

  // ── Detail row change ───────────────────────────────────────────────────────

  const handleDetailChange = (idx: number, field: 'actual_value' | 'actual_text' | 'actual_result', value: string) => {
    setDetailRows(prev => {
      const next = prev.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, [field]: value };
        if ((updated.expected_result || '').toUpperCase() !== 'P') {
          updated.actual_result = computeActualResult(updated);
        }
        return updated;
      });
      setFormHeader(h => ({ ...h, coa_overall_result: computeOverallResult(next) }));
      return next;
    });
  };

  // ── Submit Add ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!formHeader.batch_no) {
      toast({ title: 'Required', description: 'Please select a batch', variant: 'destructive' });
      return;
    }
    if (detailRows.length === 0) {
      toast({ title: 'Required', description: 'No checklist items loaded for this batch', variant: 'destructive' });
      return;
    }
    isSubmittingRef.current = true;
    try {
      await coaGenerationAPI.create({
        batch_no:           formHeader.batch_no,
        product_id:         formHeader.product_id,
        manufactured_date:  formHeader.manufactured_date,
        expiry_date:        formHeader.expiry_date,
        coa_checklist_id:   formHeader.coa_checklist_id,
        coa_overall_result: computeOverallResult(detailRows),
        remarks:            formHeader.remarks,
        entered_by_user_id: userId,
        details: detailRows.map(r => ({
          checklist_sno: r.checklist_sno,
          actual_value:  r.actual_value !== '' ? Number(r.actual_value) : undefined,
          actual_text:   r.actual_text || undefined,
          actual_result: r.actual_result,
        })),
      });
      toast({ title: 'Success', description: 'COA created successfully' });
      setIsAddModalOpen(false);
      loadList();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create COA', variant: 'destructive' });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // ── Open Edit ───────────────────────────────────────────────────────────────

  const handleOpenEdit = async (coa: COAHeader) => {
    setSelectedCOA(coa);
    setFormHeader({
      batch_no:           coa.batch_no,
      product_id:         coa.product_id,
      manufactured_date:  coa.manufactured_date,
      expiry_date:        coa.expiry_date,
      coa_checklist_id:   coa.coa_checklist_id,
      coa_overall_result: coa.coa_overall_result,
      remarks:            coa.remarks || '',
      entered_by_user_id: coa.entered_by_user_id,
    });
    try {
      const [res, items] = await Promise.all([
        coaGenerationAPI.getById(coa.coa_no),
        coaGenerationAPI.getChecklistItems(coa.coa_checklist_id).catch(() => []),
      ]);
      const metaMap: Record<number, any> = {};
      (Array.isArray(items) ? items : []).forEach((item: any) => { metaMap[item.checklist_sno] = item; });
      setDetailRows((res.details || []).map((d: any) => {
        const m = metaMap[d.checklist_sno] || {};
        return {
          checklist_sno:       d.checklist_sno,
          checklist_parameter: m.checklist_parameter || '',
          expected_result:     m.expected_result     || '',
          expected_value_1:    m.expected_value_1,
          expected_value_2:    m.expected_value_2,
          expected_text:       m.expected_text,
          actual_value:        d.actual_value !== undefined ? String(d.actual_value) : '',
          actual_text:         d.actual_text  || '',
          actual_result:       d.actual_result || 'F',
        };
      }));
    } catch {
      setDetailRows([]);
    }
    setIsEditModalOpen(true);
  };

  // ── Submit Edit ─────────────────────────────────────────────────────────────

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || !selectedCOA) return;
    isSubmittingRef.current = true;
    try {
      await coaGenerationAPI.update(selectedCOA.coa_no, {
        mode:               'edit',
        remarks:            formHeader.remarks,
        coa_overall_result: computeOverallResult(detailRows),
        details: detailRows.map(r => ({
          checklist_sno: r.checklist_sno,
          actual_value:  r.actual_value !== '' ? Number(r.actual_value) : undefined,
          actual_text:   r.actual_text || undefined,
          actual_result: r.actual_result,
        })),
      });
      toast({ title: 'Success', description: 'COA updated successfully' });
      setIsEditModalOpen(false);
      setDetailCache(prev => { const n = { ...prev }; delete n[selectedCOA.coa_no]; return n; });
      setSelectedCOA(null);
      loadList();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update COA', variant: 'destructive' });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await coaGenerationAPI.delete(itemToDelete.coa_no);
      toast({ title: 'Deleted', description: `COA ${itemToDelete.coa_no} deleted successfully` });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      loadList();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete COA', variant: 'destructive' });
    }
  };

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

  // ─── Detail rows table ───────────────────────────────────────────────────────

  const renderDetailTable = (rows: DetailRow[], readOnly = false) => (
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
              <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground text-xs">
                {readOnly ? 'No detail records' : 'Select a batch to load checklist items'}
              </td>
            </tr>
          ) : rows.map((row, idx) => {
            const er = (row.expected_result || '').toUpperCase();
            const isValueEntry  = !readOnly && (er === 'R' || er === 'E');
            const isTextEntry   = !readOnly && er === 'T';
            const isResultEntry = !readOnly && er === 'P';
            return (
              <tr key={row.checklist_sno} className="hover:bg-muted/20">
                <td className="px-3 py-2 text-center text-xs font-mono">{row.checklist_sno}</td>
                <td className="px-3 py-2 text-xs">{row.checklist_parameter}</td>
                <td className="px-3 py-2 text-center">
                  <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">{row.expected_result}</span>
                </td>
                <td className="px-3 py-2 text-center text-xs font-mono">{row.expected_value_1 !== undefined ? row.expected_value_1 : '-'}</td>
                <td className="px-3 py-2 text-center text-xs font-mono">{row.expected_value_2 !== undefined ? row.expected_value_2 : '-'}</td>
                <td className="px-3 py-2 text-xs">{row.expected_text || '-'}</td>
                <td className="px-3 py-2 text-center">
                  {isValueEntry ? (
                    <Input type="number" step="0.001" value={row.actual_value} onChange={e => handleDetailChange(idx, 'actual_value', e.target.value)} className="w-24 h-7 text-xs text-center px-1" />
                  ) : (
                    <span className="text-xs font-mono">{row.actual_value !== '' ? row.actual_value : '-'}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {isTextEntry ? (
                    <Input value={row.actual_text} onChange={e => handleDetailChange(idx, 'actual_text', e.target.value)} maxLength={25} className="w-28 h-7 text-xs px-1" />
                  ) : (
                    <span className="text-xs">{row.actual_text || '-'}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {isResultEntry ? (
                    <select value={row.actual_result} onChange={e => handleDetailChange(idx, 'actual_result', e.target.value)} className="h-7 px-1 rounded border border-border bg-background text-xs">
                      <option value="P">Pass</option>
                      <option value="F">Fail</option>
                    </select>
                  ) : (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${RESULT_BADGE[row.actual_result] || ''}`}>
                      {row.actual_result === 'P' ? 'Pass' : row.actual_result === 'F' ? 'Fail' : row.actual_result || '-'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ─── Header form section ─────────────────────────────────────────────────────

  const renderHeaderFields = (isEdit = false) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 border-b pb-2">COA Header</h3>
      </div>

      {isEdit && (
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">COA No.</label>
          <Input value={selectedCOA?.coa_no || ''} disabled className="bg-gray-50 font-mono text-sm" />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">COA Date</label>
        <Input value={fmt(isEdit ? selectedCOA?.coa_date : new Date().toISOString())} disabled className="bg-gray-50 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">
          Batch No.{!isEdit && <span className="text-red-500 ml-1">*</span>}
        </label>
        {isEdit ? (
          <Input value={formHeader.batch_no} disabled className="bg-gray-50 font-mono text-sm" />
        ) : (
          <select
            value={formHeader.batch_no}
            onChange={e => handleBatchSelect(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            required
          >
            <option value="">Select Completed Batch</option>
            {completedBatches.map(b => (
              <option key={b.batch_no} value={b.batch_no}>{b.batch_no}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Product ID</label>
        <Input value={formHeader.product_id || (batchInfoLoading ? 'Loading...' : '-')} disabled className="bg-gray-50 font-mono text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Manufactured Date</label>
        <Input value={fmt(formHeader.manufactured_date) !== '-' ? fmt(formHeader.manufactured_date) : (batchInfoLoading ? 'Loading...' : '-')} disabled className="bg-gray-50 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Expiry Date</label>
        <Input value={fmt(formHeader.expiry_date) !== '-' ? fmt(formHeader.expiry_date) : (batchInfoLoading ? 'Loading...' : '-')} disabled className="bg-gray-50 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">COA Checklist ID</label>
        <Input value={formHeader.coa_checklist_id || (batchInfoLoading ? 'Loading...' : '-')} disabled className="bg-gray-50 font-mono text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Overall Result</label>
        <div className={`h-10 px-3 flex items-center rounded-lg border text-sm font-semibold ${
          detailRows.length === 0 ? 'bg-gray-50 text-muted-foreground border-border' :
          computeOverallResult(detailRows) === 'P' ? 'bg-green-50 text-green-700 border-green-200' :
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          {detailRows.length === 0 ? '-' : computeOverallResult(detailRows) === 'P' ? 'Pass (P)' : 'Fail (F)'}
        </div>
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-semibold text-foreground mb-1">Remarks</label>
        <Input
          value={formHeader.remarks}
          onChange={e => setFormHeader(prev => ({ ...prev, remarks: e.target.value }))}
          placeholder="Enter remarks (optional)"
          maxLength={100}
          className="text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Entered By</label>
        <Input value={formHeader.entered_by_user_id} disabled className="bg-gray-50 font-mono text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Entered Date/Time</label>
        <Input value={fmtDT(isEdit ? selectedCOA?.entered_date_time : new Date().toISOString())} disabled className="bg-gray-50 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
        <div className="h-10 px-3 flex items-center rounded-lg border bg-blue-50 text-blue-700 border-blue-200 text-sm font-semibold">
          Entered (E)
        </div>
      </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">COA Generation</h1>
                <p className="text-muted-foreground">Generate and manage Certificate of Analysis for completed batches</p>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" /> Generate COA
              </Button>
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
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => coa.status === 'E' && handleOpenEdit(coa)}
                                disabled={coa.status !== 'E'}
                                className={`text-xs px-2 h-7 flex items-center gap-1 ${coa.status === 'E' ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {isSuperAdmin && (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => { setItemToDelete(coa); setIsDeleteDialogOpen(true); }}
                                  className="text-xs px-2 h-7 flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
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

      {/* ── ADD MODAL ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xl font-bold">Generate COA</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {renderHeaderFields(false)}
                  <div>
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-2 mb-3">
                      COA Detail — Checklist Items
                      {batchInfoLoading && <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">Loading...</span>}
                    </h3>
                    {renderDetailTable(detailRows, false)}
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save COA</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && selectedCOA && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xl font-bold">Edit COA — {selectedCOA.coa_no}</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {renderHeaderFields(true)}
                  <div>
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b pb-2 mb-3">COA Detail — Checklist Items</h3>
                    {renderDetailTable(detailRows, false)}
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Update COA</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete COA</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-mono font-semibold">{itemToDelete?.coa_no}</span>? This will also delete all its checklist detail records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
