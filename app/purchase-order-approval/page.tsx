'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrderAPI, purchaseOrderDetailAPI, vendorAPI, materialAPI, companyAPI, employeeAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";

interface PurchaseOrder {
    _id?: string;
    po_no: string;
    po_date: string;
    po_time: string;
    vendor_id: string;
    vendor_ref_doc_no?: string;
    vendor_ref_doc_date?: string;
    delivery_text?: string;
    shipping_instruction?: string;
    terms_of_payment?: string;
    remarks?: string;
    entered_by_user_id: string;
    entered_date_time?: string;
    approval_remarks?: string;
    approved_by_user_id?: string;
    approved_date_time?: string;
    status: string;
}

interface PODetail {
    _id?: string;
    po_no: string;
    material_id: string;
    sno: number;
    po_qty: number;
    uom: string;
    material_spec?: string;
    remarks?: string;
    gr_qty: number;
    balance_qty: number;
    unit_price?: number;
    basic_amount?: number;
    gst_percentage?: number;
    gst_amount?: number;
    total_amount?: number;
    expected_delivery_date?: string;
}

interface Vendor {
    vendor_id: string;
    vendor_name: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    pincode?: number;
    gst_no?: string;
    contact_person?: string;
    contact_no?: number;
    contact_email_id?: string;
}

interface Material {
    material_id: string;
    material_name: string;
}

interface Company {
    website: string;
    comp_id: string;
    company_name: string;
    company_short_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    pincode?: number;
    gst_no?: string;
    contact_person?: string;
    contact_no?: number;
    email_id?: string;
    logo?: string;
    po_terms_and_conditions?: string;
    po_image?: string;
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function formatDateTime(dateStr?: string | Date): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr as string);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    E: { label: 'Entered',  color: 'bg-blue-50 text-blue-600' },
    A: { label: 'Approved', color: 'bg-green-50 text-green-600' },
};

export default function PurchaseOrderApprovalPage() {
    const { toast } = useToast();
    const currentUser = getSessionUser()?.user_id || 'ADMIN';

    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'E' | 'A' | 'all'>('E');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Expand rows
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandedDetails, setExpandedDetails] = useState<Record<string, PODetail[]>>({});
    const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

    // GR qty totals (needed to determine Cancel vs Close for status 'A')
    const [grQtyTotals, setGrQtyTotals] = useState<Record<string, number>>({});

    // Per-row editable approval_remarks
    const [approvalRemarks, setApprovalRemarks] = useState<Record<string, string>>({});

    // Rows being submitted
    const [submitting, setSubmitting] = useState<Set<string>>(new Set());

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const [allOrders, vendorData, materialData] = await Promise.all([
                purchaseOrderAPI.getAll(),
                vendorAPI.getAll(),
                materialAPI.getAll(),
            ]);

            const relevant: PurchaseOrder[] = allOrders.filter(
                (o: PurchaseOrder) => o.status === 'E' || o.status === 'A'
            );
            setOrders(relevant);
            setVendors(vendorData);
            setMaterials(materialData);

            // Pre-fill approval_remarks from existing data
            setApprovalRemarks(prev => {
                const next = { ...prev };
                relevant.forEach((o: PurchaseOrder) => {
                    if (!(o.po_no in next)) next[o.po_no] = o.approval_remarks || '';
                });
                return next;
            });

            // Eagerly load GR totals for all 'A' status POs (needed for button logic)
            const activePOs = relevant.filter((o: PurchaseOrder) => o.status === 'A');
            if (activePOs.length > 0) {
                const totals: Record<string, number> = {};
                const detailsCache: Record<string, PODetail[]> = {};
                await Promise.all(
                    activePOs.map(async (po: PurchaseOrder) => {
                        try {
                            const details: PODetail[] = await purchaseOrderDetailAPI.getByPoNo(po.po_no);
                            totals[po.po_no] = details.reduce((s, d) => s + (d.gr_qty || 0), 0);
                            detailsCache[po.po_no] = details;
                        } catch {
                            totals[po.po_no] = 0;
                            detailsCache[po.po_no] = [];
                        }
                    })
                );
                setGrQtyTotals(prev => ({ ...prev, ...totals }));
                setExpandedDetails(prev => ({ ...prev, ...detailsCache }));
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load purchase orders", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadOrders(); }, [loadOrders]);
    useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

    // Filter + search
    const filteredOrders = orders.filter(o => {
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;
        const matchSearch = !searchQuery ||
            o.po_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.vendor_id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Expand toggle
    const handleToggleExpand = async (poNo: string) => {
        const isExpanded = expandedRows.has(poNo);
        setExpandedRows(prev => {
            const next = new Set(prev);
            isExpanded ? next.delete(poNo) : next.add(poNo);
            return next;
        });
        if (!isExpanded && expandedDetails[poNo] === undefined) {
            setDetailsLoading(prev => new Set(prev).add(poNo));
            try {
                const data: PODetail[] = await purchaseOrderDetailAPI.getByPoNo(poNo);
                setExpandedDetails(prev => ({ ...prev, [poNo]: data }));
                const total = data.reduce((s, d) => s + (d.gr_qty || 0), 0);
                setGrQtyTotals(prev => ({ ...prev, [poNo]: total }));
            } catch {
                setExpandedDetails(prev => ({ ...prev, [poNo]: [] }));
            } finally {
                setDetailsLoading(prev => { const s = new Set(prev); s.delete(poNo); return s; });
            }
        }
    };

    // Action: Approve / Cancel / Close
    const handleAction = async (poNo: string, newStatus: 'A' | 'X' | 'C') => {
        if (submitting.has(poNo)) return;
        setSubmitting(prev => new Set(prev).add(poNo));
        try {
            await purchaseOrderAPI.update(poNo, {
                status: newStatus,
                approval_remarks: approvalRemarks[poNo] || undefined,
                approved_by_user_id: currentUser,
                approved_date_time: new Date(),
            });
            const label = newStatus === 'A' ? 'Approved' : newStatus === 'X' ? 'Cancelled' : 'Closed';
            toast({ title: "Success", description: `PO ${poNo} ${label} successfully` });
            // Reset remarks for this PO
            setApprovalRemarks(prev => { const n = { ...prev }; delete n[poNo]; return n; });
            loadOrders();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Action failed", variant: "destructive" });
        } finally {
            setSubmitting(prev => { const s = new Set(prev); s.delete(poNo); return s; });
        }
    };

    const handlePrint = async (order: PurchaseOrder) => {
        try {
            // Fetch PO details (use cache if available)
            let details: PODetail[] = expandedDetails[order.po_no];
            if (!details) {
                details = await purchaseOrderDetailAPI.getByPoNo(order.po_no);
            }

            // Fetch vendor, companies, employee in parallel
            const [vendor, allCompanies] = await Promise.all([
                vendorAPI.getById(order.vendor_id),
                companyAPI.getAll().catch(() => []),
            ]);

            const c1: Company | undefined = allCompanies.find((c: Company) => c.comp_id === 'CORP');
            const c2: Company | undefined = allCompanies.find((c: Company) => c.comp_id === 'FACT');

            // Fetch authorised name from EmployeeMaster
            let authorisedName = '';
            if (order.approved_by_user_id) {
                try {
                    const emp = await employeeAPI.getById(order.approved_by_user_id);
                    authorisedName = emp?.emp_name || order.approved_by_user_id;
                } catch {
                    authorisedName = order.approved_by_user_id;
                }
            }

            const fmt = (d?: string) => {
                if (!d) return '-';
                const dt = new Date(d);
                if (isNaN(dt.getTime())) return '-';
                return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`;
            };

            // Format number with commas + ₹ prefix (en-IN: 1,00,000)
            const inr = (n?: number) => {
                if (n == null) return '-';
                return '&#8377; ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            // Format number with commas only (no symbol)
            const fmtNum = (n?: number) => {
                if (n == null) return '-';
                return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            const getMaterialName = (id: string) => {
                const m = materials.find(m => m.material_id === id);
                return m?.material_name || '';
            };

            const totalBasic = details.reduce((s, d) => s + (d.basic_amount || 0), 0);
            const totalGst   = details.reduce((s, d) => s + (d.gst_amount || 0), 0);
            const totalAmt   = details.reduce((s, d) => s + (d.total_amount || 0), 0);

            // Small logo on left; company name fully centred across page
            const logoHtml = c1?.logo
                ? `<img src="${c1.logo}" style="height:44px;max-width:80px;object-fit:contain;" alt="Logo"/>`
                : `<div style="width:80px;height:44px;border:1px solid #aaa;display:flex;align-items:center;justify-content:center;font-size:9px;color:#888;">Company<br/>Logo</div>`;

            const signImgHtml = c1?.po_image
                ? `<img src="${c1.po_image}" style="height:56px;max-width:120px;object-fit:contain;display:block;margin:4px auto;" alt="Authorised Sign"/>`
                : '';

            // Material column: name only (no ID), spec, exp delivery date
            const detailRowsHtml = details.map(d => `
              <tr>
                <td style="text-align:center;">${d.sno}</td>
                <td>
                  ${getMaterialName(d.material_id)}<br/>
                  <span style="color:#444;">Spec : ${d.material_spec || '-'}</span><br/>
                  <span style="color:#444;">Exp. Delivery Date : ${fmt(d.expected_delivery_date)}</span>
                </td>
                <td style="text-align:center;">${d.po_qty != null ? Number(d.po_qty).toLocaleString('en-IN') : '-'}</td>
                <td style="text-align:center;">${d.uom}</td>
                <td style="text-align:center;">${(d.unit_price)}</td>
                <td style="text-align:center;">${(d.basic_amount)}</td>
                <td style="text-align:center;">${d.gst_percentage}</td>
                <td style="text-align:center;">${(d.total_amount)}</td>
              </tr>`).join('');

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Purchase Order - ${order.po_no}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff;
         padding: 12mm 10mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 100%; }

  /* Header: logo absolute-left so company name stays centred on full width */
  .hdr { position: relative; text-align: center; margin-bottom: 8px; min-height: 54px; }
  .hdr-logo { position: absolute; left: 0; top: 0; }
  .hdr-info { display: inline-block; text-align: center; }
  .co-name { font-size: 18px; font-weight: bold; color: #1a4fa8; }
  .co-addr { font-size: 11px; color: #333; line-height: 1.6; margin-top: 3px; }

  /* Main bordered table */
  .main-tbl { width: 100%; border-collapse: collapse; border: 1px solid #555; margin-bottom: 5px; table-layout: fixed; }
  .main-tbl td, .main-tbl th { border: 1px solid #555; padding: 6px 8px; vertical-align: top;
                                font-size: 12px; word-break: break-word; overflow-wrap: break-word; }

  /* "Purchase Order" heading row */
  .po-heading { background: #dce6f7; color: #1a4fa8; text-align: center; font-size: 14px;
                font-weight: bold; padding: 7px; border: 1px solid #555; }

  .lbl { font-weight: bold; }
  .lbl-blue { font-weight: bold; color: #1a4fa8; }

  /* Items table */
  .items-tbl { width: 100%; border-collapse: collapse; border: 1px solid #555; margin-bottom: 5px;
               table-layout: fixed; }
  .items-tbl th { background: #dce6f7; color: #000; text-align: center; font-weight: bold;
                  border: 1px solid #555; padding: 6px 4px; font-size: 12px; }
  .items-tbl td { border: 1px solid #555; padding: 5px 6px; vertical-align: top; font-size: 12px;
                  word-break: break-word; overflow-wrap: break-word; }

  /* Bottom section */
  .bottom-tbl { width: 100%; border-collapse: collapse; border: 1px solid #555; table-layout: fixed; margin-top: 5px; }
  .bottom-tbl td { border: 1px solid #555; padding: 20px 12px; vertical-align: top; font-size: 12px;
                   word-break: break-word; overflow-wrap: break-word; min-height: 120px; }

  /* System generated footer */
  .sys-footer { margin-top: 8px; font-size: 10px; color: #555; font-style: italic; }
</style>
</head>
<body>
<div class="page">

  <!-- ── TOP HEADER ── -->
  <div class="hdr">
    <div class="hdr-logo">${logoHtml}</div>
    <div class="hdr-info">
      <div class="co-name">${c1?.company_name || ''}</div>
      <div class="co-addr">
        ${[c1?.address_1, c1?.address_2].filter(Boolean).join(' ')}${(c1?.address_1 || c1?.address_2) ? '<br/>' : ''}
        ${[c1?.city, c1?.pincode ? `- ${c1.pincode}` : '', c1?.state ? `, ${c1.state}` : ''].filter(Boolean).join(' ')}
        ${(c1?.website || c1?.email_id) ? '<br/>' : ''}
        ${c1?.website ? `website : ${c1.website}` : ''}${c1?.website && c1?.email_id ? '&nbsp;&nbsp;&nbsp;' : ''}${c1?.email_id ? `email id : ${c1.email_id}` : ''}
      </div>
    </div>
  </div>

  <!-- ── MAIN TABLE ── -->
  <table class="main-tbl">

    <!-- Purchase Order heading -->
    <tr>
      <td colspan="2" class="po-heading">Purchase Order</td>
    </tr>

    <!-- Row 1: Supplier Address | PO Info -->
    <tr>
      <td style="width:50%;">
        <div class="lbl">Supplier Address :</div>
        <div style="margin-top:3px;line-height:1.7;">
          M/s. ${vendor?.vendor_name || ''}<br/>
          ${vendor?.address1 || ''}${vendor?.address1 ? '<br/>' : ''}
          ${vendor?.address2 ? vendor.address2 + '<br/>' : ''}
          ${vendor?.city || ''}${vendor?.pincode ? ` - ${vendor.pincode}` : ''}${(vendor?.city || vendor?.pincode) ? '<br/>' : ''}
          ${[vendor?.district, vendor?.state].filter(Boolean).join(', ')}
        </div>
      </td>
      <td style="width:50%;">
        <table style="width:100%;border:none;border-collapse:collapse;">
          <tr>
            <td style="border:none;padding:2px 4px;width:110px;">PO No.</td>
            <td style="border:none;padding:2px 4px;"> : <span class="lbl-blue"><strong>${order.po_no}</strong></span></td>
          </tr>
          <tr>
            <td style="border:none;padding:2px 4px;">PO Date</td>
            <td style="border:none;padding:2px 4px;"> : <span class="lbl-blue"><strong>${fmt(order.po_date)}</strong></span></td>
          </tr>
          <tr><td style="border:none;padding:4px;" colspan="2"></td></tr>
          <tr>
            <td style="border:none;padding:2px 4px;">Ref. Doc No.</td>
            <td style="border:none;padding:2px 4px;"> : ${order.vendor_ref_doc_no || '-'}</td>
          </tr>
          <tr>
            <td style="border:none;padding:2px 4px;">Ref. Doc Date</td>
            <td style="border:none;padding:2px 4px;"> : ${fmt(order.vendor_ref_doc_date)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Row 2: Delivery Address | Billing Address -->
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div class="lbl">Delivery Address :</div>
        <div style="margin-top:3px;line-height:1.7;">
          M/s. ${c1?.company_name || ''}<br/>
          ${c1?.address_1 || ''}${c1?.address_1 ? '<br/>' : ''}
          ${c1?.address_2 ? c1.address_2 + '<br/>' : ''}
          ${c1?.city || ''}${c1?.pincode ? ` - ${c1.pincode}` : ''}${(c1?.city || c1?.pincode) ? '<br/>' : ''}
          ${c1?.state || ''}
        </div>
      </td>
      <td style="width:50%;vertical-align:top;">
        <div class="lbl">Billing Address :</div>
        <div style="margin-top:3px;line-height:1.7;">
          M/s. ${c2?.company_name || ''}<br/>
          ${c2?.address_1 || ''}${c2?.address_1 ? '<br/>' : ''}
          ${c2?.address_2 ? c2.address_2 + '<br/>' : ''}
          ${c2?.city || ''}${c2?.pincode ? ` - ${c2.pincode}` : ''}${(c2?.city || c2?.pincode) ? '<br/>' : ''}
          ${c2?.state || ''}
        </div>
      </td>
    </tr>

    <!-- Row 3: Shipping Instruction + Payment Terms | GST + Contact -->
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div class="lbl">Shipping Instruction :</div>
        <div style="margin-top:2px;margin-bottom:8px;">${order.shipping_instruction || '-'}</div>
        <div class="lbl">Payment Terms :</div>
        <div style="margin-top:2px;">${order.terms_of_payment || '-'}</div>
      </td>
      <td style="width:50%;vertical-align:top;">
        <div><span class="lbl">GST No.</span> ${c1?.gst_no || '-'}</div>
        <div style="margin-top:10px;">Contact Person &nbsp;: ${c1?.contact_person || '-'}</div>
        <div style="margin-top:2px;">Contact No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${c1?.contact_no || '-'}</div>
      </td>
    </tr>

  </table>

  <!-- ── ITEMS TABLE ── -->
  <table class="items-tbl">
    <thead>
      <tr>
        <th style="width:4%;">S.No</th>
        <th style="width:27%;">Material</th>
        <th style="width:10%;">PO Qty</th>
        <th style="width:7%;">UoM</th>
        <th style="width:11%;">unit Rate &#8377;</th>
        <th style="width:13%;">Amount &#8377;</th>
        <th style="width:8%;">GST</th>
        <th style="width:13%;">Total &#8377;</th>
      </tr>
    </thead>
    <tbody>
      ${detailRowsHtml}
      <tr style="background:#f0f0f0;">
        <td colspan="5" style="text-align:right;font-weight:bold;border:1px solid #555;">TOTAL</td>
        <td style="text-align:center;font-weight:bold;"> ${fmtNum(totalBasic)}</td>
        <td style="text-align:center;font-weight:bold;"> ${fmtNum(totalGst)}</td>
        <td style="text-align:center;font-weight:bold;"> ${fmtNum(totalAmt)}</td>
      </tr>
    </tbody>
  </table>

  <!-- ── BOTTOM: Terms & Conditions + Signature ── -->
  <table class="bottom-tbl">
    <tr>
      <td style="width:55%;">
        <div class="lbl">Terms and Conditions :</div>
        <div style="margin-top:8px;line-height:1.8;white-space:pre-wrap;">${c1?.po_terms_and_conditions || ''}</div>
      </td>
      <td style="width:45%;text-align:center;">
        <div style="margin-bottom:16px;">for ${c1?.company_short_name || c1?.company_name || ''}</div>
        ${signImgHtml}
        <div style="margin-top:16px;">${authorisedName}</div>
        <div style="margin-top:4px;">( Authorised Signatory )</div>
      </td>
    </tr>
  </table>

  <!-- ── SYSTEM GENERATED FOOTER ── -->
  <div class="sys-footer">
    * This is a system-generated Purchase Order and does not require a physical signature.
    ${c1?.email_id ? `For any queries, contact ${c1.email_id}` : ''}
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

            const printWindow = window.open('', '_blank', 'width=900,height=750');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } catch (err: any) {
            toast({ title: "Print Error", description: err.message || "Failed to generate PDF", variant: "destructive" });
        }
    };

    const getVendorDisplay = (id: string) => {
        const v = vendors.find(v => v.vendor_id === id);
        return v ? `${id} - ${v.vendor_name}` : id;
    };

    // Action buttons per row
    const renderActions = (order: PurchaseOrder) => {
        const busy = submitting.has(order.po_no);
        if (order.status === 'E') {
            return (
                <div className="flex flex-col gap-1 min-w-[80px]">
                    <Button size="sm" disabled={busy}
                        onClick={() => handleAction(order.po_no, 'A')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3 w-full">
                        Approve
                    </Button>
                    <Button size="sm" disabled={busy}
                        onClick={() => handleAction(order.po_no, 'X')}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3 w-full">
                        Cancel
                    </Button>
                </div>
            );
        }
        if (order.status === 'A') {
            const grTotal = grQtyTotals[order.po_no];
            const printBtn = (
                <Button size="sm" variant="outline"
                    onClick={() => handlePrint(order)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs h-7 px-2"
                    title="Print PO">
                    <Printer className="w-3.5 h-3.5" />
                </Button>
            );
            if (grTotal === undefined) {
                return (
                    <div className="flex flex-col gap-1 min-w-[80px]">
                        {printBtn}
                        <span className="text-xs text-gray-400 whitespace-nowrap">Loading...</span>
                    </div>
                );
            }
            if (grTotal === 0) {
                return (
                    <div className="flex flex-col gap-1 min-w-[80px]">
                        {printBtn}
                        <Button size="sm" disabled={busy}
                            onClick={() => handleAction(order.po_no, 'X')}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3 w-full">
                            Cancel
                        </Button>
                    </div>
                );
            }
            return (
                <div className="flex flex-col gap-1 min-w-[80px]">
                    {printBtn}
                    <Button size="sm" disabled={busy}
                        onClick={() => handleAction(order.po_no, 'C')}
                        className="bg-gray-700 hover:bg-gray-800 text-white text-xs h-7 px-3 w-full">
                        Close
                    </Button>
                </div>
            );
        }
        return null;
    };

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
                        transition={{ duration: 0.5 }} className="mb-6 md:mb-8"
                    >
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                            Purchase Order Approval
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Approve, cancel, or close purchase orders
                        </p>
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
                                        { value: 'E',   label: 'Entered (E)' },
                                        { value: 'A',   label: 'Approved (A)' },
                                        { value: 'all', label: 'All' },
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
                                        placeholder="Search by PO No or Vendor ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>

                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {filteredOrders.length} record{filteredOrders.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="overflow-auto max-h-[500px]">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-2 py-3 w-8"></th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">PO No.</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">PO Date</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Vendor</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Vendor Ref. Doc. No.</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Vendor Ref. Doc. Date</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Delivery Text</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Shipping Instr.</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Terms of Payment</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Remarks</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Entered By</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Entered Date & Time</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Approval Remarks</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Approved By</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Approved Date & Time</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-left whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-center whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paginatedOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={17} className="px-4 py-8 text-center text-muted-foreground">
                                                    No purchase orders found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedOrders.map((order, index) => (
                                                <React.Fragment key={order._id || order.po_no}>
                                                    <motion.tr
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.04 }}
                                                        className="hover:bg-muted/30 transition-colors"
                                                    >
                                                        {/* Expand */}
                                                        <td className="px-2 py-3 text-center">
                                                            <button
                                                                onClick={() => handleToggleExpand(order.po_no)}
                                                                className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                                title="Show PO detail items"
                                                            >
                                                                <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${expandedRows.has(order.po_no) ? 'rotate-0' : '-rotate-90'}`} />
                                                            </button>
                                                        </td>

                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-semibold">
                                                                {order.po_no}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(order.po_date)}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs whitespace-nowrap">
                                                                {getVendorDisplay(order.vendor_id)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{order.vendor_ref_doc_no || '-'}</td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(order.vendor_ref_doc_date)}</td>
                                                        <td className="px-4 py-3 text-sm">{order.delivery_text || '-'}</td>
                                                        <td className="px-4 py-3 text-sm">{order.shipping_instruction || '-'}</td>
                                                        <td className="px-4 py-3 text-sm">{order.terms_of_payment || '-'}</td>
                                                        <td className="px-4 py-3 text-sm">{order.remarks || '-'}</td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                {order.entered_by_user_id}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDateTime(order.entered_date_time)}</td>

                                                        {/* Approval Remarks — editable */}
                                                        <td className="px-4 py-3">
                                                            <Input
                                                                type="text"
                                                                value={approvalRemarks[order.po_no] ?? ''}
                                                                onChange={e => setApprovalRemarks(prev => ({ ...prev, [order.po_no]: e.target.value }))}
                                                                maxLength={100}
                                                                placeholder="Enter remarks..."
                                                                className="w-36 text-xs h-7 px-2"
                                                            />
                                                        </td>

                                                        {/* Approved By — display only, default current user */}
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs whitespace-nowrap">
                                                                {order.approved_by_user_id || currentUser}
                                                            </span>
                                                        </td>

                                                        {/* Approved Date & Time — display only, current time */}
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                                                            {order.approved_date_time
                                                                ? formatDateTime(order.approved_date_time)
                                                                : formatDateTime(new Date().toISOString())}
                                                        </td>

                                                        {/* Status badge */}
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                                {STATUS_LABELS[order.status]?.label || order.status}
                                                            </span>
                                                        </td>

                                                        {/* Action buttons */}
                                                        <td className="px-4 py-3">
                                                            {renderActions(order)}
                                                        </td>
                                                    </motion.tr>

                                                    {/* Expanded PO Detail sub-row */}
                                                    {expandedRows.has(order.po_no) && (
                                                        <tr>
                                                            <td colSpan={17} className="p-0 bg-blue-50/40 border-b border-blue-100">
                                                                <div className="px-8 py-4">
                                                                    {detailsLoading.has(order.po_no) ? (
                                                                        <p className="text-sm text-muted-foreground py-2">Loading details...</p>
                                                                    ) : (expandedDetails[order.po_no] || []).length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground py-2">No detail items for this PO.</p>
                                                                    ) : (
                                                                        <table className="w-full text-xs border rounded-lg overflow-hidden">
                                                                            <thead>
                                                                                <tr className="bg-blue-100">
                                                                                    <th className="px-3 py-2 text-left font-semibold">SNO</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Material ID</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">PO Qty</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">UOM</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Material Spec</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">GR Qty</th>
                                                                                    <th className="px-3 py-2 text-left font-semibold">Balance Qty</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-blue-100">
                                                                                {(expandedDetails[order.po_no] || []).map(detail => (
                                                                                    <tr key={detail._id} className="bg-white hover:bg-blue-50/50">
                                                                                        <td className="px-3 py-2">{detail.sno}</td>
                                                                                        <td className="px-3 py-2 font-mono font-semibold text-blue-700">{detail.material_id}</td>
                                                                                        <td className="px-3 py-2">{detail.po_qty}</td>
                                                                                        <td className="px-3 py-2">{detail.uom}</td>
                                                                                        <td className="px-3 py-2 max-w-[200px] truncate text-gray-500" title={detail.material_spec}>{detail.material_spec || '-'}</td>
                                                                                        <td className="px-3 py-2">{detail.remarks || '-'}</td>
                                                                                        <td className="px-3 py-2">{detail.gr_qty}</td>
                                                                                        <td className="px-3 py-2">{detail.balance_qty}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
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
                                        <ChevronLeft className="w-4 h-4 mr-1" />Previous
                                    </Button>
                                    <Button variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}>
                                        Next<ChevronRight className="w-4 h-4 ml-1" />
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
