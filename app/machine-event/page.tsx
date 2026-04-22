'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, X, Pencil, Info, Layers, CheckCircle2, Clock, User, FileText, Save, History, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { machineEventAPI, machineEventTypeAPI, machineStopReasonAPI, employeeAPI, materialStockAPI, productBomAPI, availableRollsAPI, machineEventMaterialAPI, batchMaterialSummaryAPI, materialAPI, transactionAPI } from "@/services/api";
import { getSessionUser } from "@/lib/auth";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface MachineEvent {
    machine_event_id: number;
    machine_id: string;
    batch_no: string;
    product_id: string;
    machine_event_type_id: string;
    event_date: string;
    event_time: string;
    batch_status_id?: string;
    machine_stop_reason_id?: string;
    remarks?: string;
    done_by_emp_id?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: string;
}

interface MachineEventType {
    machine_event_type_id: string;
    machine_event_type_name: string;
    seq_no: number;
    batch_status_id?: string;
    prerequisite_machine_event_type_id?: string;
    accept_material?: string;
    accept_open_qty?: string;
    accept_close_qty?: string;
    accept_reason?: string;
    active: boolean;
}

interface StopReason { reason_id: string; reason_name: string; active: boolean; }
interface Employee {
    emp_id: string ;
    emp_name: string;  active: boolean; 
}
interface Machine { machine_id: string; machine_name: string; active: boolean; }
interface MaterialStock { material_id: string; total_available_qty?: number; total_rolls?: number; }
interface EventMaterial { machine_event_id: number; machine_id: string; material_id: string; roll_no: string; actual_open_qty?: number; actual_close_qty?: number; actual_consumed_qty?: number; uom?: string; }
interface BatchSummaryRow { batch_no: string; product_id: string; material_id: string; total_consumed_qty: number; uom: string; total_no_of_rolls: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(date: string | Date | undefined): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function getCurrentTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getCurrentDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const emptyAddForm = {
    machine_id: "", machine_event_type_id: "", batch_no: "", product_id: "",
    batch_status_id: "", event_time: "", stop_reason_id: "", done_by_emp_id: "", remarks: "",
    material_search: "", selected_material_id: "", mat_uom: "", actual_open_qty: "", actual_gross_qty: "", qty_open: "", qty_close: "", roll_number: "",
};

const emptyEditForm = {
    machine_stop_reason_id: "", remarks: "", done_by_emp_id: "", event_time: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MachineEventPage() {
    const { toast } = useToast();

    // List state
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMachine, setFilterMachine] = useState<string>("all");
    const [events, setEvents] = useState<MachineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [lastAction, setLastAction] = useState<{ type: "edit"; data: MachineEvent } | null>(null);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelModalType, setCancelModalType] = useState<"add" | "edit" | null>(null);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [eventToCancel, setEventToCancel] = useState<MachineEvent | null>(null);
    const isSuperAdmin = getSessionUser()?.super_admin === true;
    const [selectedEvent, setSelectedEvent] = useState<MachineEvent | null>(null);
    const isSubmittingRef = useRef(false);

    // Reference data
    const [eventTypes, setEventTypes] = useState<MachineEventType[]>([]);
    const [stopReasons, setStopReasons] = useState<StopReason[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);

    // Add form state
    const [addForm, setAddForm] = useState({ ...emptyAddForm, event_time: getCurrentTime() });
    const [prevEventTypeId, setPrevEventTypeId] = useState("");
    const [prevEventInfo, setPrevEventInfo] = useState<{ type_id: string; date: string; time: string } | null>(null);
    const [stockData, setStockData] = useState<MaterialStock | null>(null);
    const [bomMaterials, setBomMaterials] = useState<{ material_id: string; input_uom: string }[]>([]);
    const [availableRolls, setAvailableRolls] = useState<{ roll_no: string; balance_qty: number; uom: string; status: string }[]>([]);
    const [actualTareQty, setActualTareQty] = useState<number>(0);
    // Close-qty mode: pre-loaded open record from MachineEventMaterial (T303 check)
    const [closeQtyRecord, setCloseQtyRecord] = useState<{
        material_id: string; roll_no: string; actual_open_qty: number; uom?: string;
        actual_gross_qty?: number; actual_tare_qty?: number;
    } | null>(null);
    const [closeQtyError, setCloseQtyError] = useState<string>("");

    // Edit form state
    const [editForm, setEditForm] = useState({ ...emptyEditForm });

    // Expand state
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [expandedData, setExpandedData] = useState<Map<number, { materials: EventMaterial[]; summary: BatchSummaryRow[] }>>(new Map());
    const [loadingExpanded, setLoadingExpanded] = useState<Set<number>>(new Set());

    // ── Expand row ───────────────────────────────────────────────────────────

    const toggleRowExpansion = useCallback(async (ev: MachineEvent) => {
        const id = ev.machine_event_id;
        const newExpanded = new Set(expandedRows);
        if (expandedRows.has(id)) {
            newExpanded.delete(id);
            setExpandedRows(newExpanded);
            return;
        }
        newExpanded.add(id);
        setExpandedRows(newExpanded);
        if (expandedData.has(id)) return;
        setLoadingExpanded(prev => new Set(prev).add(id));
        try {
            const materials: EventMaterial[] = await machineEventMaterialAPI.getByEventId(id);
            let summary: BatchSummaryRow[] = [];
            if (materials.length > 0) {
                const materialIds = [...new Set(materials.map(m => m.material_id))];
                const results = await Promise.all(
                    materialIds.map(mid => batchMaterialSummaryAPI.getByBatchAndMaterial(ev.batch_no, mid).catch(() => []))
                );
                summary = results.flat();
            }
            setExpandedData(prev => new Map(prev).set(id, { materials, summary }));
        } catch {
            setExpandedData(prev => new Map(prev).set(id, { materials: [], summary: [] }));
        } finally {
            setLoadingExpanded(prev => { const s = new Set(prev); s.delete(id); return s; });
        }
    }, [expandedRows, expandedData]);

    // ── Load data ────────────────────────────────────────────────────────────

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await machineEventAPI.getAll();
            setEvents(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to load machine events", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const loadReferenceData = useCallback(async () => {
        try {
            const [typesRes, reasonsRes, empsRes] = await Promise.all([
                machineEventTypeAPI.getAll(),
                machineStopReasonAPI.getAll(),
                employeeAPI.getAll(),
            ]);
            setEventTypes((typesRes || []).filter((t: MachineEventType) => t.active));
            setStopReasons((reasonsRes || []).filter((r: StopReason) => r.active));
            setEmployees((empsRes || []).filter((e: Employee) => e.active));
        } catch { /* non-blocking */ }
    }, []);

    const loadMachines = useCallback(async () => {
        try {
            const res = await fetch("/api/machinery");
            const data = await res.json();
            setMachines((data || []).filter((m: Machine) => m.active));
        } catch { /* non-blocking */ }
    }, []);

    useEffect(() => {
        loadEvents();
        loadReferenceData();
        loadMachines();
    }, [loadEvents, loadReferenceData, loadMachines]);

    useEffect(() => {
        if (isAddModalOpen) {
            setAddForm({ ...emptyAddForm, event_time: getCurrentTime(), done_by_emp_id: getSessionUser()?.employee_id || "" });
            setPrevEventTypeId("");
            setPrevEventInfo(null);
            setStockData(null);
            setCloseQtyRecord(null);
            setCloseQtyError("");
            setAvailableRolls([]);
            setBomMaterials([]);
            setActualTareQty(0);
        }
    }, [isAddModalOpen]);

    // Load BOM materials when product_id is available
    useEffect(() => {
        if (!addForm.product_id) { setBomMaterials([]); return; }
        productBomAPI.getByProductId(addForm.product_id)
            .then((data: any[]) => setBomMaterials(data || []))
            .catch(() => setBomMaterials([]));
    }, [addForm.product_id]);

    // ── Add form: machine selection ───────────────────────────────────────────

    const handleMachineChange = useCallback(async (machineId: string) => {
        setAddForm(prev => ({ ...prev, machine_id: machineId, machine_event_type_id: "", batch_no: "", product_id: "", batch_status_id: "", stop_reason_id: "" }));
        setPrevEventTypeId(""); setPrevEventInfo(null);
        if (!machineId) return;
        try {
            const data = await machineEventAPI.getAll({ machine_id: machineId });
            if (data && data.length > 0) {
                const latest = data.sort((a: any, b: any) => b.machine_event_id - a.machine_event_id)[0];
                setPrevEventTypeId(latest.machine_event_type_id);
                setPrevEventInfo({ type_id: latest.machine_event_type_id, date: latest.event_date, time: latest.event_time });
            }
        } catch { /* no previous events */ }
    }, []);

    // ── Add form: event type selection ────────────────────────────────────────

    const handleEventTypeSelect = useCallback(async (typeId: string, machineId: string) => {
        const metm = eventTypes.find(t => t.machine_event_type_id === typeId);
        setAddForm(prev => ({ ...prev, machine_event_type_id: typeId, batch_status_id: metm?.batch_status_id || "", stop_reason_id: "", batch_no: "", product_id: "", qty_close: "" }));
        setCloseQtyRecord(null);
        setCloseQtyError("");

        // If accept_close_qty = Y, find the open-qty event type and fetch latest open record (T303)
        if (metm?.accept_close_qty === "Y") {
            const openMetm = eventTypes.find(t => t.accept_open_qty === "Y");
            if (openMetm && machineId) {
                try {
                    const rec = await machineEventMaterialAPI.getOpenRecord(machineId, openMetm.machine_event_type_id);
                    setCloseQtyRecord(rec);
                } catch (err: any) {
                    setCloseQtyError(err?.message || "No open material record found for this machine. {T303}");
                    toast({ title: "Validation", description: err?.message || "No open material record found. {T303}", variant: "destructive" });
                }
            }
        }
        // NB → look for batch with status 'R' (Released)
        // all other event types → look for batch with status 'W' (Work-In-Progress)
        const lookupStatus = typeId === "NB" ? "R" : "W";
        try {
            const res = await fetch(`/api/transactions?current_batch_status_id=${lookupStatus}`);
            if (res.ok) {
                const txns = await res.json();
                if (txns && txns.length > 0) {
                    setAddForm(prev => ({ ...prev, batch_no: txns[0].batch_no, product_id: txns[0].product_id }));
                } else {
                    const msg = lookupStatus === "R"
                        ? "No batch found with status 'Ready for Production'. {T301}"
                        : "No batch found with status 'Work in Progress'. {T302}";
                    toast({ title: "Warning", description: msg, variant: "destructive" });
                    setAddForm(prev => ({ ...prev, batch_no: "", product_id: "" }));
                }
            }
        } catch { /* ignore */ }
    }, [eventTypes, toast]);

    // ── Material stock lookup ─────────────────────────────────────────────────

    const handleMaterialSearch = useCallback(async () => {
        if (!addForm.material_search.trim()) return;
        try {
            const data = await materialStockAPI.getByMaterialId(addForm.material_search.trim().toUpperCase());
            setStockData(data);
            setAddForm(prev => ({ ...prev, selected_material_id: addForm.material_search.trim().toUpperCase() }));
        } catch {
            setStockData(null);
            toast({ title: "Not Found", description: `No stock found for "${addForm.material_search}"`, variant: "destructive" });
        }
    }, [addForm.material_search, toast]);

    // ── Validation ────────────────────────────────────────────────────────────

    function isValidEventTime(time: string): boolean {
        const [h, m] = time.split(":").map(Number);
        const selected = h * 60 + m;
        const now = new Date();
        const current = now.getHours() * 60 + now.getMinutes();
        return selected >= current - 60 && selected <= current;
    }

    function checkPrerequisite(typeId: string): boolean {
        const metm = eventTypes.find(t => t.machine_event_type_id === typeId);
        if (!metm?.prerequisite_machine_event_type_id) return true;
        return prevEventTypeId === metm.prerequisite_machine_event_type_id;
    }

    // ── Enabled event types: those whose prerequisite matches latest event ────

    const enabledEventTypeIds = new Set(
        addForm.machine_id
            ? eventTypes.filter(t => t.prerequisite_machine_event_type_id === prevEventTypeId).map(t => t.machine_event_type_id)
            : []
    );

    // ── Selected METM for derived flags ──────────────────────────────────────

    const selectedMetm = eventTypes.find(t => t.machine_event_type_id === addForm.machine_event_type_id);
    const requiresStopReason = selectedMetm?.machine_event_type_name === "Machine Stop";
    const acceptMaterial = selectedMetm?.accept_material === "Y";
    const acceptOpenQty = selectedMetm?.accept_open_qty === "Y";
    const acceptCloseQty = selectedMetm?.accept_close_qty === "Y";
    const showMaterialSection = acceptMaterial || acceptOpenQty || acceptCloseQty;
    const validationPassed = !!(addForm.machine_id && addForm.machine_event_type_id && addForm.batch_no && addForm.done_by_emp_id);

    // ── Add submit ────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!addForm.machine_id || !addForm.machine_event_type_id || !addForm.batch_no || !addForm.done_by_emp_id) {
            toast({ title: "Validation", description: "Machine, Event Type, Batch No, and Done By are required.", variant: "destructive" });
            return;
        }
        if (!isValidEventTime(addForm.event_time)) {
            toast({ title: "Validation", description: "Event Time must be within the last 60 minutes.", variant: "destructive" });
            return;
        }
        if (!checkPrerequisite(addForm.machine_event_type_id)) {
            const metm = eventTypes.find(t => t.machine_event_type_id === addForm.machine_event_type_id);
            toast({ title: "Validation", description: `Previous event type must be '${metm?.prerequisite_machine_event_type_id}' for this machine.`, variant: "destructive" });
            return;
        }
        if (requiresStopReason && !addForm.stop_reason_id) {
            toast({ title: "Validation", description: "Stop Reason is required for this event type.", variant: "destructive" });
            return;
        }
        isSubmittingRef.current = true;
        try {
            await machineEventAPI.create({
                machine_id: addForm.machine_id,
                batch_no: addForm.batch_no,
                product_id: addForm.product_id,
                machine_event_type_id: addForm.machine_event_type_id,
                event_date: getCurrentDate(),
                event_time: `${getCurrentTime()}:00`,
                batch_status_id: addForm.batch_status_id || "",
                machine_stop_reason_id: addForm.stop_reason_id || "",
                remarks: addForm.remarks || "",
                done_by_emp_id: addForm.done_by_emp_id,
                last_modified_user_id: "ADMIN",
                // Material fields — saved to MachineEventMaterial based on mode
                ...(acceptOpenQty && addForm.selected_material_id && addForm.roll_number ? {
                    // Open qty mode
                    material_id: addForm.selected_material_id,
                    roll_no: addForm.roll_number,
                    actual_gross_qty: addForm.actual_gross_qty !== "" ? Number(addForm.actual_gross_qty) : undefined,
                    actual_tare_qty: actualTareQty,
                    actual_open_qty: addForm.actual_gross_qty !== "" ? Math.max(0, Number(addForm.actual_gross_qty) - actualTareQty) : undefined,
                    actual_close_qty: 0,
                    actual_consumed_qty: 0,
                    uom: addForm.mat_uom || undefined,
                } : acceptCloseQty && closeQtyRecord ? {
                    // Close qty mode — use pre-loaded open record data
                    material_id: closeQtyRecord.material_id,
                    roll_no: closeQtyRecord.roll_no,
                    actual_gross_qty: closeQtyRecord.actual_gross_qty,
                    actual_tare_qty: closeQtyRecord.actual_tare_qty,
                    actual_open_qty: closeQtyRecord.actual_open_qty,
                    actual_close_qty: addForm.qty_close !== "" ? Number(addForm.qty_close) : 0,
                    actual_consumed_qty: (() => {
                        const closeQty = addForm.qty_close !== "" ? Number(addForm.qty_close) : 0;
                        const tare = closeQtyRecord.actual_tare_qty ?? 0;
                        return Math.max(0, closeQty === 0
                            ? closeQtyRecord.actual_open_qty - closeQty
                            : closeQtyRecord.actual_open_qty - closeQty + tare);
                    })(),
                    uom: closeQtyRecord.uom || addForm.mat_uom || undefined,
                } : {}),
            });
            if (addForm.machine_event_type_id === 'NB') {
                await transactionAPI.update(addForm.batch_no, { current_batch_status_id: 'W' });
            }
            toast({ title: "Success", description: "Machine event created successfully" });
            setIsAddModalOpen(false);
            loadEvents();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create machine event", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────

    const handleEdit = (ev: MachineEvent) => {
        setSelectedEvent(ev);
        setEditForm({
            machine_stop_reason_id: ev.machine_stop_reason_id || "",
            remarks: ev.remarks || "",
            done_by_emp_id: ev.done_by_emp_id || "",
            event_time: ev.event_time ? ev.event_time.substring(0, 5) : getCurrentTime(),
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedEvent) return;
        isSubmittingRef.current = true;
        const previousData = { ...selectedEvent };
        try {
            await machineEventAPI.update(selectedEvent.machine_event_id, {
                machine_stop_reason_id: editForm.machine_stop_reason_id || "",
                remarks: editForm.remarks || "",
                done_by_emp_id: editForm.done_by_emp_id,
                event_time: `${getCurrentTime()}:00`,
                last_modified_user_id: "ADMIN",
            });
            setLastAction({ type: "edit", data: previousData });
            toast({
                title: "Success", description: "Machine event updated successfully",
                action: <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>,
            });
            setIsEditModalOpen(false);
            setSelectedEvent(null);
            loadEvents();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update machine event", variant: "destructive" });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        try {
            const d = lastAction.data;
            await machineEventAPI.update(d.machine_event_id, {
                machine_stop_reason_id: d.machine_stop_reason_id || "",
                remarks: d.remarks || "",
                done_by_emp_id: d.done_by_emp_id || "",
                event_time: d.event_time,
                last_modified_user_id: "ADMIN",
            });
            toast({ title: "Undone", description: "Changes have been reverted" });
            setLastAction(null);
            loadEvents();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to undo", variant: "destructive" });
        }
    };

    const handleCancel = (ev: MachineEvent) => { setEventToCancel(ev); setIsCancelItemDialogOpen(true); };

    const confirmCancelItem = async () => {
        if (!eventToCancel) return;
        try {
            await machineEventAPI.delete(eventToCancel.machine_event_id);
            await loadEvents();
            toast({ title: "Deleted", description: `Machine event ${eventToCancel.machine_event_id} deleted` });
            setIsCancelItemDialogOpen(false);
            setEventToCancel(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
        }
    };

    const handleCancelClick = (modalType: "add" | "edit") => { setCancelModalType(modalType); setIsCancelDialogOpen(true); };

    const confirmCancel = () => {
        if (cancelModalType === "add") setIsAddModalOpen(false);
        else if (cancelModalType === "edit") { setIsEditModalOpen(false); setSelectedEvent(null); }
        setIsCancelDialogOpen(false);
        setCancelModalType(null);
    };

    // ── Filter / Pagination ───────────────────────────────────────────────────

    const uniqueMachines = Array.from(new Set(events.map(e => e.machine_id)));

    const filteredEvents = events.filter(ev => {
        const matchesSearch =
            ev.machine_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.batch_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.machine_event_type_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMachine = filterMachine === "all" || ev.machine_id === filterMachine;
        return matchesSearch && matchesMachine;
    });

    const totalPages = Math.ceil(filteredEvents.length / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterMachine, rowsPerPage]);

    // ── Edit form fields ──────────────────────────────────────────────────────

    const editEventTypeName = eventTypes.find(t => t.machine_event_type_id === selectedEvent?.machine_event_type_id)?.machine_event_type_name;
    const editRequiresStopReason = editEventTypeName === "Machine Stop";

    const renderEditFields = () => (
        <div className="p-6 space-y-5">
            {/* Header Information card */}
            <div className="bg-white rounded-lg border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Header Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {/* Machine Event ID */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Machine Event ID</label>
                        <Input value={selectedEvent?.machine_event_id ?? ""} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                    </div>
                    {/* Machine ID */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Machine ID</label>
                        <Input value={selectedEvent?.machine_id ?? ""} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                    </div>
                    {/* Event Type */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">Event Type</label>
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border bg-blue-600 text-white border-blue-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                                {editEventTypeName ?? selectedEvent?.machine_event_type_id}
                            </span>
                        </div>
                    </div>
                    {/* Batch No */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Batch Number</label>
                        <Input value={selectedEvent?.batch_no ?? ""} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                    </div>
                    {/* Product ID */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Product ID</label>
                        <Input value={selectedEvent?.product_id ?? ""} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                    </div>
                    {/* Event Date */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Event Date</label>
                        <Input value={selectedEvent?.event_date ?? ""} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                    </div>
                    {/* Batch Status */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Batch Status</label>
                        <Input value={selectedEvent?.batch_status_id ?? ""} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                    </div>
                    {/* Event Time */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            <Clock className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                            Event Time <span className="text-red-500">*</span>
                        </label>
                       <Input 
    value={getCurrentTime()} 
    disabled 
    className="bg-muted/40 text-muted-foreground text-sm font-mono" 
/>
<p className="text-xs text-muted-foreground mt-1">Auto-set to current time</p>
                    </div>
                    {/* Done By */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            <User className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                            Done By <span className="text-red-500">*</span>
                        </label>
                        <select value={editForm.done_by_emp_id}
                            onChange={e => setEditForm(prev => ({ ...prev, done_by_emp_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">-- Select Employee --</option>
                            {employees.filter(emp => emp.active).map(emp => <option key={emp.emp_id} value={emp.emp_id}>{emp.emp_id} - {emp.emp_name}</option>)}
                        </select>
                    </div>
                    {/* Stop Reason (conditional) */}
                    {editRequiresStopReason && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Stop Reason <span className="text-red-500">*</span>
                            </label>
                            <select value={editForm.machine_stop_reason_id}
                                onChange={e => setEditForm(prev => ({ ...prev, machine_stop_reason_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">-- Select Reason --</option>
                                {stopReasons.map(r => <option key={r.reason_id} value={r.reason_id}>{r.reason_id} - {r.reason_name}</option>)}
                            </select>
                        </div>
                    )}
                    {/* Remarks */}
                    <div className={editRequiresStopReason ? "" : "col-span-2"}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            <FileText className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                            Remarks
                        </label>
                        <Input value={editForm.remarks}
                            onChange={e => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                            maxLength={100} placeholder="Optional remarks..." />
                    </div>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto ml-64">
                <div className="p-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Machine Event</h1>
                                <p className="text-muted-foreground">Record and manage machine production events</p>
                            </div>
                            <Button onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                                <Plus className="w-5 h-5" />Add New Event
                            </Button>
                        </div>
                    </motion.div>


                    {/* Search bar */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input type="text" placeholder="Search by Machine ID, Batch No, Event Type..."
                                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full" />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredEvents.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredEvents.length)} OF {filteredEvents.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-0" align="end">
                                        <div className="p-4 border-b border-border"><h3 className="font-semibold text-sm text-foreground">Filters</h3></div>
                                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-foreground">Machine</Label>
                                                <div className="space-y-2">
                                                    {[{ value: "all", label: "All" }, ...uniqueMachines.map(m => ({ value: m, label: m }))].map(({ value, label }) => (
                                                        <div key={value} className="flex items-center space-x-2">
                                                            <input type="radio" id={`me-m-${value}`} name="meMachine"
                                                                checked={filterMachine === value} onChange={() => setFilterMachine(value)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                                                            <Label htmlFor={`me-m-${value}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-3 border-t border-border">
                                                <Label className="text-sm font-semibold text-foreground">No. of rows per screen</Label>
                                                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                    {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-border bg-muted/30">
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => setFilterMachine("all")}>Clear Filters</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-border">
                                            <th className="px-2 py-3 w-8" />
                                            {["Event ID", "Machine", "Batch No", "Product", "Event Type", "Date", "Time", "Batch Status", "Stop Reason", "Done By", "Last Modified User Id", "Last Modified Date & Time", "Actions"].map(h => (
                                                <th key={h} className="px-4 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr><td colSpan={13} className="px-6 py-4 text-center text-muted-foreground">Loading machine events...</td></tr>
                                        ) : filteredEvents.length === 0 ? (
                                            <tr><td colSpan={14} className="px-6 py-4 text-center text-muted-foreground">No machine events found</td></tr>
                                        ) : paginatedEvents.map((ev, index) => {
                                            const isExpanded = expandedRows.has(ev.machine_event_id);
                                            const isLoading  = loadingExpanded.has(ev.machine_event_id);
                                            const data       = expandedData.get(ev.machine_event_id);
                                            return (
                                            <>
                                            <motion.tr key={ev.machine_event_id}
                                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors">
                                                {/* Expand arrow */}
                                                <td className="px-2 py-4 text-center">
                                                    <button onClick={e => { e.stopPropagation(); toggleRowExpansion(ev); }}
                                                        className="p-1 hover:bg-gray-200 rounded-full transition-colors" disabled={isLoading}>
                                                        {isLoading
                                                            ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                            : isExpanded
                                                                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                                                : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4"><span className="text-sm font-mono text-muted-foreground">{ev.machine_event_id}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm font-semibold">{ev.machine_id}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm">{ev.batch_no}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm">{ev.product_id}</span></td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{ev.machine_event_type_id}</span>
                                                </td>
                                                <td className="px-4 py-4"><span className="text-sm">{ev.event_date ? (() => { const d = new Date(ev.event_date); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; })() : "-"}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm font-mono">{ev.event_time}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm font-mono">{ev.batch_status_id || "-"}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm">{ev.machine_stop_reason_id || "-"}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm">{ev.done_by_emp_id || "-"}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm font-mono">{ev.last_modified_user_id || "-"}</span></td>
                                                <td className="px-4 py-4"><span className="text-sm">{formatDateTime(ev.last_modified_date_time)}</span></td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleEdit(ev); }}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Pencil className="w-4 h-4" /></Button>
                                                        {isSuperAdmin && (
                                                            <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleCancel(ev); }}
                                                                className="text-red-700 hover:text-red-800 hover:bg-red-50" title="Permanently delete"><Trash2 className="w-4 h-4" /></Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>

                                            {/* ── Expanded row ── */}
                                            {isExpanded && (
                                                <tr key={`${ev.machine_event_id}-exp`}>
                                                    <td colSpan={14} className="px-6 py-0 bg-blue-50/40 border-b border-blue-100">
                                                        <div className="py-4 space-y-4">

                                                            {/* Machine Event Materials table */}
                                                            <div>
                                                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Machine Event Materials</p>
                                                                {!data || data.materials.length === 0 ? (
                                                                    <p className="text-xs text-muted-foreground italic">No material records for this event.</p>
                                                                ) : (
                                                                    <table className="w-full text-xs border border-blue-200 rounded-lg overflow-hidden">
                                                                        <thead>
                                                                            <tr className="bg-blue-100 text-blue-800">
                                                                                {["Event Id","Machine Id","Material ID", "Roll No", "Actual Open Qty", "Actual Close Qty", "Actual Consumed Qty", "UOM"].map(h => (
                                                                                    <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-blue-100">
                                                                            {data.materials.map((m, i) => (
                                                                                <tr key={i} className="bg-white hover:bg-blue-50">
                                                                                    <td className="px-3 py-2 font-mono">{m.machine_event_id}</td>
                                                                                    <td className="px-3 py-2 font-mono">{m.machine_id}</td>
                                                                                    <td className="px-3 py-2 font-mono">{m.material_id}</td>
                                                                                    <td className="px-3 py-2 font-mono">{m.roll_no}</td>
                                                                                    <td className="px-3 py-2">{m.actual_open_qty ?? "-"}</td>
                                                                                    <td className="px-3 py-2">{m.actual_close_qty ?? "-"}</td>
                                                                                    <td className="px-3 py-2">{m.actual_consumed_qty ?? "-"}</td>
                                                                                    <td className="px-3 py-2">{m.uom || "-"}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>

                                                            {/* Batch Material Summary table */}
                                                            <div>
                                                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Batch Material Summary</p>
                                                                {!data || data.summary.length === 0 ? (
                                                                    <p className="text-xs text-muted-foreground italic">No batch summary records found.</p>
                                                                ) : (
                                                                    <table className="w-full text-xs border border-green-200 rounded-lg overflow-hidden">
                                                                        <thead>
                                                                            <tr className="bg-green-100 text-green-800">
                                                                                {["Batch No", "Product ID", "Material ID", "Total Consumed Qty", "UOM", "Total Rolls"].map(h => (
                                                                                    <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-green-100">
                                                                            {data.summary.map((s, i) => (
                                                                                <tr key={i} className="bg-white hover:bg-green-50">
                                                                                    <td className="px-3 py-2 font-mono">{s.batch_no}</td>
                                                                                    <td className="px-3 py-2 font-mono">{s.product_id}</td>
                                                                                    <td className="px-3 py-2 font-mono">{s.material_id}</td>
                                                                                    <td className="px-3 py-2">{s.total_consumed_qty}</td>
                                                                                    <td className="px-3 py-2">{s.uom}</td>
                                                                                    <td className="px-3 py-2">{s.total_no_of_rolls}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </>
                                        );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE {currentPage} OF {totalPages}</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4 mr-1" />Previous
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                                        Next<ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* ══════════════════════════════════════════════════════════════════
                ADD MODAL  —  Full-screen overlay with 2-column layout
            ══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50" onClick={() => handleCancelClick("add")} />

                        <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 20 }} transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4">

                            <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">

                                {/* Modal header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Machine Event Entry</h2>
                                        <p className="text-sm text-muted-foreground">Register real-time production events and material consumption.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" className="flex items-center gap-2" onClick={() => handleCancelClick("add")}>
                                            <History className="w-4 h-4" />View History
                                        </Button>
                                        <Button form="add-event-form" type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                                            <Save className="w-4 h-4" />Save Event
                                        </Button>
                                        <button onClick={() => handleCancelClick("add")} className="p-2 rounded-lg hover:bg-muted transition-colors">
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal body: 2-column */}
                                <form id="add-event-form" onSubmit={handleSubmit}
                                    className="flex-1 overflow-y-auto">
                                    <div className="flex gap-0 h-full">

                                        {/* Left column */}
                                        <div className="flex-1 p-6 space-y-5 overflow-y-auto border-r border-border">

                                            {/* Header Information */}
                                            <div className="bg-white rounded-lg border border-border p-5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Info className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-foreground">Header Information</h3>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Machine Event ID */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Machine Event ID</label>
                                                        <Input value="Auto generated on save" disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                    </div>

                                                    {/* Machine ID */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                                            Machine ID <span className="text-red-500">*</span>
                                                        </label>
                                                        <select value={addForm.machine_id} onChange={e => handleMachineChange(e.target.value)}
                                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                            <option value="">-- Select Machine --</option>
                                                            {machines.map(m => <option key={m.machine_id} value={m.machine_id}>{m.machine_id} - {m.machine_name}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Latest Machine Event Type ID */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Latest Event Type ID</label>
                                                        <Input value={prevEventTypeId || "—"} disabled className="bg-muted/40 text-muted-foreground text-sm font-mono" />
                                                    </div>

                                                    {/* Latest Event Date & Time */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Latest Event Date &amp; Time</label>
                                                        <Input
                                                            value={prevEventInfo ? (() => {
                                                                const d = new Date(prevEventInfo.date);
                                                                const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                                                                return dateStr === getCurrentDate() ? prevEventInfo.time : `${d.toLocaleDateString()} ${prevEventInfo.time}`;
                                                            })() : "—"}
                                                            disabled className="bg-muted/40 text-muted-foreground text-sm font-mono" />
                                                    </div>

                                                    {/* Event Type buttons */}
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-foreground mb-2">
                                                            Event Type <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {eventTypes.map(et => {
                                                                const isDisabled = !enabledEventTypeIds.has(et.machine_event_type_id);
                                                                const isSelected = addForm.machine_event_type_id === et.machine_event_type_id;
                                                                return (
                                                                    <button key={et.machine_event_type_id} type="button"
                                                                        onClick={() => !isDisabled && handleEventTypeSelect(et.machine_event_type_id, addForm.machine_id)}
                                                                        disabled={isDisabled}
                                                                        title={isDisabled ? "Not available for current machine state" : et.machine_event_type_name}
                                                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all
                                                                            ${isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                                                : isDisabled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"}`}>
                                                                        <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                                                                        {et.machine_event_type_name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Batch Number */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Batch Number</label>
                                                        <Input value={addForm.batch_no} disabled className="bg-muted/40 text-muted-foreground text-sm" placeholder="Auto filled" />
                                                    </div>

                                                    {/* Product ID */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Product ID</label>
                                                        <Input value={addForm.product_id} disabled className="bg-muted/40 text-muted-foreground text-sm" placeholder="Auto filled" />
                                                    </div>

                                                    {/* Event Date */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Event Date</label>
                                                        <Input value={getCurrentDate()} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                    </div>

                                                    {/* Batch Status */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Batch Status</label>
                                                        <Input value={addForm.batch_status_id} disabled className="bg-muted/40 text-muted-foreground text-sm" placeholder="Auto filled" />
                                                    </div>

                                                    {/* Event Time */}
                                                {/* Event Time */}
<div>
    <label className="block text-sm font-medium text-muted-foreground mb-1.5">
        <Clock className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
        Event Time
    </label>
    <Input 
        type="text" 
        value={addForm.event_time} 
        readOnly 
        className="bg-muted/40 text-muted-foreground text-sm cursor-not-allowed" 
    />
    <p className="text-xs text-muted-foreground mt-1">Auto-set to current time</p>
</div>

                                                    {/* Done By */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                                                            <User className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                                                            Done By
                                                        </label>
                                                        <Input value={addForm.done_by_emp_id || "—"} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                    </div>

                                                    {/* Stop Reason (conditional) */}
                                                    {requiresStopReason && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                                Stop Reason <span className="text-red-500">*</span>
                                                            </label>
                                                            <select value={addForm.stop_reason_id}
                                                                onChange={e => setAddForm(prev => ({ ...prev, stop_reason_id: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                                <option value="">-- Select Reason --</option>
                                                                {stopReasons.map(r => <option key={r.reason_id} value={r.reason_id}>{r.reason_id} - {r.reason_name}</option>)}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Remarks */}
                                                    <div className={requiresStopReason ? "" : "col-span-2"}>
                                                        <label className="block text-sm font-medium text-foreground mb-1.5">
                                                            <FileText className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                                                            Remarks
                                                        </label>
                                                        <Input value={addForm.remarks}
                                                            onChange={e => setAddForm(prev => ({ ...prev, remarks: e.target.value }))}
                                                            maxLength={100} placeholder="Optional remarks..." />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Material Selection — OPEN QTY mode (accept_open_qty = Y) */}
                                            {acceptMaterial && (
                                                <div className="bg-white rounded-lg border border-border p-5">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-foreground">Material Selection &amp; Stock Status</h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Material dropdown from ProductBOM */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                                Material ID <span className="text-red-500">*</span>
                                                            </label>
                                                            <select value={addForm.selected_material_id}
                                                                onChange={e => {
                                                                    const matId = e.target.value;
                                                                    const bom = bomMaterials.find(b => b.material_id === matId);
                                                                    setAddForm(prev => ({ ...prev, selected_material_id: matId, material_search: matId, mat_uom: bom?.input_uom || "", actual_gross_qty: "", roll_number: "" }));
                                                                    setAvailableRolls([]);
                                                                    setActualTareQty(0);
                                                                    if (matId) {
                                                                        Promise.all([
                                                                            availableRollsAPI.getByMaterialId(matId),
                                                                            materialAPI.getById(matId),
                                                                        ]).then(([rolls, mat]) => {
                                                                            const rollList = rolls || [];
                                                                            setAvailableRolls(rollList);
                                                                            const tare = mat?.core_weight ?? 0;
                                                                            setActualTareQty(tare);
                                                                            if (rollList.length > 0) {
                                                                                const firstRoll = rollList[0];
                                                                                setAddForm(prev => ({ ...prev, roll_number: firstRoll.roll_no, actual_gross_qty: String(firstRoll.balance_qty) }));
                                                                            }
                                                                        }).catch(() => { setAvailableRolls([]); setActualTareQty(0); });
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                                <option value="">-- Select Material --</option>
                                                                {bomMaterials.map(b => (
                                                                    <option key={b.material_id} value={b.material_id}>{b.material_id}</option>
                                                                ))}
                                                            </select>
                                                            {!addForm.product_id && (
                                                                <p className="text-xs text-amber-500 mt-1">Select Event Type first to load materials</p>
                                                            )}
                                                        </div>

                                                        {/* UOM — display only */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">UOM</label>
                                                            <Input value={addForm.mat_uom} disabled className="bg-muted/40 text-muted-foreground text-sm" placeholder="Auto filled" />
                                                        </div>

                                                        {/* Roll No — selection from GRU (status IN A/I, balance>0, ASC) */}
                                                        <div className="col-span-2">
                                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                                Roll No <span className="text-red-500">*</span>
                                                            </label>
                                                            <select value={addForm.roll_number}
                                                                onChange={e => {
                                                                    const roll = availableRolls.find(r => r.roll_no === e.target.value);
                                                                    setAddForm(prev => ({ ...prev, roll_number: e.target.value, actual_gross_qty: roll ? String(roll.balance_qty) : "" }));
                                                                }}
                                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                                <option value="">-- Select Roll --</option>
                                                                {availableRolls.map(r => (
                                                                    <option key={r.roll_no} value={r.roll_no}>
                                                                        {r.roll_no} | Bal: {r.balance_qty} | {r.uom} | Status: {r.status}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {availableRolls.length === 0 && addForm.selected_material_id && (
                                                                <p className="text-xs text-amber-500 mt-1">No stock found (status A/I, balance &gt; 0)</p>
                                                            )}
                                                        </div>

                                                        {/* Actual Gross Qty — entry, default = balance_qty */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                                                Actual Gross Qty <span className="text-red-500">*</span>
                                                            </label>
                                                            <Input type="number" value={addForm.actual_gross_qty}
                                                                onChange={e => setAddForm(prev => ({ ...prev, actual_gross_qty: e.target.value }))}
                                                                placeholder="Default from balance qty" min={0} step="0.001" />
                                                        </div>

                                                        {/* Actual Tare Qty — display only, from MaterialMaster.core_weight */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Tare Qty</label>
                                                            <Input value={actualTareQty} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                        </div>

                                                        {/* Actual Open Qty — display only, auto-calc = gross - tare */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Open Qty</label>
                                                            <Input
                                                                value={addForm.actual_gross_qty !== "" ? String(Math.max(0, Number(addForm.actual_gross_qty) - actualTareQty)) : ""}
                                                                disabled className="bg-muted/40 text-muted-foreground text-sm font-semibold" />
                                                        </div>

                                                        {/* Actual Close Qty — display only, default 0 */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Close Qty</label>
                                                            <Input value="0" disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                        </div>

                                                        {/* Actual Consumed Qty — display only, default 0 */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Consumed Qty</label>
                                                            <Input value="0" disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Material Selection — CLOSE QTY mode (accept_close_qty = Y) */}
                                            {acceptCloseQty && (
                                                <div className="bg-white rounded-lg border border-border p-5">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                                            <Layers className="w-3.5 h-3.5 text-orange-600" />
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-foreground">Material Selection &amp; Stock Status</h3>
                                                        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Close Qty Entry</span>
                                                    </div>

                                                    {closeQtyError ? (
                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                                                            {closeQtyError}
                                                        </div>
                                                    ) : closeQtyRecord ? (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Material ID — display only */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Material ID</label>
                                                                <Input value={closeQtyRecord.material_id} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                            </div>

                                                            {/* UOM — display only from BOM */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">UOM</label>
                                                                <Input value={closeQtyRecord.uom || addForm.mat_uom || ""} disabled className="bg-muted/40 text-muted-foreground text-sm" placeholder="Auto filled" />
                                                            </div>

                                                            {/* Roll No — display only */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Roll No</label>
                                                                <Input value={closeQtyRecord.roll_no} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                            </div>

                                                            {/* Actual Gross Qty — display only, from record X */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Gross Qty</label>
                                                                <Input value={closeQtyRecord.actual_gross_qty ?? "—"} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                            </div>

                                                            {/* Actual Tare Qty — display only, from record X */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Tare Qty</label>
                                                                <Input value={closeQtyRecord.actual_tare_qty ?? "—"} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                            </div>

                                                            {/* Actual Open Qty — display only */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Open Qty</label>
                                                                <Input value={String(closeQtyRecord.actual_open_qty)} disabled className="bg-muted/40 text-muted-foreground text-sm" />
                                                            </div>

                                                            {/* Actual Close Qty — editable, >= 0 and <= actual_open_qty */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                                                    Actual Close Qty <span className="text-red-500">*</span>
                                                                </label>
                                                                <Input type="number" value={addForm.qty_close}
                                                                    onChange={e => setAddForm(prev => ({ ...prev, qty_close: e.target.value }))}
                                                                    placeholder="0" min={0} max={closeQtyRecord.actual_open_qty} step="0.001" />
                                                                <p className="text-xs text-muted-foreground mt-1">0 ≤ close qty ≤ {closeQtyRecord.actual_open_qty}</p>
                                                            </div>

                                                            {/* Actual Consumed Qty — display only */}
                                                            <div>
                                                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Actual Consumed Qty</label>
                                                                <Input
                                                                    value={(() => {
                                                                        const closeQty = addForm.qty_close !== "" ? Number(addForm.qty_close) : 0;
                                                                        const tare = closeQtyRecord.actual_tare_qty ?? 0;
                                                                        const consumed = closeQty === 0
                                                                            ? closeQtyRecord.actual_open_qty - closeQty
                                                                            : closeQtyRecord.actual_open_qty - closeQty + tare;
                                                                        return String(Math.max(0, consumed));
                                                                    })()}
                                                                    disabled className="bg-muted/40 text-muted-foreground text-sm font-semibold" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">Loading open material record...</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right sidebar */}
                                        <div className="w-64 shrink-0 p-5 space-y-4 bg-muted/20 overflow-y-auto">

                                            {/* Batch Summary */}
                                            <div className="bg-white rounded-lg border border-border p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <FileText className="w-3 h-3 text-blue-600" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-foreground">Batch Summary</h3>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    {[
                                                        { label: "Machine", value: addForm.machine_id },
                                                        { label: "Event Type", value: addForm.machine_event_type_id },
                                                        { label: "Batch No", value: addForm.batch_no },
                                                        { label: "Product ID", value: addForm.product_id },
                                                        { label: "Batch Status", value: addForm.batch_status_id },
                                                    ].map(({ label, value }) => (
                                                        <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/60">
                                                            <span className="text-muted-foreground text-xs">{label}</span>
                                                            <span className="font-semibold text-xs">{value || "—"}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-center justify-between py-1.5">
                                                        <span className="text-muted-foreground text-xs">Validation</span>
                                                        {validationPassed ? (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                                                <CheckCircle2 className="w-3 h-3" />Passed
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-medium text-amber-500">Incomplete</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 mt-3">
                                                    System will auto-calculate inventory adjustments once the &quot;Save&quot; action is triggered.
                                                </p>
                                            </div>

                                            {/* Complete Transaction */}
                                            <div className="bg-blue-600 rounded-lg p-4">
                                                <h3 className="text-sm font-semibold text-white mb-1">Complete Transaction</h3>
                                                <p className="text-xs text-blue-200 mb-3">Verify all machine parameters and material counts before finalizing.</p>
                                                <div className="space-y-2">
                                                    <Button form="add-event-form" type="submit"
                                                        className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm">
                                                        Submit Final Entry
                                                    </Button>
                                                    <Button type="button" variant="outline"
                                                        onClick={() => handleCancelClick("add")}
                                                        className="w-full border-white/40 text-white hover:bg-blue-700 hover:text-white text-sm">
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Machine Status */}
                                            {addForm.machine_id && (
                                                <div className="bg-white rounded-lg border border-border p-3">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Machine Status</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-sm font-medium">{addForm.machine_id} Online</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ══ Edit Modal ══ */}
            <AnimatePresence>
                {isEditModalOpen && selectedEvent && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50" onClick={() => handleCancelClick("edit")} />
                        <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 20 }} transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Edit Machine Event</h2>
                                        <p className="text-sm text-muted-foreground">Update event details for event #{selectedEvent.machine_event_id}.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button form="edit-event-form" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                                            <Save className="w-4 h-4" />Update Event
                                        </Button>
                                        <button onClick={() => handleCancelClick("edit")} className="p-2 rounded-lg hover:bg-muted transition-colors">
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>
                                {/* Body */}
                                <form id="edit-event-form" onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto">
                                    {renderEditFields()}
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Cancel</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to cancel? Any unsaved changes will be lost.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelDialogOpen(false)}>No, Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">Yes, Cancel</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isCancelItemDialogOpen} onOpenChange={setIsCancelItemDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete machine event <strong>{eventToCancel?.machine_event_id}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setIsCancelItemDialogOpen(false); setEventToCancel(null); }}>No, Keep</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancelItem} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
