'use client';

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, X, Download, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
    productMovementAPI,
    productStockAPI,
    productAPI,
    productStatusTransitionAPI,
    productStatusAPI,
    cartonCapacityAPI,
    packSizeAPI,
    transactionAPI,
} from "@/services/api";

// ── Interfaces ───────────────────────────────────────────────────────────────

interface ProductMovementRecord {
    _id: string;
    prod_movement_id: number;
    movement_date: string;
    batch_no: string;
    product_id: string;
    pack_size_id: string;
    to_prod_status_id: string;
    from_prod_status_id: string;
    carton_type_id: string;
    carton_capacity_id: string;
    no_of_cartons: number;
    no_of_packs: number;
    no_of_sachets: number;
    remarks: string;
    entered_by_user_id: string;
    entered_date_time: string;
    approval_remarks: string;
    approved_by_user_id: string;
    approved_date_time: string;
    status: 'E' | 'A' | 'X';
    movement_type?: 'NORMAL' | 'SPECIAL_A' | 'SPECIAL_R';
}

interface StockOption {
    batch_no: string;
    product_id: string;
    pack_size_id: string;
    product_status_id: string;
    total_no_of_packs: number;
}

interface TransitionOption {
    _id: string;
    product_status_id: string;
    from_product_status_id: string;
    sterilization_required: string;
    approval_required: string;
    active: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    E: { label: "Entered", color: "bg-yellow-100 text-yellow-800" },
    A: { label: "Approved", color: "bg-green-100 text-green-800" },
    X: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

function formatDateTime(date: string | Date): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    const hh    = String(d.getHours()).padStart(2, '0');
    const mm    = String(d.getMinutes()).padStart(2, '0');
    const ss    = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hh}:${mm}:${ss}`;
}

function formatMovementId(id: number): string {
    if (!id) return "-";
    const yy  = Math.floor(id / 100000);
    const sno = id % 100000;
    return `${yy}-${String(sno).padStart(5, '0')}`;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
    movement_date:      today(),
    batch_no:           "",
    product_id:         "",
    pack_size_id:       "",
    to_prod_status_id:  "",
    from_prod_status_id:"",
    carton_type_id:     "",
    carton_capacity_id: "",
    no_of_cartons:      "",
    no_of_packs:        "",
    no_of_sachets:      "",
    remarks:            "",
    entered_by_user_id: "ADMIN",    // TODO: replace with session user
    status:             "E" as 'E' | 'A' | 'X',
};

const emptyForm2 = {
    movement_date:       today(),
    adjustment_type:     "A" as "A" | "R",
    batch_no:            "",
    product_id:          "",
    pack_size_id:        "",
    to_prod_status_id:   "",
    from_prod_status_id: "",
    carton_type_id:      "",
    carton_capacity_id:  "",
    no_of_cartons:       "",
    no_of_packs:         "",
    no_of_sachets:       "",
    remarks:             "",
    entered_by_user_id:  "ADMIN",
    status:              "E" as "E" | "A" | "X",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function ProductMovementsPage() {
    // ── list state ────────────────────────────────────────────────────────────
    const [records, setRecords]           = useState<ProductMovementRecord[]>([]);
    const [loading, setLoading]           = useState(true);
    const [saving, setSaving]             = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [searchQuery, setSearchQuery]   = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterProduct, setFilterProduct] = useState<string>("all");

    // ── modal state ───────────────────────────────────────────────────────────
    const [isAddModalOpen, setIsAddModalOpen]       = useState(false);
    const [isEditModalOpen, setIsEditModalOpen]     = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord]       = useState<ProductMovementRecord | null>(null);

    // ── form state (Movement1) ────────────────────────────────────────────────
    const [formData, setFormData]                         = useState(emptyForm);
    const [formLoading, setFormLoading]                   = useState(false);
    const [productStocks, setProductStocks]               = useState<StockOption[]>([]);
    const [transitionOptions, setTransitionOptions]       = useState<TransitionOption[]>([]);
    const [cartonCapacityInfo, setCartonCapacityInfo]     = useState<any>(null);
    const [packSizeInfo, setPackSizeInfo]                 = useState<any>(null);
    const [maxCartons, setMaxCartons]                     = useState<number>(9999);
    const [minMovementDate, setMinMovementDate]           = useState<string>("");

    // ── form state (Movement2 – stock adjustment) ─────────────────────────────
    const [isAdd2ModalOpen, setIsAdd2ModalOpen]           = useState(false);
    const [form2Data, setForm2Data]                       = useState(emptyForm2);
    const [form2Loading, setForm2Loading]                 = useState(false);
    const [form2Error, setForm2Error]                     = useState<string | null>(null);
    const [saving2, setSaving2]                           = useState(false);
    const [adj2BatchOptions, setAdj2BatchOptions]         = useState<any[]>([]);
    const [adj2PackSizeOptions, setAdj2PackSizeOptions]   = useState<any[]>([]);
    const [adj2ToStatusOptions, setAdj2ToStatusOptions]   = useState<any[]>([]); // ProductStatusMaster records
    const [adj2CartonCapInfo, setAdj2CartonCapInfo]       = useState<any>(null);
    const [adj2PackSizeInfo, setAdj2PackSizeInfo]         = useState<any>(null);
    const [adj2MaxCartons, setAdj2MaxCartons]             = useState<number>(9999);

    // ── fetch list ────────────────────────────────────────────────────────────

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productMovementAPI.getAll(
                filterStatus !== "all" ? { status: filterStatus } : undefined
            );
            setRecords(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => { fetchMovements(); }, [fetchMovements]);

    // ── derived ───────────────────────────────────────────────────────────────

    const filteredRecords = records.filter((r) => {
        const matchesSearch =
            r.batch_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.prod_movement_id?.toString().includes(searchQuery);
        const matchesProduct = filterProduct === "all" || r.product_id === filterProduct;
        return matchesSearch && matchesProduct;
    });

    const uniqueProducts = Array.from(new Set(records.map((r) => r.product_id)));

    // ── prod_movement_id generation: YY + 5-digit running sno per year ────────

    const getNextId = (): number => {
        const yy     = new Date().getFullYear() % 100;   // 26 for 2026
        const prefix = yy * 100000;                       // 2600000
        const yearRecords = records.filter(r =>
            Math.floor(r.prod_movement_id / 100000) === yy
        );
        if (yearRecords.length === 0) return prefix + 1;
        return Math.max(...yearRecords.map(r => r.prod_movement_id)) + 1;
    };

    // ── min movement date: >= latest existing movement_date ───────────────────

    const computeMinDate = (): string => {
        if (records.length === 0) return "";
        let maxMs = 0;
        for (const r of records) {
            const ms = new Date(r.movement_date).getTime();
            if (ms > maxMs) maxMs = ms;
        }
        return maxMs ? new Date(maxMs).toISOString().slice(0, 10) : "";
    };

    // ── load available stock batches ──────────────────────────────────────────

    const loadStocks = async (): Promise<StockOption[]> => {
        const all = await productStockAPI.getAll();
        return (all as any[]).filter((s: any) => s.total_no_of_packs > 0);
    };

    // ── cascade: apply a transition (set carton + pack info) ─────────────────

    const applyTransition = async (
        transition: TransitionOption,
        stock: StockOption,
        noOfCartons: number,
    ) => {
        const newStatus: 'E' | 'A' = transition.approval_required === 'Y' ? 'E' : 'A';

        setFormData(prev => ({
            ...prev,
            to_prod_status_id:   transition.product_status_id,
            from_prod_status_id: transition.from_product_status_id || stock.product_status_id,
            status:              newStatus,
            carton_type_id:      "",
            carton_capacity_id:  "",
            no_of_packs:         "",
            no_of_sachets:       "",
        }));

        // carton_type_id from ProductStatusMaster (prod_status_id = to_prod_status_id)
        const prodStatus: any = await productStatusAPI.getById(transition.product_status_id);
        const cartonTypeId: string = prodStatus?.carton_type_id || "";

        setFormData(prev => ({ ...prev, carton_type_id: cartonTypeId }));
        if (!cartonTypeId) return;

        // carton_capacity from CartonCapacityMaster
        const [caps, ps] = await Promise.all([
            cartonCapacityAPI.getAll({
                productId:    stock.product_id,
                packSizeId:   stock.pack_size_id,
                cartonTypeId: cartonTypeId,
                active:       true,
            }),
            packSizeAPI.getById(stock.pack_size_id),
        ]);

        const cap: any     = (caps as any[])[0] || null;
        const packSize: any = ps || null;
        setCartonCapacityInfo(cap);
        setPackSizeInfo(packSize);

        setFormData(prev => ({ ...prev, carton_capacity_id: cap?.carton_capacity_id || "" }));

        if (cap && packSize) {
            const noPacks   = noOfCartons * cap.packs_per_carton;
            const noSachets = noPacks * packSize.qty_per_carton;
            setFormData(prev => ({
                ...prev,
                no_of_packs:   String(noPacks),
                no_of_sachets: String(noSachets),
            }));
        }
    };

    // ── cascade: batch selected ───────────────────────────────────────────────

    const handleBatchSelect = async (batchNo: string, stocks: StockOption[]) => {
        const stock = stocks.find(s => s.batch_no === batchNo);
        if (!stock) return;

        setFormData(prev => ({
            ...prev,
            batch_no:           batchNo,
            product_id:         stock.product_id,
            pack_size_id:       stock.pack_size_id,
            to_prod_status_id:  "",
            from_prod_status_id:"",
            carton_type_id:     "",
            carton_capacity_id: "",
            no_of_cartons:      String(stock.total_no_of_packs),
            no_of_packs:        "",
            no_of_sachets:      "",
            status:             "E",
        }));
        setMaxCartons(stock.total_no_of_packs);
        setTransitionOptions([]);
        setCartonCapacityInfo(null);
        setPackSizeInfo(null);

        setFormLoading(true);
        try {
            const [product, allTransitions] = await Promise.all([
                productAPI.getById(stock.product_id),
                productStatusTransitionAPI.getAll({ fromStatus: stock.product_status_id }),
            ]);

            const activeTransitions: TransitionOption[] = (allTransitions as any[]).filter(
                (t: any) => t.active !== false
            );

            // Try to match by sterilization_required; fall back to all active transitions
            const sterReq  = (product as any)?.sterilization_required;
            const sterChar = (sterReq === true || sterReq === 'Y') ? 'Y' : 'N';
            const bySterlization = activeTransitions.filter(
                (t: any) => t.sterilization_required === sterChar
            );
            const finalOptions = bySterlization.length > 0 ? bySterlization : activeTransitions;

            setTransitionOptions(finalOptions);

            if (finalOptions.length >= 1) {
                await applyTransition(finalOptions[0], stock, stock.total_no_of_packs);
            } else {
                setError(`No valid transitions found for batch ${batchNo} (current status: ${stock.product_status_id})`);
            }
        } finally {
            setFormLoading(false);
        }
    };

    // ── cascade: to_prod_status changed (when multiple options) ──────────────

    const handleTransitionChange = async (toStatusId: string) => {
        const transition = transitionOptions.find(t => t.product_status_id === toStatusId);
        if (!transition) return;
        const stock = productStocks.find(s => s.batch_no === formData.batch_no);
        if (!stock) return;
        const n = Number(formData.no_of_cartons) || stock.total_no_of_packs;
        setFormLoading(true);
        try {
            await applyTransition(transition, stock, n);
        } finally {
            setFormLoading(false);
        }
    };

    // ── cascade: no_of_cartons changed ───────────────────────────────────────

    const handleCartonsChange = (value: string) => {
        const n = Number(value) || 0;
        let noPacks   = "";
        let noSachets = "";
        if (cartonCapacityInfo && packSizeInfo) {
            const packs = n * cartonCapacityInfo.packs_per_carton;
            noPacks   = String(packs);
            noSachets = String(packs * packSizeInfo.qty_per_carton);
        }
        setFormData(prev => ({
            ...prev,
            no_of_cartons: value,
            no_of_packs:   noPacks,
            no_of_sachets: noSachets,
        }));
    };

    // ── open Add modal ────────────────────────────────────────────────────────

    // ── Movement2: open modal ─────────────────────────────────────────────────

    const handleOpenAdd2 = async () => {
        setForm2Data({ ...emptyForm2, movement_date: today() });
        setForm2Error(null);
        setAdj2BatchOptions([]);
        setAdj2PackSizeOptions([]);
        setAdj2ToStatusOptions([]);
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);
        setAdj2MaxCartons(9999);
        setForm2Loading(true);
        try {
            // Default to 'A' – load Add Stock data
            const [batches, toStatuses] = await Promise.all([
                transactionAPI.getAll(),
                productStatusAPI.getAll({ movementType: 'N' }),
            ]);
            const validBatches = (batches as any[]).filter(
                (b: any) => b.current_batch_status_id === 'W' || b.current_batch_status_id === 'C'
            );
            setAdj2BatchOptions(validBatches);
            setAdj2ToStatusOptions(toStatuses as any[]);
        } finally {
            setForm2Loading(false);
        }
        setIsAdd2ModalOpen(true);
    };

    // ── Movement2: adjustment type changed ────────────────────────────────────

    const handleAdj2TypeChange = async (adjType: "A" | "R") => {
        setForm2Data({ ...emptyForm2, movement_date: form2Data.movement_date, adjustment_type: adjType });
        setAdj2BatchOptions([]);
        setAdj2PackSizeOptions([]);
        setAdj2ToStatusOptions([]);
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);
        setAdj2MaxCartons(9999);
        setForm2Error(null);
        setForm2Loading(true);
        try {
            if (adjType === 'A') {
                const [batches, toStatuses] = await Promise.all([
                    transactionAPI.getAll(),
                    productStatusAPI.getAll({ movementType: 'N' }),
                ]);
                setAdj2BatchOptions(
                    (batches as any[]).filter(
                        (b: any) => b.current_batch_status_id === 'W' || b.current_batch_status_id === 'C'
                    )
                );
                setAdj2ToStatusOptions(toStatuses as any[]);
            } else {
                const [stocks, toStatuses] = await Promise.all([
                    productStockAPI.getAll(),
                    productStatusAPI.getAll({ movementType: 'S' }),
                ]);
                setAdj2BatchOptions((stocks as any[]).filter((s: any) => s.total_no_of_packs > 0));
                setAdj2ToStatusOptions(toStatuses as any[]);
            }
        } finally {
            setForm2Loading(false);
        }
    };

    // ── Movement2: batch selected ─────────────────────────────────────────────

    const handleAdj2BatchSelect = async (batchNo: string) => {
        const adjType = form2Data.adjustment_type;
        const batch   = adj2BatchOptions.find((b: any) => b.batch_no === batchNo);
        if (!batch) return;

        setForm2Data(prev => ({
            ...prev,
            batch_no:            batchNo,
            product_id:          batch.product_id,
            pack_size_id:        "",
            to_prod_status_id:   "",
            from_prod_status_id: "",
            carton_type_id:      "",
            carton_capacity_id:  "",
            no_of_cartons:       "",
            no_of_packs:         "",
            no_of_sachets:       "",
        }));
        setAdj2PackSizeOptions([]);
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);

        setForm2Loading(true);
        try {
            if (adjType === 'A') {
                // Pack sizes from CartonCapacityMaster for the product
                const caps = await cartonCapacityAPI.getAll({ productId: batch.product_id, active: true });
                const uniquePackSizes = Array.from(
                    new Map((caps as any[]).map((c: any) => [c.pack_size_id, c])).values()
                );
                setAdj2PackSizeOptions(uniquePackSizes);
            } else {
                // Pack sizes from ProductStock matching batch + product where packs > 0
                const stocks = await productStockAPI.getAll({ batchNo, productId: batch.product_id } as any);
                const validStocks = (stocks as any[]).filter((s: any) => s.total_no_of_packs > 0);
                setAdj2PackSizeOptions(validStocks.map((s: any) => ({ pack_size_id: s.pack_size_id })));
                if (validStocks.length === 1) {
                    await handleAdj2PackSizeSelect(validStocks[0].pack_size_id, batch.product_id, validStocks[0]);
                }
            }
        } finally {
            setForm2Loading(false);
        }
    };

    // ── Movement2: pack size selected ─────────────────────────────────────────

    const handleAdj2PackSizeSelect = async (packSizeId: string, _productIdArg?: string, stockArg?: any) => {
        const adjType = form2Data.adjustment_type;

        setForm2Data(prev => ({
            ...prev,
            pack_size_id:        packSizeId,
            to_prod_status_id:   "",
            from_prod_status_id: "",
            carton_type_id:      "",
            carton_capacity_id:  "",
            no_of_cartons:       "",
            no_of_packs:         "",
            no_of_sachets:       "",
        }));
        setAdj2CartonCapInfo(null);
        setAdj2PackSizeInfo(null);

        if (adjType === 'R') {
            // from_prod_status_id comes from ProductStock
            const stock = stockArg ?? (adj2BatchOptions as any[]).find(
                (s: any) => s.batch_no === form2Data.batch_no && s.pack_size_id === packSizeId
            );
            if (stock) {
                setAdj2MaxCartons(stock.total_no_of_packs);
                setForm2Data(prev => ({
                    ...prev,
                    pack_size_id:        packSizeId,
                    from_prod_status_id: stock.product_status_id,
                    no_of_cartons:       String(stock.total_no_of_packs),
                }));
            }
        }
    };

    // ── Movement2: to_prod_status selected ───────────────────────────────────

    const handleAdj2ToStatusSelect = async (toStatusId: string) => {
        const adjType   = form2Data.adjustment_type;
        const productId = form2Data.product_id;
        const packSizeId = form2Data.pack_size_id;

        const toStatusRecord = adj2ToStatusOptions.find((s: any) => s.prod_status_id === toStatusId);
        const cartonTypeId   = toStatusRecord?.carton_type_id || "";

        setForm2Data(prev => ({
            ...prev,
            to_prod_status_id:  toStatusId,
            carton_type_id:     cartonTypeId,
            carton_capacity_id: "",
            no_of_packs:        "",
            no_of_sachets:      "",
        }));

        if (!productId || !packSizeId) return;

        setForm2Loading(true);
        try {
            // Fetch transition matching to_prod_status_id to get approval_required + from_prod_status_id
            const allTransitions = await productStatusTransitionAPI.getAll();
            const matchedTrans   = (allTransitions as any[]).find(
                (t: any) => t.product_status_id === toStatusId
            );
            const approvalRequired = matchedTrans?.approval_required;
            const newStatus: 'E' | 'A' = approvalRequired === 'Y' ? 'E' : 'A';

            if (adjType === 'A' && matchedTrans) {
                setForm2Data(prev => ({
                    ...prev,
                    from_prod_status_id: matchedTrans.from_product_status_id,
                    status: newStatus,
                }));
            } else {
                // 'R': from_prod_status_id already set from stock, only update status
                setForm2Data(prev => ({ ...prev, status: newStatus }));
            }

            // Load carton capacity + pack size info
            const [caps, ps] = await Promise.all([
                cartonCapacityAPI.getAll({ productId, packSizeId, active: true }),
                packSizeAPI.getById(packSizeId),
            ]);
            const cap: any = (caps as any[])[0] || null;
            setAdj2CartonCapInfo(cap);
            setAdj2PackSizeInfo(ps || null);
            setForm2Data(prev => ({ ...prev, carton_capacity_id: cap?.carton_capacity_id || "" }));

            // Recalculate packs/sachets from current no_of_cartons
            const n = Number(form2Data.no_of_cartons) || 0;
            if (cap && ps && n > 0) {
                const noPacks   = n * cap.packs_per_carton;
                const noSachets = noPacks * (ps as any).qty_per_carton;
                setForm2Data(prev => ({
                    ...prev,
                    no_of_packs:   String(noPacks),
                    no_of_sachets: String(noSachets),
                }));
            }
        } finally {
            setForm2Loading(false);
        }
    };

    // ── Movement2: cartons changed ────────────────────────────────────────────

    const handleAdj2CartonsChange = (value: string) => {
        const n = Number(value) || 0;
        let noPacks = "", noSachets = "";
        if (adj2CartonCapInfo && adj2PackSizeInfo) {
            const p = n * adj2CartonCapInfo.packs_per_carton;
            noPacks   = String(p);
            noSachets = String(p * adj2PackSizeInfo.qty_per_carton);
        }
        setForm2Data(prev => ({ ...prev, no_of_cartons: value, no_of_packs: noPacks, no_of_sachets: noSachets }));
    };

    // ── Movement2: submit ─────────────────────────────────────────────────────

    const handleSubmit2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving2(true);
        setForm2Error(null);
        try {
            const payload2 = {
                prod_movement_id:    getNextId(),
                movement_date:       form2Data.movement_date,
                batch_no:            form2Data.batch_no,
                product_id:          form2Data.product_id,
                pack_size_id:        form2Data.pack_size_id,
                to_prod_status_id:   form2Data.to_prod_status_id,
                from_prod_status_id: form2Data.from_prod_status_id,
                carton_type_id:      form2Data.carton_type_id,
                carton_capacity_id:  form2Data.carton_capacity_id,
                no_of_cartons:       Number(form2Data.no_of_cartons) || 0,
                no_of_packs:         Number(form2Data.no_of_packs),
                no_of_sachets:       Number(form2Data.no_of_sachets),
                remarks:             form2Data.remarks,
                entered_by_user_id:  form2Data.entered_by_user_id,
                entered_date_time:   new Date().toISOString(),
                approval_remarks:    "",
                approved_by_user_id: "",
                approved_date_time:  null,
                status:              form2Data.status,
                movement_type:       `SPECIAL_${form2Data.adjustment_type}` as 'SPECIAL_A' | 'SPECIAL_R',
            };
            await productMovementAPI.create(payload2);
            if (form2Data.status === 'A') await updateStockForMovement(payload2 as any);
            setIsAdd2ModalOpen(false);
            setForm2Data(emptyForm2);
            fetchMovements();
        } catch (err: any) {
            setForm2Error(err.message);
        } finally {
            setSaving2(false);
        }
    };

    const handleOpenAdd = async () => {
        setError(null);
        setFormData({ ...emptyForm, movement_date: today() });
        setTransitionOptions([]);
        setCartonCapacityInfo(null);
        setPackSizeInfo(null);
        setMaxCartons(9999);
        setMinMovementDate(computeMinDate());
        setFormLoading(true);
        try {
            const stocks = await loadStocks();
            setProductStocks(stocks);
        } finally {
            setFormLoading(false);
        }
        setIsAddModalOpen(true);
    };

    // ── open Edit modal ───────────────────────────────────────────────────────

    const handleEdit = (record: ProductMovementRecord) => {
        if (record.status !== 'E') return; // only allow editing Entered records
        setSelectedRecord(record);
        setFormData({
            movement_date:       record.movement_date?.slice(0, 10) || today(),
            batch_no:            record.batch_no,
            product_id:          record.product_id,
            pack_size_id:        record.pack_size_id,
            to_prod_status_id:   record.to_prod_status_id,
            from_prod_status_id: record.from_prod_status_id,
            carton_type_id:      record.carton_type_id,
            carton_capacity_id:  record.carton_capacity_id,
            no_of_cartons:       String(record.no_of_cartons ?? ""),
            no_of_packs:         String(record.no_of_packs ?? ""),
            no_of_sachets:       String(record.no_of_sachets ?? ""),
            remarks:             record.remarks || "",
            entered_by_user_id:  record.entered_by_user_id,
            status:              record.status,
        });
        setTransitionOptions([]);
        setCartonCapacityInfo(null);
        setPackSizeInfo(null);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;
        setSaving(true);
        setError(null);
        try {
            await productMovementAPI.update(selectedRecord.prod_movement_id, {
                movement_date:  formData.movement_date,
                no_of_cartons:  Number(formData.no_of_cartons) || 0,
                no_of_packs:    Number(formData.no_of_packs),
                no_of_sachets:  Number(formData.no_of_sachets),
                remarks:        formData.remarks,
            });
            setIsEditModalOpen(false);
            setSelectedRecord(null);
            fetchMovements();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── CRUD helpers ──────────────────────────────────────────────────────────

    // After saving/approving a movement with status='A', update ProductStock
    const updateStockForMovement = async (mv: {
        batch_no: string; product_id: string; pack_size_id: string;
        to_prod_status_id: string; from_prod_status_id: string;
        carton_type_id?: string; no_of_cartons?: number;
        no_of_packs: number; no_of_sachets: number;
    }) => {
        await Promise.all([
            // TO status: increment — upsert creates the record if it doesn't exist
            productStockAPI.adjust(mv.batch_no, {
                pack_size_id:        mv.pack_size_id,
                product_status_id:   mv.to_prod_status_id,
                packs_delta:         mv.no_of_packs,
                sachets_delta:       mv.no_of_sachets,
                product_id:          mv.product_id,
                carton_type_id:      mv.carton_type_id,
                total_no_of_cartons: mv.no_of_cartons,
            }),
            // FROM status: decrement existing record
            productStockAPI.adjust(mv.batch_no, {
                pack_size_id:      mv.pack_size_id,
                product_status_id: mv.from_prod_status_id,
                packs_delta:       -mv.no_of_packs,
                sachets_delta:     -mv.no_of_sachets,
                product_id:        mv.product_id,
            }),
        ]);
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                prod_movement_id:    getNextId(),
                movement_date:       formData.movement_date,
                batch_no:            formData.batch_no,
                product_id:          formData.product_id,
                pack_size_id:        formData.pack_size_id,
                to_prod_status_id:   formData.to_prod_status_id,
                from_prod_status_id: formData.from_prod_status_id,
                carton_type_id:      formData.carton_type_id,
                carton_capacity_id:  formData.carton_capacity_id,
                no_of_cartons:       Number(formData.no_of_cartons) || 0,
                no_of_packs:         Number(formData.no_of_packs),
                no_of_sachets:       Number(formData.no_of_sachets),
                remarks:             formData.remarks,
                entered_by_user_id:  formData.entered_by_user_id,
                entered_date_time:   new Date().toISOString(),
                approval_remarks:    "",
                approved_by_user_id: "",
                approved_date_time:  null,
                status:              formData.status,
                movement_type:       'NORMAL',
            };
            await productMovementAPI.create(payload);
            if (formData.status === 'A') await updateStockForMovement(payload as any);
            setIsAddModalOpen(false);
            setFormData(emptyForm);
            fetchMovements();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Approval handlers (Edit modal = Approval only for status='E') ─────────

    const [approvalRemarks, setApprovalRemarks] = useState("");
    const [approvalError, setApprovalError]     = useState<string | null>(null);

    const handleApprove = async () => {
        if (!selectedRecord) return;
        if (!approvalRemarks.trim()) { setApprovalError("Approval remarks are required."); return; }
        setSaving(true);
        setApprovalError(null);
        try {
            await productMovementAPI.update(selectedRecord.prod_movement_id, {
                status:              'A',
                approval_remarks:    approvalRemarks.trim(),
                approved_by_user_id: 'ADMIN',
                approved_date_time:  new Date().toISOString(),
            });
            await updateStockForMovement({
                batch_no:            selectedRecord.batch_no,
                product_id:          selectedRecord.product_id,
                pack_size_id:        selectedRecord.pack_size_id,
                to_prod_status_id:   selectedRecord.to_prod_status_id,
                from_prod_status_id: selectedRecord.from_prod_status_id,
                carton_type_id:      selectedRecord.carton_type_id,
                no_of_cartons:       selectedRecord.no_of_cartons,
                no_of_packs:         selectedRecord.no_of_packs,
                no_of_sachets:       selectedRecord.no_of_sachets,
            });
            setIsEditModalOpen(false);
            setSelectedRecord(null);
            setApprovalRemarks("");
            fetchMovements();
        } catch (err: any) {
            setApprovalError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelMovement = async () => {
        if (!selectedRecord) return;
        setSaving(true);
        setApprovalError(null);
        try {
            await productMovementAPI.update(selectedRecord.prod_movement_id, { status: 'X' });
            setIsEditModalOpen(false);
            setSelectedRecord(null);
            setApprovalRemarks("");
            fetchMovements();
        } catch (err: any) {
            setApprovalError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (record: ProductMovementRecord) => {
        setSelectedRecord(record);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedRecord) return;
        setSaving(true);
        setError(null);
        try {
            await productMovementAPI.delete(selectedRecord.prod_movement_id);
            setIsDeleteDialogOpen(false);
            setSelectedRecord(null);
            fetchMovements();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Form (shared by Add and Edit) ─────────────────────────────────────────

    const MovementForm = ({
        onSubmit,
        submitLabel,
        onClose,
        isEdit = false,
    }: {
        onSubmit: (e: React.FormEvent) => void;
        submitLabel: string;
        onClose: () => void;
        isEdit?: boolean;
    }) => {
        const displayId = isEdit
            ? formatMovementId(selectedRecord?.prod_movement_id ?? 0)
            : formatMovementId(getNextId());

        return (
            <form onSubmit={onSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">

                {formLoading && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                )}

                {/* 1. Movement ID (display) + Movement Date (entry) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Movement ID</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm font-mono">{displayId}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                            Movement Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={formData.movement_date}
                            min={minMovementDate}
                            onChange={(e) => setFormData(p => ({ ...p, movement_date: e.target.value }))}
                            required
                        />
                        {minMovementDate && (
                            <p className="text-xs text-muted-foreground mt-1">Must be ≥ {minMovementDate}</p>
                        )}
                    </div>
                </div>

                {/* 2. Batch No (dropdown / display) + Product ID (display) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                            Batch No. <span className="text-red-500">*</span>
                        </label>
                        {isEdit ? (
                            <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">{formData.batch_no}</div>
                        ) : (
                            <select
                                value={formData.batch_no}
                                onChange={(e) => handleBatchSelect(e.target.value, productStocks)}
                                required
                                disabled={formLoading}
                                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            >
                                <option value="">-- Select Batch --</option>
                                {productStocks.map(s => (
                                    <option key={s.batch_no} value={s.batch_no}>
                                        {s.batch_no} &nbsp;(Avail packs: {s.total_no_of_packs})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Product ID</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {formData.product_id || <span className="italic text-muted-foreground">Auto-filled from Batch</span>}
                        </div>
                    </div>
                </div>

                {/* 3. From Status (display) + To Status (dropdown or display) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">From Status</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {formData.from_prod_status_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                            To Status <span className="text-red-500">*</span>
                        </label>
                        {transitionOptions.length > 1 ? (
                            <select
                                value={formData.to_prod_status_id}
                                onChange={(e) => handleTransitionChange(e.target.value)}
                                required
                                disabled={formLoading}
                                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            >
                                <option value="">-- Select --</option>
                                {transitionOptions.map(t => (
                                    <option key={t._id} value={t.product_status_id}>{t.product_status_id}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                                {formData.to_prod_status_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Carton Type (display) + Carton Capacity (display) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Carton Type</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {formData.carton_type_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Carton Capacity</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {formData.carton_capacity_id
                                ? `${formData.carton_capacity_id}${cartonCapacityInfo?.packs_per_carton != null ? ` (${cartonCapacityInfo.packs_per_carton} packs/carton)` : ''}`
                                : <span className="italic text-muted-foreground">Auto-filled</span>}
                        </div>
                    </div>
                </div>

                {/* 5. No. of Cartons (entry, validated) + No. of Packs (display) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                            No. of Cartons <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            value={formData.no_of_cartons}
                            onChange={(e) => handleCartonsChange(e.target.value)}
                            min={1}
                            max={maxCartons}
                            placeholder={`1 – ${maxCartons}`}
                            required
                            disabled={!formData.carton_capacity_id || formLoading}
                        />
                        {maxCartons < 9999 && (
                            <p className="text-xs text-muted-foreground mt-1">Max: {maxCartons} (from stock)</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Packs</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {formData.no_of_packs
                                ? Number(formData.no_of_packs).toLocaleString()
                                : <span className="italic text-muted-foreground">Auto-calculated</span>}
                        </div>
                        {cartonCapacityInfo?.packs_per_carton != null && (
                            <p className="text-xs text-muted-foreground mt-1">
                                = cartons × {cartonCapacityInfo.packs_per_carton} packs/carton
                            </p>
                        )}
                    </div>
                </div>

                {/* 6. No. of Sachets (display) + Remarks (entry) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Sachets</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {formData.no_of_sachets
                                ? Number(formData.no_of_sachets).toLocaleString()
                                : <span className="italic text-muted-foreground">Auto-calculated</span>}
                        </div>
                        {packSizeInfo?.qty_per_carton != null && (
                            <p className="text-xs text-muted-foreground mt-1">
                                = packs × {packSizeInfo.qty_per_carton} sachets/pack
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Remarks</label>
                        <Input
                            value={formData.remarks}
                            onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                            placeholder="Optional"
                            maxLength={100}
                        />
                    </div>
                </div>

                {/* 7. Entered By (display) + Entered Date Time (display) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Entered By</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">{formData.entered_by_user_id}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Entered Date &amp; Time</label>
                        <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                            {isEdit
                                ? formatDateTime(selectedRecord?.entered_date_time ?? "")
                                : formatDateTime(new Date())}
                        </div>
                    </div>
                </div>

                {/* 8. Status (display – auto-determined by approval_required) */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Status</label>
                    <div className={`px-3 py-2 rounded-md border border-input text-sm font-medium inline-flex items-center gap-2 ${STATUS_LABELS[formData.status]?.color || ""}`}>
                        <span className="font-bold">{formData.status}</span>
                        &ndash;
                        {formData.status === 'E' ? 'Entered (Pending Approval)' :
                         formData.status === 'A' ? 'Active (No Approval Required)' :
                         formData.status === 'X' ? 'Cancelled' : ''}
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
                )}

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose} className="px-6" disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        disabled={saving || !formData.batch_no || !formData.to_prod_status_id}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        );
    };

    // ── Movement2Form (stock adjustment) ─────────────────────────────────────

    const Movement2Form = () => (
        <form onSubmit={handleSubmit2} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {form2Loading && (
                <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
            )}

            {/* Row 1: Movement ID + Movement Date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Movement ID</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm font-mono">{formatMovementId(getNextId())}</div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Movement Date <span className="text-red-500">*</span></label>
                    <Input type="date" value={form2Data.movement_date} onChange={e => setForm2Data(p => ({ ...p, movement_date: e.target.value }))} required />
                </div>
            </div>

            {/* Row 2: Adjustment Type */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Adjustment Type <span className="text-red-500">*</span></label>
                <select
                    value={form2Data.adjustment_type}
                    onChange={e => handleAdj2TypeChange(e.target.value as "A" | "R")}
                    disabled={form2Loading}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                    <option value="A">A – Add Stock</option>
                    <option value="R">R – Reduce Stock</option>
                </select>
            </div>

            {/* Row 3: Batch No + Product ID */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Batch No. <span className="text-red-500">*</span></label>
                    <select
                        value={form2Data.batch_no}
                        onChange={e => handleAdj2BatchSelect(e.target.value)}
                        required disabled={form2Loading || adj2BatchOptions.length === 0}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="">-- Select Batch --</option>
                        {adj2BatchOptions.map((b: any) => (
                            <option key={b.batch_no} value={b.batch_no}>
                                {b.batch_no}{b.total_no_of_packs != null ? ` (Packs: ${b.total_no_of_packs})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Product ID</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.product_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
            </div>

            {/* Row 4: Pack Size */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Pack Size <span className="text-red-500">*</span></label>
                {form2Data.adjustment_type === 'A' ? (
                    <select
                        value={form2Data.pack_size_id}
                        onChange={e => handleAdj2PackSizeSelect(e.target.value)}
                        required disabled={form2Loading || !form2Data.batch_no}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="">-- Select Pack Size --</option>
                        {adj2PackSizeOptions.map((p: any) => (
                            <option key={p.pack_size_id} value={p.pack_size_id}>{p.pack_size_id}</option>
                        ))}
                    </select>
                ) : (
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.pack_size_id || <span className="italic text-muted-foreground">Auto-filled from stock</span>}
                    </div>
                )}
            </div>

            {/* Row 5: To Status + From Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">To Status <span className="text-red-500">*</span></label>
                    <select
                        value={form2Data.to_prod_status_id}
                        onChange={e => handleAdj2ToStatusSelect(e.target.value)}
                        required disabled={form2Loading || !form2Data.pack_size_id}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="">-- Select --</option>
                        {adj2ToStatusOptions.map((s: any) => (
                            <option key={s.prod_status_id} value={s.prod_status_id}>
                                {s.prod_status_id} – {s.product_status}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">From Status</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.from_prod_status_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
            </div>

            {/* Row 6: Carton Type + Carton Capacity */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Carton Type</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.carton_type_id || <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Carton Capacity</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.carton_capacity_id
                            ? `${form2Data.carton_capacity_id}${adj2CartonCapInfo?.packs_per_carton != null ? ` (${adj2CartonCapInfo.packs_per_carton} packs/carton)` : ''}`
                            : <span className="italic text-muted-foreground">Auto-filled</span>}
                    </div>
                </div>
            </div>

            {/* Row 7: No. of Cartons + No. of Packs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Cartons <span className="text-red-500">*</span></label>
                    <Input
                        type="number"
                        value={form2Data.no_of_cartons}
                        onChange={e => handleAdj2CartonsChange(e.target.value)}
                        min={1} max={adj2MaxCartons}
                        placeholder={`1 – ${adj2MaxCartons}`}
                        required
                        disabled={!form2Data.carton_capacity_id || form2Loading}
                    />
                    {adj2MaxCartons < 9999 && (
                        <p className="text-xs text-muted-foreground mt-1">Max: {adj2MaxCartons} (from stock)</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Packs</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.no_of_packs ? Number(form2Data.no_of_packs).toLocaleString() : <span className="italic text-muted-foreground">Auto-calculated</span>}
                    </div>
                </div>
            </div>

            {/* Row 8: No. of Sachets + Remarks */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">No. of Sachets</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
                        {form2Data.no_of_sachets ? Number(form2Data.no_of_sachets).toLocaleString() : <span className="italic text-muted-foreground">Auto-calculated</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Remarks <span className="text-red-500">*</span></label>
                    <Input value={form2Data.remarks} onChange={e => setForm2Data(p => ({ ...p, remarks: e.target.value }))} placeholder="Required" maxLength={100} required />
                </div>
            </div>

            {/* Row 9: Entered By + Entered Date Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Entered By</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">{form2Data.entered_by_user_id}</div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Entered Date &amp; Time</label>
                    <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">{formatDateTime(new Date())}</div>
                </div>
            </div>

            {/* Row 10: Status */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Status</label>
                <div className={`px-3 py-2 rounded-md border border-input text-sm font-medium inline-flex items-center gap-2 ${STATUS_LABELS[form2Data.status]?.color || ""}`}>
                    <span className="font-bold">{form2Data.status}</span> &ndash;
                    {form2Data.status === 'E' ? 'Entered (Pending Approval)' : form2Data.status === 'A' ? 'Active (No Approval Required)' : 'Cancelled'}
                </div>
            </div>

            {form2Error && (
                <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">{form2Error}</p>
            )}

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsAdd2ModalOpen(false)} className="px-6" disabled={saving2}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                    disabled={saving2 || !form2Data.batch_no || !form2Data.to_prod_status_id || !form2Data.pack_size_id}
                >
                    {saving2 ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Movement
                </Button>
            </div>
        </form>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-auto lg:ml-64">
                <div className="p-4 md:p-6 lg:p-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 md:mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Product Movements</h1>
                                <p className="text-sm md:text-base text-muted-foreground">Monitor and manage internal product status movements</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    onClick={handleOpenAdd}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all flex-1 md:flex-none"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="whitespace-nowrap">Add Movement</span>
                                </Button>
                                {/* <Button
                                    onClick={handleOpenAdd2}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all flex-1 md:flex-none"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="whitespace-nowrap">Add Movement (Special)</span>
                                </Button> */}
                            </div>
                        </div>
                    </motion.div>


                    {/* Search / Filter bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-4 md:mb-6"
                    >
                        <Card className="p-3 md:p-4">
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                                <div className="flex-1 relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Batch No or Product ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 md:pl-10 pr-3 md:pr-4 py-2 w-full text-sm md:text-base"
                                    />
                                </div>
                                <span className="text-xs md:text-sm text-muted-foreground uppercase whitespace-nowrap">
                                    results: {filteredRecords.length} records
                                </span>
                                <div className="flex items-center gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 hover:text-foreground">
                                                <Filter className="w-4 h-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-4xl p-4" align="end">
                                            <div className="flex flex-wrap gap-6 items-start">
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-sm font-semibold">Status</Label>
                                                    <div className="flex flex-col gap-2">
                                                        {["all", "E", "A", "X"].map((s) => (
                                                            <div key={s} className="flex items-center space-x-2">
                                                                <input
                                                                    type="radio"
                                                                    id={`pm-status-${s}`}
                                                                    name="pmStatusFilter"
                                                                    checked={filterStatus === s}
                                                                    onChange={() => setFilterStatus(s)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`pm-status-${s}`} className="text-sm font-normal cursor-pointer">
                                                                    {s === "all" ? "All" : `${s} - ${STATUS_LABELS[s]?.label}`}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {uniqueProducts.length > 0 && (
                                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                                        <Label className="text-sm font-semibold">Product</Label>
                                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="radio"
                                                                    id="pm-product-all"
                                                                    name="pmProductFilter"
                                                                    checked={filterProduct === "all"}
                                                                    onChange={() => setFilterProduct("all")}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor="pm-product-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                            </div>
                                                            {uniqueProducts.map((prod) => (
                                                                <div key={prod} className="flex items-center space-x-2">
                                                                    <input
                                                                        type="radio"
                                                                        id={`pm-product-${prod}`}
                                                                        name="pmProductFilter"
                                                                        checked={filterProduct === prod}
                                                                        onChange={() => setFilterProduct(prod)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <Label htmlFor={`pm-product-${prod}`} className="text-sm font-normal cursor-pointer">{prod}</Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-end">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setFilterStatus("all"); setFilterProduct("all"); }}
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : error && records.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <p className="text-sm text-red-600">{error}</p>
                                    <Button variant="outline" size="sm" onClick={fetchMovements}>Retry</Button>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-100 border-b border-border">
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Movement ID</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Movement Date</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Batch No.</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Product ID</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Pack Size</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">To Status</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">From Status</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Carton Type</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Carton Capacity</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Cartons</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Packs</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-right text-foreground whitespace-nowrap">Sachets</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Remarks</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Entered By</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Entered Date &amp; Time</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Approval Remarks</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Approved By</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">Approved Date &amp; Time</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Type</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Status</th>
                                                    <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {filteredRecords.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={21} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                                            No product movements found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredRecords.map((record, index) => (
                                                        <motion.tr
                                                            key={record._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                                            className="hover:bg-muted/30 transition-colors"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-bold text-blue-600 font-mono">
                                                                    {formatMovementId(record.prod_movement_id)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-foreground">
                                                                {record.movement_date ? new Date(record.movement_date).toLocaleDateString() : "-"}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-foreground">{record.batch_no}</td>
                                                            <td className="px-6 py-4 text-sm font-bold text-foreground">{record.product_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.pack_size_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.to_prod_status_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.from_prod_status_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.carton_type_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.carton_capacity_id}</td>
                                                            <td className="px-6 py-4 text-sm text-right font-bold text-foreground">{record.no_of_cartons?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-sm text-right font-bold text-foreground">{record.no_of_packs?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-sm text-right font-bold text-foreground">{record.no_of_sachets?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.remarks}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.entered_by_user_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{formatDateTime(record.entered_date_time)}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.approval_remarks}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground">{record.approved_by_user_id}</td>
                                                            <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{formatDateTime(record.approved_date_time)}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                {record.movement_type === 'SPECIAL_A' && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Special Add</span>
                                                                )}
                                                                {record.movement_type === 'SPECIAL_R' && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Special Reduce</span>
                                                                )}
                                                                {(!record.movement_type || record.movement_type === 'NORMAL') && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Normal</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[record.status]?.color}`}>
                                                                    {STATUS_LABELS[record.status]?.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                                                                        disabled={record.status !== 'E'}
                                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-30"
                                                                        title={record.status !== 'E' ? 'Only Entered (E) records can be approved' : 'Approve / Cancel'}
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
                                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                        <span className="text-sm text-muted-foreground">
                                            {filteredRecords.length} of {records.length} records
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" disabled>Previous</Button>
                                            <Button variant="outline" size="sm" disabled>Next</Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </main>

            {/* ── Add Modal ─────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsAddModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add Product Movement</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                {MovementForm({
                                    onSubmit: handleSubmit,
                                    submitLabel: "Save Movement",
                                    onClose: () => setIsAddModalOpen(false),
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Edit Modal ────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isEditModalOpen && selectedRecord && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => { setIsEditModalOpen(false); setApprovalRemarks(""); setApprovalError(null); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Edit Movement</h2>
                                        <p className="text-amber-100 text-sm mt-0.5">{formatMovementId(selectedRecord.prod_movement_id)} — {selectedRecord.batch_no}</p>
                                    </div>
                                    <button onClick={() => { setIsEditModalOpen(false); setError(null); }} className="text-white hover:bg-amber-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                {MovementForm({
                                    onSubmit: handleEditSubmit,
                                    submitLabel: "Update Movement",
                                    onClose: () => { setIsEditModalOpen(false); setError(null); },
                                    isEdit: true,
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                                    <button onClick={() => setIsDeleteDialogOpen(false)} className="text-white hover:bg-red-700 rounded-lg p-2 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to delete movement{" "}
                                        <strong>{formatMovementId(selectedRecord?.prod_movement_id ?? 0)}</strong>{" "}
                                        (Batch: {selectedRecord?.batch_no})?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
                                    {error && (
                                        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
                                    )}
                                    <div className="flex items-center justify-end gap-4">
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>Cancel</Button>
                                        <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Add Movement 2 Modal (Stock Adjustment) ──────────────────────── */}
            <AnimatePresence>
                {isAdd2ModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsAdd2ModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                                <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Stock Adjustment</h2>
                                        <p className="text-green-100 text-sm mt-0.5">Add or reduce product stock</p>
                                    </div>
                                    <button onClick={() => setIsAdd2ModalOpen(false)} className="text-white hover:bg-green-700 rounded-lg p-2 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                {Movement2Form()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
