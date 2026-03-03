'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Search, Plus, Filter, Pencil, ChevronLeft, ChevronRight, X, Play, Pause, CheckCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { cartonCapacityAPI, packSizeAPI, productAPI, transactionAPI, productionPlanDetailAPI } from "@/services/api";

interface Transaction {
    _id?: string;
    batch_no: string;
    product_id: string;
    month_year: string;
    planned_start_date?: Date;
    planned_end_date?: Date;
    actual_start_date?: Date;
    actual_end_date?: Date;
    planned_total_sachets?: number;
    planned_total_sterilization_cartons?: number;
    planned_total_shipper_cartons?: number;
    actual_total_sachets?: number;
    actual_total_sterilization_cartons?: number;
    actual_total_shipper_cartons?: number;
    total_rejected_qty_kg?: number;
    remarks?: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    current_batch_event_type_id?: string;
    current_batch_status_id: 'P' | 'R' | 'W' | 'C';
    createdAt?: string;
    updatedAt?: string;
}

interface Product {
    product_id: string;
    product_name: string;
    product_shortname: string;
    uom: string;
    product_category_id?: string;
    product_spec?: string;
    weight_per_piece?: number;
    weight_uom?: string;
    wipes_per_kg?: number;
    shelf_life_in_months?: number;
    storage_condition?: string;
    safety_stock_qty?: number;
    default_pack_size_id?: string;
    batch_prefix?: string;
    running_batch_sno?: number;
    product_image?: string;
    product_image_icon?: string;
    qc_required?: boolean;
    coa_checklist_id?: string;
    sterilization_required?: boolean;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}

interface CartonCapacityRecord {
    id: string;
    carton_capacity_id: string;
    carton_capacity_name: string;
    carton_capacity_shortname: string;
    product_id: string;
    pack_size_id: string;
    pack_matl_id: string;
    carton_type_id: string;
    carton_material_id: string;
    packs_per_carton: number;
    last_modified_user_id?: string;
    last_modified_date_time?: string;
    active: boolean;
}

interface PackSize {
    pack_size_id: string;
    pack_size_name: string;
    pack_size_short_name: string;
    qty_per_carton: number;
    uom: string;
    last_modified_user_id?: string;
    last_modified_date_time?: Date;
    active?: boolean;
}

interface ProductDetail {
    last_modified_date_time: any;
    last_modified_user_id: string;
    no_of_shipper_cartons: number;
    no_of_sterilization_cartons: number;
    sno?: number;
    packsize_id: string;
    no_of_packs: number;
    remarks: string;
    no_of_sachets: number;
    packs_per_steri_carton: number;
    sterilization_cartons: number;
    packs_per_shipper_carton: number;
    shipper_cartons: number;
    product_id?: string;
    batch_no?: string;
}

const statusConfig = {
    'P': { label: 'Planned', color: 'bg-blue-50 text-blue-600', icon: Play },
    'R': { label: 'Running', color: 'bg-green-50 text-green-600', icon: Play },
    'W': { label: 'Waiting', color: 'bg-yellow-50 text-yellow-600', icon: Pause },
    'C': { label: 'Completed', color: 'bg-gray-50 text-gray-600', icon: CheckCircle },
};

function formatDateTime(date: Date | string | undefined): string {
    if (!date) return "-";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function formatMonthYear(monthYear: string): string {
    if (!monthYear || monthYear.length !== 6) return monthYear;
    const year = monthYear.substring(0, 4);
    const month = monthYear.substring(4, 6);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export default function TransactionTablePage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    // Expanded rows state
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [batchDetails, setBatchDetails] = useState<Map<string, ProductDetail[]>>(new Map());
    const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
    
    // Edit Production Detail Modal States
    const [isEditDetailModalOpen, setIsEditDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<ProductDetail | null>(null);
    const [editingBatchNo, setEditingBatchNo] = useState<string>('');
    
    const [formData, setFormData] = useState({
        batch_no: "",
        product_id: "",
        month_year: "",
        planned_start_date: "",
        planned_end_date: "",
        actual_start_date: "",
        actual_end_date: "",
        // Planned totals (from product details)
        planned_total_sachets: "",
        planned_total_sterilization_cartons: "",
        planned_total_shipper_cartons: "",
        // Actual totals (user entry)
        actual_total_sachets: "",
        actual_total_sterilization_cartons: "",
        actual_total_shipper_cartons: "",
        total_rejected_qty_kg: "",
        remarks: "",
        current_batch_event_type_id: "NB",
        current_batch_status_id: "P" as 'P' | 'R' | 'W' | 'C',
    });
    
    const isSubmittingRef = useRef(false);
    const [lastAction, setLastAction] = useState<{ type: 'edit' | 'delete'; data: Transaction } | null>(null);
    const [isDuplicateBatch, setIsDuplicateBatch] = useState(false);
    const [duplicateMessage, setDuplicateMessage] = useState("");
    const [records, setRecords] = useState<CartonCapacityRecord[]>([]);
    const [packSizes, setPackSizes] = useState<PackSize[]>([]);
    
    // Product Detail States - Now inline
    const [showProductDetails, setShowProductDetails] = useState(false);
    const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
    const [currentProductDetail, setCurrentProductDetail] = useState({
        packsize_id: '',
        no_of_packs: '',
        remarks: ''
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                batch_no: "",
                product_id: "",
                month_year: "",
                planned_start_date: "",
                planned_end_date: "",
                actual_start_date: "",
                actual_end_date: "",
                planned_total_sachets: "",
                planned_total_sterilization_cartons: "",
                planned_total_shipper_cartons: "",
                actual_total_sachets: "",
                actual_total_sterilization_cartons: "",
                actual_total_shipper_cartons: "",
                total_rejected_qty_kg: "",
                remarks: "",
                current_batch_event_type_id: "NB",
                current_batch_status_id: "P",
            });
            setProductDetails([]);
            setCurrentProductDetail({
                packsize_id: '',
                no_of_packs: '',
                remarks: ''
            });
            setShowProductDetails(false);
            setIsDuplicateBatch(false);
            setDuplicateMessage("");
            setSelectedProduct(null);
        }
    }, [isAddModalOpen]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await productAPI.getAll();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products", error);
            }
        };
        loadProducts();
    }, []);

    useEffect(() => {
        const loadCartonCapacities = async () => {
            try {
                const data = await cartonCapacityAPI.getAll();
                setRecords(data);
            } catch (error) {
                console.error("Failed to load carton capacity records", error);
            }
        };
        loadCartonCapacities();
    }, []);

    useEffect(() => {
        const loadPackSizes = async () => {
            try {
                const data = await packSizeAPI.getAll();
                setPackSizes(data);
            } catch (error) {
                console.error("Failed to load pack size records", error);
            }
        };
        loadPackSizes();
    }, []);

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await transactionAPI.getAll();
            setTransactions(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load transactions",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const filteredTransactions = transactions.filter((item) => {
        const matchesSearch = 
            item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = filterStatus === "all" || item.current_batch_status_id === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, rowsPerPage]);

// Check for duplicate batch in the SAME month only
useEffect(() => {
    if (formData.batch_no && formData.month_year) {
        const exists = transactions.some(t => 
            t.month_year === formData.month_year && t.product_id === formData.product_id && 
            (selectedTransaction ? t._id !== selectedTransaction._id : true)
        );
        
        setIsDuplicateBatch(exists);
        if (exists) {
            setDuplicateMessage(`Batch ${formData.batch_no} already exists for ${formatMonthYear(formData.month_year)}`);
        } else {
            setDuplicateMessage("");
        }
    } else {
        setIsDuplicateBatch(false);
        setDuplicateMessage("");
    }
}, [formData.batch_no, formData.month_year, formData.product_id, transactions, selectedTransaction]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        if (name === 'batch_no') {
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Function to generate only current month and next two months
    const generateMonthYearOptions = () => {
        const options = [];
        const currentDate = new Date();
        
        for (let i = 0; i < 3; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            const value = `${year}${month.toString().padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short' });
            const label = `${monthName}-${year}`;
            
            options.push({ value, label });
        }
        
        return options;
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        const product = products.find(p => p.product_id === productId);
        setSelectedProduct(product || null);
        
        if (product && product.batch_prefix && product.running_batch_sno !== undefined) {
            const nextSno = String(product.running_batch_sno + 1).padStart(3, '0');
            const nextBatchNo = `${product.batch_prefix}${nextSno}`;
            
            setFormData(prev => ({
                ...prev,
                batch_no: nextBatchNo,
                product_id: productId,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                product_id: productId,
            }));
        }
    };

    const handleBatchNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        return;
    };

    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayDate = getTodayDateString();

    const getMinDateForEndDate = (startDate: string) => {
        if (!startDate) return todayDate;
        return startDate > todayDate ? startDate : todayDate;
    };

    // Product Detail Functions
    const calculateSachets = (detail: typeof currentProductDetail) => {
        if (!detail.packsize_id || !detail.no_of_packs) return 0;
        const packSize = packSizes.find(ps => ps.pack_size_id === detail.packsize_id);
        return packSize ? parseInt(detail.no_of_packs) * packSize.qty_per_carton : 0;
    };

    const getPacksPerCartonByType = (cartonType: string) => {
        if (!selectedProduct || !currentProductDetail.packsize_id) return 0;
        
        const capacityRecord = records.find(r => 
            r.product_id === selectedProduct.product_id && 
            r.pack_size_id === currentProductDetail.packsize_id && 
            r.carton_type_id === cartonType &&
            r.active === true
        );
        
        return capacityRecord ? capacityRecord.packs_per_carton : 0;
    };

    const calculateCartons = (cartonType: string) => {
        if (!currentProductDetail.no_of_packs || !currentProductDetail.packsize_id) return 0;
        
        const packsPerCarton = getPacksPerCartonByType(cartonType);
        if (packsPerCarton === 0) return 0;
        
        return Math.ceil(parseInt(currentProductDetail.no_of_packs) / packsPerCarton);
    };

    const getPackSizeName = (packsize_id: string) => {
        const packSize = packSizes.find(ps => ps.pack_size_id === packsize_id);
        return packSize ? `${packSize.pack_size_name} (${packSize.qty_per_carton} ${packSize.uom})` : '';
    };

    const handleProductDetailChange = (field: string, value: string) => {
        setCurrentProductDetail(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddProductDetail = () => {
        if (!currentProductDetail.packsize_id || !currentProductDetail.no_of_packs) {
            toast({
                title: "Validation Error",
                description: "Please select pack size and enter number of packs",
                variant: "destructive",
            });
            return;
        }

        const newDetail: ProductDetail = {
            packsize_id: currentProductDetail.packsize_id,
            no_of_packs: parseInt(currentProductDetail.no_of_packs),
            remarks: currentProductDetail.remarks,
            no_of_sachets: calculateSachets(currentProductDetail),
            packs_per_steri_carton: getPacksPerCartonByType('ST'),
            sterilization_cartons: calculateCartons('ST'),
            packs_per_shipper_carton: getPacksPerCartonByType('SH'),
            shipper_cartons: calculateCartons('SH'),
            no_of_shipper_cartons: 0,
            no_of_sterilization_cartons: 0,
            last_modified_user_id: "",
            last_modified_date_time: undefined
        };

        setProductDetails([...productDetails, newDetail]);
        setCurrentProductDetail({
            packsize_id: '',
            no_of_packs: '',
            remarks: ''
        });
        
        // Update only the planned totals in the main form
        updatePlannedTotals([...productDetails, newDetail]);
        
        toast({
            title: "Success",
            description: "Product detail added successfully",
        });
    };

    const removeProductDetail = (index: number) => {
        const updatedDetails = productDetails.filter((_, i) => i !== index);
        setProductDetails(updatedDetails);
        updatePlannedTotals(updatedDetails);
        
        toast({
            title: "Removed",
            description: "Product detail removed",
        });
    };

    const updatePlannedTotals = (details: ProductDetail[]) => {
        const totals = details.reduce((acc, detail) => ({
            planned_total_sachets: (acc.planned_total_sachets || 0) + (detail.no_of_sachets || 0),
            planned_total_sterilization_cartons: (acc.planned_total_sterilization_cartons || 0) + (detail.sterilization_cartons || 0),
            planned_total_shipper_cartons: (acc.planned_total_shipper_cartons || 0) + (detail.shipper_cartons || 0)
        }), { 
            planned_total_sachets: 0, 
            planned_total_sterilization_cartons: 0, 
            planned_total_shipper_cartons: 0 
        });

        setFormData(prev => ({
            ...prev,
            planned_total_sachets: totals.planned_total_sachets.toString(),
            planned_total_sterilization_cartons: totals.planned_total_sterilization_cartons.toString(),
            planned_total_shipper_cartons: totals.planned_total_shipper_cartons.toString()
        }));
    };

    // Toggle row expansion
    const toggleRowExpansion = async (batchNo: string) => {
        const newExpandedRows = new Set(expandedRows);
        
        if (expandedRows.has(batchNo)) {
            // Collapse row
            newExpandedRows.delete(batchNo);
            setExpandedRows(newExpandedRows);
        } else {
            // Expand row
            newExpandedRows.add(batchNo);
            setExpandedRows(newExpandedRows);
            
            // Load details if not already loaded
            if (!batchDetails.has(batchNo)) {
                try {
                    setLoadingDetails(prev => new Set(prev).add(batchNo));
                    const details = await productionPlanDetailAPI.getByBatchNo(batchNo);
                    setBatchDetails(prev => new Map(prev).set(batchNo, details));
                } catch (error: any) {
                    console.error('Error loading batch details:', error);
                    toast({
                        title: "Error",
                        description: error.message || "Failed to load batch details",
                        variant: "destructive",
                    });
                } finally {
                    setLoadingDetails(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(batchNo);
                        return newSet;
                    });
                }
            }
        }
    };
// Helper function to get packs per carton for a specific product and pack size
const getPacksPerCartonByTypeForProduct = (packsize_id: string, cartonType: string) => {
    if (!selectedProduct || !packsize_id) return 0;
    
    const capacityRecord = records.find(r => 
        r.product_id === selectedProduct.product_id && 
        r.pack_size_id === packsize_id && 
        r.carton_type_id === cartonType &&
        r.active === true
    );
    
    return capacityRecord ? capacityRecord.packs_per_carton : 0;
};
    // Edit detail handler - FIXED
// Edit detail handler - WITH STATUS CHECK
const handleEditDetail = (detail: ProductDetail, batchNo: string) => {
    // Find the batch to check its status
    const batch = transactions.find(t => t.batch_no === batchNo);
    
    // Prevent editing if status is not 'P'
    if (batch && batch.current_batch_status_id !== 'P') {
        toast({
            title: "Editing Disabled",
            description: `Cannot edit production details for batches with status "${statusConfig[batch.current_batch_status_id].label}"`,
            variant: "destructive",
        });
        return;
    }
    
    setSelectedDetail(detail);
    setEditingBatchNo(batchNo);
    
    // Find the product for this batch
    const product = products.find(p => p.product_id === batch?.product_id);
    setSelectedProduct(product || null);
    
    setCurrentProductDetail({
        packsize_id: detail.packsize_id,
        no_of_packs: detail.no_of_packs.toString(),
        remarks: detail.remarks || ''
    });
    setIsEditDetailModalOpen(true);
};

    // Update detail handler - FIXED
    const handleUpdateDetail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDetail || !editingBatchNo) return;
        
        try {
            // Calculate all the values based on current selections
            const updatedDetail = {
                ...selectedDetail,
                packsize_id: currentProductDetail.packsize_id,
                no_of_packs: parseInt(currentProductDetail.no_of_packs),
                remarks: currentProductDetail.remarks,
                no_of_sachets: calculateSachets(currentProductDetail),
                packs_per_steri_carton: getPacksPerCartonByType('ST'),
                sterilization_cartons: calculateCartons('ST'),
                packs_per_shipper_carton: getPacksPerCartonByType('SH'),
                shipper_cartons: calculateCartons('SH'),
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date()
            };

            await productionPlanDetailAPI.update(
                editingBatchNo, 
                selectedDetail.sno || 0, 
                updatedDetail
            );

            // Update local state
            const updatedDetails = batchDetails.get(editingBatchNo)?.map(d => 
                d.sno === selectedDetail.sno ? updatedDetail : d
            ) || [];
            
            setBatchDetails(new Map(batchDetails).set(editingBatchNo, updatedDetails));
            
            toast({
                title: "Success",
                description: "Production plan detail updated successfully",
            });
            
            setIsEditDetailModalOpen(false);
            setSelectedDetail(null);
            setEditingBatchNo('');
            setCurrentProductDetail({
                packsize_id: '',
                no_of_packs: '',
                remarks: ''
            });
            setSelectedProduct(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update production plan detail",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final duplicate check before submission
        if (formData.batch_no && formData.month_year) {
            const exists = transactions.some(t => 
                t.month_year === formData.month_year && t.product_id === formData.product_id
            );
            
            if (exists) {
                toast({
                    title: "Duplicate Batch",
                    description: `Batch ${formData.batch_no} already exists for ${formatMonthYear(formData.month_year)}.`,
                    variant: "destructive",
                });
                return;
            }
        }
        
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        
        try {
            // First, create the batch transaction with both planned and actual data
            const newBatch = await transactionAPI.create({
                batch_no: formData.batch_no.toUpperCase(),
                product_id: formData.product_id.toUpperCase(),
                month_year: formData.month_year,
                planned_start_date: formData.planned_start_date ? new Date(formData.planned_start_date) : undefined,
                planned_end_date: formData.planned_end_date ? new Date(formData.planned_end_date) : undefined,
                actual_start_date: formData.actual_start_date ? new Date(formData.actual_start_date) : undefined,
                actual_end_date: formData.actual_end_date ? new Date(formData.actual_end_date) : undefined,
                // Planned totals (from product details)
                planned_total_sachets: formData.planned_total_sachets ? parseInt(formData.planned_total_sachets) : undefined,
                planned_total_sterilization_cartons: formData.planned_total_sterilization_cartons ? parseInt(formData.planned_total_sterilization_cartons) : undefined,
                planned_total_shipper_cartons: formData.planned_total_shipper_cartons ? parseInt(formData.planned_total_shipper_cartons) : undefined,
                // Actual totals (user entry)
                actual_total_sachets: formData.actual_total_sachets ? parseInt(formData.actual_total_sachets) : undefined,
                actual_total_sterilization_cartons: formData.actual_total_sterilization_cartons ? parseInt(formData.actual_total_sterilization_cartons) : undefined,
                actual_total_shipper_cartons: formData.actual_total_shipper_cartons ? parseInt(formData.actual_total_shipper_cartons) : undefined,
                total_rejected_qty_kg: formData.total_rejected_qty_kg ? parseFloat(formData.total_rejected_qty_kg) : undefined,
                remarks: formData.remarks,
                current_batch_event_type_id: formData.current_batch_event_type_id,
                current_batch_status_id: formData.current_batch_status_id,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            
            console.log('Batch created successfully:', newBatch);
            
            // After successful batch creation, create all production plan details
            if (productDetails.length > 0) {
                const productionPlanDetails = productDetails.map((detail, index) => ({
                    batch_no: formData.batch_no.toUpperCase(),
                    sno: index + 1,
                    product_id: formData.product_id.toUpperCase(),
                    packsize_id: detail.packsize_id,
                    no_of_packs: detail.no_of_packs,
                    no_of_sachets: detail.no_of_sachets,
                    packs_per_steri_carton: detail.packs_per_steri_carton,
                    no_of_sterilization_cartons: detail.sterilization_cartons,
                    packs_per_shipper_carton: detail.packs_per_shipper_carton,
                    no_of_shipper_cartons: detail.shipper_cartons,
                    remarks: detail.remarks || '',
                    last_modified_user_id: "ADMIN",
                    last_modified_date_time: new Date(),
                }));

                console.log('Creating production plan details:', productionPlanDetails);
                
                try {
                    const result = await productionPlanDetailAPI.createMany(productionPlanDetails);
                    console.log('Production plan details created:', result);
                } catch (detailError: any) {
                    console.error('Error creating production plan details:', detailError);
                    // Show warning but don't fail the whole transaction
                    toast({
                        title: "Warning",
                        description: `Batch created but failed to save product details: ${detailError.message}`,
                        variant: "default",
                    });
                }
            }
            
            // Update the product's running_batch_sno
            if (selectedProduct) {
                const newSno = (selectedProduct.running_batch_sno || 0) + 1;
                
                await productAPI.update(selectedProduct.product_id, {
                    running_batch_sno: newSno,
                    last_modified_user_id: "ADMIN"
                });
                
                setProducts(prevProducts => 
                    prevProducts.map(p => 
                        p.product_id === selectedProduct.product_id 
                            ? { ...p, running_batch_sno: newSno } 
                            : p
                    )
                );
                
                setSelectedProduct(prev => prev ? { ...prev, running_batch_sno: newSno } : null);
            }
            
            toast({
                title: "Success",
                description: `Batch ${formData.batch_no} created successfully with ${productDetails.length} product detail${productDetails.length !== 1 ? 's' : ''}`,
            });
            
            setIsAddModalOpen(false);
            loadTransactions();
            
        } catch (error: any) {
            console.error('❌ Error in handleSubmit:', error);
            
            toast({
                title: "Error",
                description: error.message || "Failed to create batch",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setFormData({
            batch_no: transaction.batch_no,
            product_id: transaction.product_id,
            month_year: transaction.month_year,
            planned_start_date: transaction.planned_start_date ? new Date(transaction.planned_start_date).toISOString().split('T')[0] : "",
            planned_end_date: transaction.planned_end_date ? new Date(transaction.planned_end_date).toISOString().split('T')[0] : "",
            actual_start_date: transaction.actual_start_date ? new Date(transaction.actual_start_date).toISOString().split('T')[0] : "",
            actual_end_date: transaction.actual_end_date ? new Date(transaction.actual_end_date).toISOString().split('T')[0] : "",
            planned_total_sachets: transaction.planned_total_sachets?.toString() || "",
            planned_total_sterilization_cartons: transaction.planned_total_sterilization_cartons?.toString() || "",
            planned_total_shipper_cartons: transaction.planned_total_shipper_cartons?.toString() || "",
            actual_total_sachets: transaction.actual_total_sachets?.toString() || "",
            actual_total_sterilization_cartons: transaction.actual_total_sterilization_cartons?.toString() || "",
            actual_total_shipper_cartons: transaction.actual_total_shipper_cartons?.toString() || "",
            total_rejected_qty_kg: transaction.total_rejected_qty_kg?.toString() || "",
            remarks: transaction.remarks || "",
            current_batch_event_type_id: "NB", 
            current_batch_status_id: transaction.current_batch_status_id,
        });
        
        const product = products.find(p => p.product_id === transaction.product_id);
        setSelectedProduct(product || null);
        
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmittingRef.current) return;
        if (!selectedTransaction) return;
        isSubmittingRef.current = true;
        
        if (formData.batch_no && formData.month_year) {
            const exists = transactions.some(t => 
                t.product_id === formData.product_id && 
                t.month_year === formData.month_year &&
                t._id !== selectedTransaction._id
            );
            
            if (exists) {
                toast({
                    title: "Duplicate Batch",
                    description: `Batch ${formData.batch_no} already exists for ${formatMonthYear(formData.month_year)}.`,
                    variant: "destructive",
                });
                isSubmittingRef.current = false;
                return;
            }
        }
        
        const previousData = { ...selectedTransaction };
        
        try {
            await transactionAPI.update(selectedTransaction.batch_no, {
                product_id: formData.product_id.toUpperCase(),
                month_year: formData.month_year,
                planned_start_date: formData.planned_start_date ? new Date(formData.planned_start_date) : undefined,
                planned_end_date: formData.planned_end_date ? new Date(formData.planned_end_date) : undefined,
                actual_start_date: formData.actual_start_date ? new Date(formData.actual_start_date) : undefined,
                actual_end_date: formData.actual_end_date ? new Date(formData.actual_end_date) : undefined,
                planned_total_sachets: formData.planned_total_sachets ? parseInt(formData.planned_total_sachets) : undefined,
                planned_total_sterilization_cartons: formData.planned_total_sterilization_cartons ? parseInt(formData.planned_total_sterilization_cartons) : undefined,
                planned_total_shipper_cartons: formData.planned_total_shipper_cartons ? parseInt(formData.planned_total_shipper_cartons) : undefined,
                actual_total_sachets: formData.actual_total_sachets ? parseInt(formData.actual_total_sachets) : undefined,
                actual_total_sterilization_cartons: formData.actual_total_sterilization_cartons ? parseInt(formData.actual_total_sterilization_cartons) : undefined,
                actual_total_shipper_cartons: formData.actual_total_shipper_cartons ? parseInt(formData.actual_total_shipper_cartons) : undefined,
                total_rejected_qty_kg: formData.total_rejected_qty_kg ? parseFloat(formData.total_rejected_qty_kg) : undefined,
                remarks: formData.remarks,
                current_batch_event_type_id: formData.current_batch_event_type_id,
                current_batch_status_id: formData.current_batch_status_id,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            
            setLastAction({ type: 'edit', data: previousData });
            
            toast({
                title: "Success",
                description: "Batch updated successfully",
                action: (
                    <ToastAction altText="Undo" onClick={handleUndo}>
                        Undo
                    </ToastAction>
                ),
            });
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
            loadTransactions();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update batch",
                variant: "destructive",
            });
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        
        try {
            await transactionAPI.update(lastAction.data.batch_no, {
                product_id: lastAction.data.product_id,
                month_year: lastAction.data.month_year,
                planned_start_date: lastAction.data.planned_start_date,
                planned_end_date: lastAction.data.planned_end_date,
                actual_start_date: lastAction.data.actual_start_date,
                actual_end_date: lastAction.data.actual_end_date,
                planned_total_sachets: lastAction.data.planned_total_sachets,
                planned_total_sterilization_cartons: lastAction.data.planned_total_sterilization_cartons,
                planned_total_shipper_cartons: lastAction.data.planned_total_shipper_cartons,
                actual_total_sachets: lastAction.data.actual_total_sachets,
                actual_total_sterilization_cartons: lastAction.data.actual_total_sterilization_cartons,
                actual_total_shipper_cartons: lastAction.data.actual_total_shipper_cartons,
                total_rejected_qty_kg: lastAction.data.total_rejected_qty_kg,
                remarks: lastAction.data.remarks,
                current_batch_event_type_id: lastAction.data.current_batch_event_type_id,
                current_batch_status_id: lastAction.data.current_batch_status_id,
                last_modified_user_id: "ADMIN",
                last_modified_date_time: new Date(),
            });
            toast({
                title: "Undone",
                description: "Changes have been reverted",
            });
            setLastAction(null);
            loadTransactions();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to undo action",
                variant: "destructive",
            });
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Batch Transaction Table</h1>
                                <p className="text-muted-foreground">Monitor and manage manufacturing batches</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Transaction
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
                                        placeholder="Search by Batch No, Product ID, or Remarks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredTransactions.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredTransactions.length)} OF {filteredTransactions.length}
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
                                                <Label className="text-sm font-semibold text-foreground">Status</Label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="status-all" 
                                                            name="statusFilter"
                                                            checked={filterStatus === "all"}
                                                            onChange={() => setFilterStatus("all")}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor="status-all" className="text-sm font-normal cursor-pointer text-foreground">All</Label>
                                                    </div>
                                                    {Object.entries(statusConfig).map(([key, config]) => (
                                                        <div key={key} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`status-${key}`}
                                                                name="statusFilter"
                                                                checked={filterStatus === key}
                                                                onChange={() => setFilterStatus(key)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <Label htmlFor={`status-${key}`} className="text-sm font-normal cursor-pointer text-foreground">
                                                                {config.label}
                                                            </Label>
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
                                                onClick={() => {
                                                    setFilterStatus("all");
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
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-300">
                                            <th className="px-2 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap w-10">
                                                <span className="sr-only">Expand</span>
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Batch No
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Product ID
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Month-Year
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned Start Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned End Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual Start Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual End Date
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned Sachets
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned Steri.
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Planned Shipper
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual Sachets
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual Steri.
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Actual Shipper
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Rejected (KG)
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Remarks
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-left text-foreground whitespace-nowrap">
                                                Last Modified
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                Current Batch Event Type ID
                                            </th>
                                            <th className="px-6 py-3 text-sm font-semibold text-center text-foreground whitespace-nowrap">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={19} className="px-6 py-4 text-center text-muted-foreground">
                                                    Loading batches...
                                                </td>
                                            </tr>
                                        ) : filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={19} className="px-6 py-4 text-center text-muted-foreground">
                                                    No batches found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedTransactions.map((item, index) => {
                                                const StatusIcon = statusConfig[item.current_batch_status_id].icon;
                                                const isExpanded = expandedRows.has(item.batch_no);
                                                const details = batchDetails.get(item.batch_no) || [];
                                                const isLoading = loadingDetails.has(item.batch_no);
                                                
                                                return (
                                                    <>
                                                        <motion.tr
                                                            key={item._id || item.batch_no}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                                            className="hover:bg-muted/30 transition-colors"
                                                        >
                                                            <td className="px-2 py-4 align-middle text-center">
                                                                <button
                                                                    onClick={() => toggleRowExpansion(item.batch_no)}
                                                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                                                    disabled={isLoading}
                                                                >
                                                                    {isLoading ? (
                                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : isExpanded ? (
                                                                        <ChevronUp className="w-4 h-4 text-gray-600" />
                                                                    ) : (
                                                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                                                    )}
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4 align-middle">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
                                                                    {item.batch_no}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 align-middle">
                                                                <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-mono text-xs">
                                                                    {item.product_id}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-foreground align-middle">
                                                                {formatMonthYear(item.month_year)}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {formatDateTime(item.planned_start_date)}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {formatDateTime(item.planned_end_date)}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {formatDateTime(item.actual_start_date)}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {formatDateTime(item.actual_end_date)}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.planned_total_sachets || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.planned_total_sterilization_cartons || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.planned_total_shipper_cartons || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.actual_total_sachets || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.actual_total_sterilization_cartons || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.actual_total_shipper_cartons || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs font-mono">
                                                                {item.total_rejected_qty_kg || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {item.remarks || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {item.last_modified_date_time ? formatDateTime(item.last_modified_date_time) : "N/A"}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-xs">
                                                                {item.current_batch_event_type_id || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle">
                                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig[item.current_batch_status_id].color}`}>
                                                                    <StatusIcon className="w-3 h-3" />
                                                                    {statusConfig[item.current_batch_status_id].label}
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                        
                                                        {/* Expanded Row with Production Details */}
                                                       {/* Expanded Row with Production Details - WITH STATUS CHECK */}
{isExpanded && (
    <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-gray-50"
    >
        <td colSpan={19} className="px-6 py-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {details.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No production plan details found for this batch.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Batch.No</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">S.No</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Product ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Pack Size ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">No .of Packs</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">No .of Sachets</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">No .of Packs Per Steri Carton</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">No. of sterilization cartons</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">No .Of Packs Per Shipper Carton</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">No. of shipper cartons</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Remarks</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Last Modified User ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Last Modified Date & Time</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {details.map((detail, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm">{detail.batch_no}</td>
                                        <td className="px-4 py-2 text-sm">{detail.sno || idx + 1}</td>
                                        <td className="px-4 py-2 text-sm">{detail.product_id}</td>
                                        <td className="px-4 py-2 text-sm">{detail.packsize_id}</td>
                                        <td className="px-4 py-2 text-sm font-mono">{detail.no_of_packs}</td>
                                        <td className="px-4 py-2 text-sm font-mono">{detail.no_of_sachets}</td>
                                        <td className="px-4 py-2 text-sm">{detail.packs_per_steri_carton}</td>
                                        <td className="px-4 py-2 text-sm font-mono">{detail.no_of_sterilization_cartons}</td>
                                        <td className="px-4 py-2 text-sm">{detail.packs_per_shipper_carton}</td>
                                        <td className="px-4 py-2 text-sm font-mono">{detail.no_of_shipper_cartons}</td>
                                        <td className="px-4 py-2 text-sm">{detail.remarks || '-'}</td>
                                        <td className="px-4 py-2 text-sm font-mono">{detail.last_modified_user_id}</td>
                                        <td className="px-4 py-2 text-sm font-mono">{formatDateTime(detail.last_modified_date_time)}</td>
                                        <td className="px-4 py-2 text-sm">
                                            {item.current_batch_status_id === 'P' ? (
                                                <button
                                                    onClick={() => handleEditDetail(detail, item.batch_no)}
                                                    className="text-blue-600 hover:text-blue-800 mr-2"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <span 
                                                    className="text-gray-300 cursor-not-allowed inline-block"
                                                    title={`Editing disabled - Batch status is ${statusConfig[item.current_batch_status_id].label}`}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Status indicator for the batch */}
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                            <span className="font-medium">Batch Status:</span>{' '}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusConfig[item.current_batch_status_id].color}`}>
                                {statusConfig[item.current_batch_status_id].label}
                            </span>
                            {item.current_batch_status_id !== 'P' && (
                                <span className="ml-2 text-amber-600">
                                    ⚠️ Editing is only allowed when status is Planned
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </td>
    </motion.tr>
)}
                                                    </>
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
                        <p className="text-xs text-muted-foreground mt-1">
                            Real-time Data Sync • ACUMED Manufacturing Cloud v4.2
                        </p>
                    </motion.div>
                </div>
            </main>

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
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
                <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#3b82f6] p-2 rounded-lg text-white shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#1e293b]">Production Plan Entry</h1>
                                <p className="text-sm text-slate-400 font-medium">Manufacturing Execution System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setIsAddModalOpen(false)} 
                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                onClick={handleSubmit}
                                className="bg-[#3b82f6] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmittingRef.current || isDuplicateBatch}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                {isSubmittingRef.current ? 'Creating...' : 'Save Plan'}
                            </button>
                          
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* MAIN CARDS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* 1. PLAN INFORMATION */}
                            <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="bg-blue-50 text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">i</span>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Plan Information</h2>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Product <span className="text-red-500">*</span></label>
                                        <select
                                            name="product_id"
                                            value={formData.product_id}
                                            onChange={handleProductChange}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            required
                                        >
                                            <option value="">Select Product Master</option>
                                            {products.map((p) => (
                                                <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Batch No. <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.batch_no || ''}
                                                readOnly
                                                placeholder="Auto-generated"
                                                className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed"
                                            />
                                            <svg className="w-4 h-4 absolute right-4 top-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        {isDuplicateBatch && (
                                            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                {duplicateMessage}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Month Year <span className="text-red-500">*</span></label>
                                        <select
                                            name="month_year"
                                            value={formData.month_year}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                            required
                                        >
                                            <option value="">Select Month-Year</option>
                                            {generateMonthYearOptions().map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. SCHEDULE */}
                            <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="text-blue-500">📅</span>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Schedule</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Planned Start</label>
                                        <input
                                            type="date"
                                            name="planned_start_date"
                                            value={formData.planned_start_date}
                                            onChange={handleInputChange}
                                            min={todayDate}
                                            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Planned End</label>
                                        <input
                                            type="date"
                                            name="planned_end_date"
                                            value={formData.planned_end_date}
                                            onChange={handleInputChange}
                                            min={getMinDateForEndDate(formData.planned_start_date)}
                                            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Actual Start</label>
                                        <div className="bg-[#f1f5f9] border border-slate-200 rounded-xl py-2 text-sm text-slate-400">
                                            {formData.actual_start_date || '--'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Actual End</label>
                                        <div className="bg-[#f1f5f9] border border-slate-200 rounded-xl py-2 text-sm text-slate-400">
                                            {formData.actual_end_date || '--'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Enter remarks..."
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm min-h-[80px] resize-none outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* 3. PRODUCTION SUMMARY */}
                            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-500">📊</span>
                                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Production Summary</h2>
                                    </div>
                                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase border border-blue-100">
                                        Real-time Auto-calculated
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    <div className="bg-[#f8fafc] p-4 rounded-xl">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Sachets</span>
                                        <span className="text-2xl font-black text-slate-800 ">
                                            {/* {productDetails.reduce((sum, d) => sum + (d.no_of_sachets || 0), 0)} */}0
                                        </span>
                                    </div>
                                    <div className="bg-[#f8fafc] p-4 rounded-xl">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Steriliz. Cartons</span>
                                        <span className="text-2xl font-black text-slate-800">
                                            {/* {productDetails.reduce((sum, d) => sum + (d.sterilization_cartons || 0), 0)} */}0
                                        </span>
                                    </div>
                                    <div className="bg-[#f8fafc] p-4 rounded-xl">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shipper Cartons</span>
                                        <span className="text-2xl font-black text-slate-800">
                                            {/* {productDetails.reduce((sum, d) => sum + (d.shipper_cartons || 0), 0)} */}0
                                        </span>
                                    </div>
                                    <div className="bg-[#fffbeb] p-4 rounded-xl border border-amber-100">
                                        <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Rejected Qty (KG)</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="total_rejected_qty_kg"
                                            value={formData.total_rejected_qty_kg}
                                            onChange={handleInputChange}
                                            className="text-2xl font-black text-amber-700 bg-transparent w-full outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Current Event Type ID</label>
                                        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-500">
                                            {formData.current_batch_event_type_id || 'NB (New Batch)'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Batch Status ID</label>
                                        <div className="bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-slate-500 uppercase">P - PLANNED</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Plan Details Section */}
                        <div className="mt-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-500">📋</span>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Product Plan Details</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newDetail: ProductDetail = {
                                            packsize_id: '',
                                            no_of_packs: 0,
                                            remarks: '',
                                            no_of_sachets: 0,
                                            packs_per_steri_carton: 0,
                                            sterilization_cartons: 0,
                                            packs_per_shipper_carton: 0,
                                            shipper_cartons: 0,
                                            no_of_shipper_cartons: 0,
                                            no_of_sterilization_cartons: 0,
                                            last_modified_user_id: "ADMIN",
                                            last_modified_date_time: new Date()
                                        };
                                        setProductDetails([...productDetails, newDetail]);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add New Row
                                </button>
                            </div>

                            {/* Inline Editable Table */}
                            {productDetails.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Sno</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Pack Size *</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Packs *</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Sachets</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Steri/Pack</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Steri Cartons</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Shipper/Pack</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Shipper Cartons</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Remarks</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {productDetails.map((detail, index) => {
                                                const selectedPackSize = packSizes.find(ps => ps.pack_size_id === detail.packsize_id);
                                                
                                                return (
                                                    <tr key={index} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-sm font-mono">{index + 1}</td>
                                                        
                                                        {/* Pack Size */}
                                                        <td className="px-4 py-3">
                                                            {detail.packsize_id ? (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        {selectedPackSize?.pack_size_name || detail.packsize_id}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newDetails = [...productDetails];
                                                                            newDetails[index] = {
                                                                                ...detail,
                                                                                packsize_id: '',
                                                                                packs_per_steri_carton: 0,
                                                                                packs_per_shipper_carton: 0,
                                                                                no_of_sachets: 0,
                                                                                sterilization_cartons: 0,
                                                                                shipper_cartons: 0
                                                                            };
                                                                            setProductDetails(newDetails);
                                                                            updatePlannedTotals(newDetails);
                                                                        }}
                                                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                                                        title="Change pack size"
                                                                    >
                                                                        <Pencil className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    value={detail.packsize_id || ''}
                                                                    onChange={(e) => {
                                                                        const newDetails = [...productDetails];
                                                                        const newPackSizeId = e.target.value;
                                                                        const newSelectedPackSize = packSizes.find(ps => ps.pack_size_id === newPackSizeId);
                                                                        
                                                                        const steriPerPack = getPacksPerCartonByTypeForProduct(newPackSizeId, 'ST');
                                                                        const shipperPerPack = getPacksPerCartonByTypeForProduct(newPackSizeId, 'SH');
                                                                        
                                                                        const packs = detail.no_of_packs || 0;
                                                                        const sachets = newSelectedPackSize ? packs * newSelectedPackSize.qty_per_carton : 0;
                                                                        const steriCartons = steriPerPack > 0 ? Math.ceil(packs / steriPerPack) : 0;
                                                                        const shipperCartons = shipperPerPack > 0 ? Math.ceil(packs / shipperPerPack) : 0;
                                                                        
                                                                        newDetails[index] = {
                                                                            ...detail,
                                                                            packsize_id: newPackSizeId,
                                                                            packs_per_steri_carton: steriPerPack,
                                                                            packs_per_shipper_carton: shipperPerPack,
                                                                            no_of_sachets: sachets,
                                                                            sterilization_cartons: steriCartons,
                                                                            shipper_cartons: shipperCartons
                                                                        };
                                                                        
                                                                        setProductDetails(newDetails);
                                                                        updatePlannedTotals(newDetails);
                                                                    }}
                                                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                                                                >
                                                                    <option value="">Select Pack Size</option>
                                                                    {packSizes.map((size) => (
                                                                        <option key={size.pack_size_id} value={size.pack_size_id}>
                                                                            {size.pack_size_name} ({size.qty_per_carton} {size.uom})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </td>
                                                        
                                                        {/* No. of Packs */}
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={detail.no_of_packs || ''}
                                                                onChange={(e) => {
                                                                    const newDetails = [...productDetails];
                                                                    const packs = parseInt(e.target.value) || 0;
                                                                    
                                                                    const sachets = selectedPackSize ? packs * selectedPackSize.qty_per_carton : 0;
                                                                    const steriCartons = detail.packs_per_steri_carton > 0 ? 
                                                                        Math.ceil(packs / detail.packs_per_steri_carton) : 0;
                                                                    const shipperCartons = detail.packs_per_shipper_carton > 0 ? 
                                                                        Math.ceil(packs / detail.packs_per_shipper_carton) : 0;
                                                                    
                                                                    newDetails[index] = {
                                                                        ...detail,
                                                                        no_of_packs: packs,
                                                                        no_of_sachets: sachets,
                                                                        sterilization_cartons: steriCartons,
                                                                        shipper_cartons: shipperCartons
                                                                    };
                                                                    setProductDetails(newDetails);
                                                                    updatePlannedTotals(newDetails);
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        
                                                        {/* Calculated fields */}
                                                        <td className="px-4 py-3 text-sm font-mono bg-slate-50">{detail.no_of_sachets || 0}</td>
                                                        <td className="px-4 py-3 text-sm bg-slate-50">{detail.packs_per_steri_carton || 0}</td>
                                                        <td className="px-4 py-3 text-sm font-mono bg-slate-50">{detail.sterilization_cartons || 0}</td>
                                                        <td className="px-4 py-3 text-sm bg-slate-50">{detail.packs_per_shipper_carton || 0}</td>
                                                        <td className="px-4 py-3 text-sm font-mono bg-slate-50">{detail.shipper_cartons || 0}</td>
                                                        
                                                        {/* Remarks */}
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="text"
                                                                value={detail.remarks || ''}
                                                                onChange={(e) => {
                                                                    const newDetails = [...productDetails];
                                                                    newDetails[index] = {
                                                                        ...detail,
                                                                        remarks: e.target.value
                                                                    };
                                                                    setProductDetails(newDetails);
                                                                }}
                                                                placeholder="Remarks"
                                                                maxLength={100}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                            />
                                                        </td>
                                                        
                                                        {/* Delete Action */}
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newDetails = productDetails.filter((_, i) => i !== index);
                                                                    setProductDetails(newDetails);
                                                                    updatePlannedTotals(newDetails);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                                title="Delete row"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-3">No product details added yet</p>
                         
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    )}
</AnimatePresence>

            {/* Edit Batch Modal */}
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
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Batch</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch No <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="batch_no"
                                                value={formData.batch_no}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product Name <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="product_id"
                                                value={formData.product_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select a product</option>
                                                {products.map((product) => (
                                                    <option key={product.product_id} value={product.product_id}>
                                                        {product.product_name} ({product.product_id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Month-Year <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="month_year"
                                                value={formData.month_year}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select Month-Year</option>
                                                {generateMonthYearOptions().map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {isDuplicateBatch && (
                                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                                    <X className="w-3 h-3" /> {duplicateMessage}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="planned_start_date"
                                                value={formData.planned_start_date}
                                                onChange={handleInputChange}
                                                min={todayDate}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned End Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="planned_end_date"
                                                value={formData.planned_end_date}
                                                onChange={handleInputChange}
                                                min={getMinDateForEndDate(formData.planned_start_date)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="actual_start_date"
                                                value={formData.actual_start_date}
                                                onChange={handleInputChange}
                                                min={todayDate}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual End Date
                                            </label>
                                            <Input
                                                type="date"
                                                name="actual_end_date"
                                                value={formData.actual_end_date}
                                                onChange={handleInputChange}
                                                min={getMinDateForEndDate(formData.actual_start_date)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned Sachets
                                            </label>
                                            <Input
                                                type="number"
                                                name="planned_total_sachets"
                                                value={formData.planned_total_sachets}
                                                onChange={handleInputChange}
                                                max={99999999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned Steri. Cartons
                                            </label>
                                            <Input
                                                type="number"
                                                name="planned_total_sterilization_cartons"
                                                value={formData.planned_total_sterilization_cartons}
                                                onChange={handleInputChange}
                                                max={99999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Planned Shipper Cartons
                                            </label>
                                            <Input
                                                type="number"
                                                name="planned_total_shipper_cartons"
                                                value={formData.planned_total_shipper_cartons}
                                                onChange={handleInputChange}
                                                max={99999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual Sachets
                                            </label>
                                            <Input
                                                type="number"
                                                name="actual_total_sachets"
                                                value={formData.actual_total_sachets}
                                                onChange={handleInputChange}
                                                max={99999999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual Steri. Cartons
                                            </label>
                                            <Input
                                                type="number"
                                                name="actual_total_sterilization_cartons"
                                                value={formData.actual_total_sterilization_cartons}
                                                onChange={handleInputChange}
                                                max={99999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Actual Shipper Cartons
                                            </label>
                                            <Input
                                                type="number"
                                                name="actual_total_shipper_cartons"
                                                value={formData.actual_total_shipper_cartons}
                                                onChange={handleInputChange}
                                                max={99999}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Rejected Qty (KG)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                name="total_rejected_qty_kg"
                                                value={formData.total_rejected_qty_kg}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Event Type ID
                                            </label>
                                            <Input
                                                name="current_batch_event_type_id"
                                                value={formData.current_batch_event_type_id}
                                                onChange={handleInputChange}
                                                maxLength={2}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="current_batch_status_id"
                                                value={formData.current_batch_status_id}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="P">Planned</option>
                                                <option value="R">Running</option>
                                                <option value="W">Waiting</option>
                                                <option value="C">Completed</option>
                                            </select>
                                        </div>

                                        <div className="col-span-3">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <Input
                                                name="remarks"
                                                value={formData.remarks}
                                                onChange={handleInputChange}
                                                maxLength={100}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button 
                                            type="submit" 
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6" 
                                            disabled={isSubmittingRef.current || isDuplicateBatch}
                                        >
                                            Update Batch
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Production Plan Detail Modal - FIXED with live calculations */}
            <AnimatePresence>
                {isEditDetailModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => {
                                setIsEditDetailModalOpen(false);
                                setSelectedProduct(null);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Edit Production Plan Detail</h2>
                                    <button
                                        onClick={() => {
                                            setIsEditDetailModalOpen(false);
                                            setSelectedProduct(null);
                                        }}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateDetail} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Batch No - Read Only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Batch No
                                            </label>
                                            <input
                                                type="text"
                                                value={editingBatchNo}
                                                readOnly
                                                disabled
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* Sno - Read Only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                S.No
                                            </label>
                                            <input
                                                type="number"
                                                value={selectedDetail?.sno || ''}
                                                readOnly
                                                disabled
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* Product ID - Read Only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Product ID
                                            </label>
                                            <input
                                                type="text"
                                                value={selectedDetail?.product_id || ''}
                                                readOnly
                                                disabled
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* Pack Size Selection */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Pack Size <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={currentProductDetail.packsize_id}
                                                onChange={(e) => handleProductDetailChange('packsize_id', e.target.value)}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select Pack Size</option>
                                                {packSizes.map((size) => (
                                                    <option key={size.pack_size_id} value={size.pack_size_id}>
                                                        {size.pack_size_name} ({size.qty_per_carton} {size.uom})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* No. of Packs */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No. of Packs <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={currentProductDetail.no_of_packs}
                                                onChange={(e) => handleProductDetailChange('no_of_packs', e.target.value)}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>

                                        {/* No. of Sachets - Display only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No. of Sachets <span className="text-gray-400 text-xs">(Auto-calculated)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={calculateSachets(currentProductDetail)}
                                                readOnly
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* No. of Packs per Steri Carton - Display only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No. of Packs per Steri Carton <span className="text-gray-400 text-xs">(From carton capacity)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={getPacksPerCartonByType('ST')}
                                                readOnly
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* No. of Sterilization Cartons - Display only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No. of Sterilization Cartons <span className="text-gray-400 text-xs">(Auto-calculated)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={calculateCartons('ST')}
                                                readOnly
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* No. of Packs per Shipper Carton - Display only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No. of Packs per Shipper Carton <span className="text-gray-400 text-xs">(From carton capacity)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={getPacksPerCartonByType('SH')}
                                                readOnly
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* No. of Shipper Cartons - Display only */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                No. of Shipper Cartons <span className="text-gray-400 text-xs">(Auto-calculated)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={calculateCartons('SH')}
                                                readOnly
                                                className="w-full px-3 py-2 border border-border rounded-md bg-gray-100 text-gray-600 text-sm"
                                            />
                                        </div>

                                        {/* Remarks */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Remarks
                                            </label>
                                            <input
                                                type="text"
                                                value={currentProductDetail.remarks}
                                                onChange={(e) => handleProductDetailChange('remarks', e.target.value)}
                                                placeholder="Enter remarks"
                                                maxLength={100}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                 

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditDetailModalOpen(false);
                                                setSelectedProduct(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Update Detail
                                        </button>
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