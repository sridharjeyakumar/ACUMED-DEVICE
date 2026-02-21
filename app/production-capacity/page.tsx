'use client';

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, Factory, ChevronDown, Scale, X } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface MachineRecord {
    id: string;
    machineId: string;
    machineName: string;
    section: string;
    shortName: string;
    qtyPerMin: number;
    uom: "NOS" | "PACKS" | "CARTONS";
    avgHrsPerDay: number;
    lastModifiedUserId?: string;
    lastModifiedDateTime?: string;
    active: boolean;
}

export default function ProductionCapacityPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelItemDialogOpen, setIsCancelItemDialogOpen] = useState(false);
    const [machineToCancel, setMachineToCancel] = useState<MachineRecord | null>(null);
    const [cancelledMachines, setCancelledMachines] = useState<Set<string>>(new Set());
    const [selectedMachine, setSelectedMachine] = useState<MachineRecord | null>(null);
    const [filterUom, setFilterUom] = useState<string>("all");
    const [filterSection, setFilterSection] = useState<string>("all");
    const [machines, setMachines] = useState<MachineRecord[]>([]);
    const [formData, setFormData] = useState({
        machineId: "",
        machineName: "",
        section: "",
        shortName: "",
        qtyPerMin: "",
        uom: "UNITS",
        avgHrsPerDay: "",
        active: true,
    });

    // Reset form data when Add modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            setFormData({
                machineId: "",
                machineName: "",
                section: "",
                shortName: "",
                qtyPerMin: "",
                uom: "UNITS",
                avgHrsPerDay: "",
                active: true,
            });
        }
    }, [isAddModalOpen]);
useEffect(() => {
    fetchMachines();
}, []);
const fetchMachines = async () => {
    try {
        const res = await fetch("/api/machinery");
        const data = await res.json();

        const formatted = data.map((m: any) => ({
            id: m._id,
            machineId: m.machine_id,
            machineName: m.machine_name,
            section: "",
            shortName: m.machine_short_name,
            qtyPerMin: m.prod_qty_per_minute,
            uom: m.uom,
            avgHrsPerDay: m.avg_prod_hrs_per_day,
            lastModifiedUserId: m.last_modified_user_id,
            lastModifiedDateTime: m.last_modified_date_time,
            active: m.active,
        }));

        setMachines(formatted);
    } catch (error) {
        console.error("Failed to fetch machines", error);
    }
};

    const filteredMachines = machines.filter((machine) => {
        const matchesSearch = machine.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            machine.machineId.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesUom = filterUom === "all" || machine.uom === filterUom;
        const matchesSection = filterSection === "all" || machine.section === filterSection;
        
        return matchesSearch && matchesUom && matchesSection;
    });

    const uniqueUoms = Array.from(new Set(machines.map(m => m.uom)));
    const uniqueSections = Array.from(new Set(machines.map(m => m.section).filter(s => s)));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        await fetch("/api/machinery", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        await fetchMachines(); // refresh table
        setIsAddModalOpen(false);
    } catch (error) {
        console.error("Error saving machine:", error);
    }
};



    const handleEdit = (machine: MachineRecord) => {
        setSelectedMachine(machine);
        setFormData({
            machineId: machine.machineId,
            machineName: machine.machineName,
            section: machine.section,
            shortName: machine.shortName,
            qtyPerMin: machine.qtyPerMin.toString(),
            uom: machine.uom,
            avgHrsPerDay: machine.avgHrsPerDay.toString(),
            active: machine.active !== undefined ? machine.active : true,
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditModalOpen(false);
        setSelectedMachine(null);
        setFormData({
            machineId: "",
            machineName: "",
            section: "",
            shortName: "",
            qtyPerMin: "",
            uom: "UNITS",
            avgHrsPerDay: "",
            active: true,
        });
    };
   const handleCancel = (machine: MachineRecord) => {
        setMachineToCancel(machine);
        setIsCancelItemDialogOpen(true);
    };


   const confirmCancelItem = async () => {
    if (!machineToCancel) return;

    try {
        await fetch(`/api/machinery/${machineToCancel.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ active: false }),
        });

        await fetchMachines(); // refresh table

        setIsCancelItemDialogOpen(false);
        setMachineToCancel(null);
    } catch (error) {
        console.error("Cancel failed:", error);
    }
};


    const getUomBadgeStyle = (uom: string) => {
        switch (uom) {
            case "UNITS":
                return "bg-blue-50 text-blue-700 border-blue-100";
            case "PACKS":
                return "bg-purple-50 text-purple-700 border-purple-100";
            case "CARTONS":
                return "bg-orange-50 text-orange-700 border-orange-100";
            default:
                return "bg-gray-100 text-gray-700";
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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Production Machinery Master</h1>
                                <p className="text-muted-foreground">Configure and manage manufacturing line throughput and operational parameters</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Machinery
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
                                        placeholder="Search by Machine ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    SHOWING {filteredMachines.length > 0 ? 1 : 0}-{filteredMachines.length} OF {filteredMachines.length}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="hover:text-foreground">
                                            <Filter className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56" align="end">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold">Unit of Measure</Label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    <div className="flex items-center space-x-2">
                                                        <input 
                                                            type="radio" 
                                                            id="uom-all" 
                                                            name="uomFilter"
                                                            checked={filterUom === "all"}
                                                            onChange={() => setFilterUom("all")}
                                                            className="h-4 w-4"
                                                        />
                                                        <Label htmlFor="uom-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                    </div>
                                                    {uniqueUoms.map((uom) => (
                                                        <div key={uom} className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id={`uom-${uom}`} 
                                                                name="uomFilter"
                                                                checked={filterUom === uom}
                                                                onChange={() => setFilterUom(uom)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor={`uom-${uom}`} className="text-sm font-normal cursor-pointer">{uom}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {uniqueSections.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold">Section</Label>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="radio" 
                                                                id="section-all" 
                                                                name="sectionFilter"
                                                                checked={filterSection === "all"}
                                                                onChange={() => setFilterSection("all")}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label htmlFor="section-all" className="text-sm font-normal cursor-pointer">All</Label>
                                                        </div>
                                                        {uniqueSections.map((section) => (
                                                            <div key={section} className="flex items-center space-x-2">
                                                                <input 
                                                                    type="radio" 
                                                                    id={`section-${section}`} 
                                                                    name="sectionFilter"
                                                                    checked={filterSection === section}
                                                                    onChange={() => setFilterSection(section)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <Label htmlFor={`section-${section}`} className="text-sm font-normal cursor-pointer">{section}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => {
                                                    setFilterUom("all");
                                                    setFilterSection("all");
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
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
  <tr className="bg-gray-100 border-b border-border">
    <th className="px-6 py-3 text-sm font-semibold text-left whitespace-nowrap">
      Machine ID
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left whitespace-nowrap">
      Machine Name
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left whitespace-nowrap">
      Machine Short Name
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center whitespace-nowrap">
      Production Quantity per Minute
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center whitespace-nowrap">
      UOM
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center whitespace-nowrap">
      Average Production Hours per Day
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left whitespace-nowrap">
      Last Modified User ID
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left whitespace-nowrap">
      Last Modified Date & Time
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-left whitespace-nowrap">
      Active
    </th>
    <th className="px-6 py-3 text-sm font-semibold text-center whitespace-nowrap">
      Actions
    </th>
  </tr>
</thead>
                                 <tbody className="divide-y divide-border">
  {filteredMachines.map((machine, index) => {
    const isActive = machine.active === true;

    return (
      <motion.tr
        key={machine.machineId}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="hover:bg-muted/30 transition-colors"
      >
        {/* MACHINE ID */}
        <td className="px-6 py-4 text-sm">
          <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono text-xs">
            {machine.machineId}
          </span>
        </td>

        {/* MACHINE NAME */}
        <td className="px-6 py-4 text-sm ">
          {machine.machineName ?? "-"}
        </td>

        {/* SHORT NAME */}
        <td className="px-6 py-4 text-sm">
          {machine.shortName ?? "-"}
        </td>

        {/* PRODUCTION QTY PER MIN */}
        <td className="px-6 py-4 text-sm text-center font-semibold">
          {machine.qtyPerMin ?? "-"}
        </td>

        {/* UOM */}
        <td className="px-6 py-4 text-sm text-center font-semibold">
          {machine.uom ?? "-"}
        </td>

        {/* AVG HOURS PER DAY */}
        <td className="px-6 py-4 text-sm text-center font-semibold">
          {machine.avgHrsPerDay ?? "-"}
        </td>

        {/* LAST MODIFIED USER */}
        <td className="px-6 py-4 text-sm">
          {machine.lastModifiedUserId ?? "-"}
        </td>

        {/* LAST MODIFIED DATE */}
        <td className="px-6 py-4 text-sm">
          {machine.lastModifiedDateTime
            ? (machine.lastModifiedDateTime)
            : "-"}
        </td>

        {/* ACTIVE STATUS */}
        <td className="px-6 py-4">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
              isActive
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isActive ? "ACTIVE" : "CANCELLED"}
          </span>
        </td>

        {/* ACTIONS */}
        <td className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2">

            <Button
              variant="ghost"
              size="sm"
              disabled={!isActive}
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) return;
                handleEdit(machine);
              }}
              className={`${
                isActive
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <Pencil className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={!isActive}
              onClick={(e) => {
                e.stopPropagation();
                if (!isActive) return;
                handleCancel(machine);
              }}
              className={`${
                isActive
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <X className="w-4 h-4" />
            </Button>

          </div>
        </td>
      </motion.tr>
    );
  })}
</tbody>
                                </table>
                            </div>

                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 3</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs">Previous</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 bg-blue-50">Next</Button>
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
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Add New Machinery</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Machine Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Machine Information
                                            </h3>
                                        </div>

                                        {/* Machine ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="machineId" 
                                                value={formData.machineId} 
                                                onChange={handleInputChange} 
                                                placeholder="MAC-XXX" 
                                                required 
                                            />
                                        </div>

                                        {/* Machine Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="machineName" 
                                                value={formData.machineName} 
                                                onChange={handleInputChange} 
                                                placeholder="Enter machine name"
                                                required 
                                            />
                                        </div>

                                        {/* Section / Area */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Section / Area
                                            </label>
                                            <Input 
                                                name="section" 
                                                value={formData.section} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. SECTION A - PLASTIC COMPONENT" 
                                            />
                                        </div>

                                        {/* Short Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Short Name
                                            </label>
                                            <Input 
                                                name="shortName" 
                                                value={formData.shortName} 
                                                onChange={handleInputChange} 
                                                placeholder="SHORT-CODE" 
                                            />
                                        </div>

                                        {/* Capacity Details Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Capacity Details
                                            </h3>
                                        </div>

                                        {/* Prod Qty / Min */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Prod Qty / Min
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="qtyPerMin" 
                                                value={formData.qtyPerMin} 
                                                onChange={handleInputChange} 
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                UOM
                                            </label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="UNITS">UNITS</option>
                                                <option value="PACKS">PACKS</option>
                                                <option value="CARTONS">CARTONS</option>
                                                <option value="NOS">NOS</option>
                                            </select>
                                        </div>

                                        {/* Avg Prod Hrs/Day */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Avg Prod Hrs/Day
                                            </label>
                                            <Input 
                                                type="number" 
                                                step="0.5" 
                                                name="avgHrsPerDay" 
                                                value={formData.avgHrsPerDay} 
                                                onChange={handleInputChange} 
                                                placeholder="0.0"
                                            />
                                        </div>

                                        {/* Status Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Status
                                            </h3>
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_add"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_add" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Save Machinery
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                                    <h2 className="text-2xl font-bold">Edit Machinery</h2>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Machine Information Section */}
                                        <div className="col-span-2">
                                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Machine Information
                                            </h3>
                                        </div>

                                        {/* Machine ID */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="machineId" 
                                                value={formData.machineId} 
                                                onChange={handleInputChange} 
                                                disabled
                                            />
                                        </div>

                                        {/* Machine Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Machine Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                name="machineName" 
                                                value={formData.machineName} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>

                                        {/* Section / Area */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Section / Area
                                            </label>
                                            <Input 
                                                name="section" 
                                                value={formData.section} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. SECTION A - PLASTIC COMPONENT" 
                                            />
                                        </div>

                                        {/* Short Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Short Name
                                            </label>
                                            <Input 
                                                name="shortName" 
                                                value={formData.shortName} 
                                                onChange={handleInputChange} 
                                                placeholder="SHORT-CODE" 
                                            />
                                        </div>

                                        {/* Capacity Details Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Capacity Details
                                            </h3>
                                        </div>

                                        {/* Prod Qty / Min */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Prod Qty / Min
                                            </label>
                                            <Input 
                                                type="number" 
                                                name="qtyPerMin" 
                                                value={formData.qtyPerMin} 
                                                onChange={handleInputChange} 
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                UOM
                                            </label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="UNITS">UNITS</option>
                                                <option value="PACKS">PACKS</option>
                                                <option value="CARTONS">CARTONS</option>
                                                <option value="NOS">NOS</option>
                                            </select>
                                        </div>

                                        {/* Avg Prod Hrs/Day */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                Avg Prod Hrs/Day
                                            </label>
                                            <Input 
                                                type="number" 
                                                step="0.5" 
                                                name="avgHrsPerDay" 
                                                value={formData.avgHrsPerDay} 
                                                onChange={handleInputChange} 
                                                placeholder="0.0"
                                            />
                                        </div>

                                        {/* Status Section */}
                                        <div className="col-span-2 mt-4">
                                            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b pb-2">
                                                Status
                                            </h3>
                                        </div>

                                        {/* Active */}
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="active_edit"
                                                name="active"
                                                checked={formData.active}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="active_edit" className="text-sm font-semibold text-foreground">
                                                Active
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                                            Update Machinery
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCancelItemDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsCancelItemDialogOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                                <div className={`${cancelledMachines.has(machineToCancel?.id || '') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 flex items-center justify-between`}>
                                    <h2 className="text-xl font-bold">
                                        {cancelledMachines.has(machineToCancel?.id || '') ? "Restore Machine" : "Cancel Machine"}
                                    </h2>
                                    <button
                                        onClick={() => setIsCancelItemDialogOpen(false)}
                                        className="text-white hover:opacity-80 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <p className="text-foreground mb-4">
                                        Are you sure you want to {cancelledMachines.has(machineToCancel?.id || '') ? 'restore' : 'cancel'} <strong>{machineToCancel?.machineName}</strong>?
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {cancelledMachines.has(machineToCancel?.id || '') 
                                            ? "This will restore the machine and set its active status to true."
                                            : "This will cancel the machine and set its active status to false."}
                                    </p>

                                    <div className="flex items-center justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsCancelItemDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmCancelItem}
                                            className={`${cancelledMachines.has(machineToCancel?.id || '') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                        >
                                            {cancelledMachines.has(machineToCancel?.id || '') ? "Restore" : "Cancel"}
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



