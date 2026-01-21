import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Pencil, Factory, ChevronDown, Scale } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MachineRecord {
    id: string;
    machineId: string;
    machineName: string;
    section: string;
    shortName: string;
    qtyPerMin: number;
    uom: "UNITS" | "PACKS" | "CARTONS";
    avgHrsPerDay: number;
}

const ProductionCapacity = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        machineId: "",
        machineName: "",
        section: "",
        shortName: "",
        qtyPerMin: "",
        uom: "UNITS",
        avgHrsPerDay: "",
    });

    const machines: MachineRecord[] = [
        {
            id: "1",
            machineId: "MAC-001",
            machineName: "High-Speed Injection Molding",
            section: "SECTION A - PLASTIC COMPONENT",
            shortName: "INJ-HS-01",
            qtyPerMin: 45,
            uom: "UNITS",
            avgHrsPerDay: 18.5,
        },
        {
            id: "2",
            machineId: "MAC-002",
            machineName: "Blister Packaging Line",
            section: "SECTION B - STERILE PACKING",
            shortName: "BLIST-PKG-02",
            qtyPerMin: 120,
            uom: "PACKS",
            avgHrsPerDay: 16.0,
        },
        {
            id: "3",
            machineId: "MAC-003",
            machineName: "Automated Laser Cutter",
            section: "SECTION A - PRECISION TOOLS",
            shortName: "LSR-CUT-03",
            qtyPerMin: 12,
            uom: "UNITS",
            avgHrsPerDay: 20.0,
        },
        {
            id: "4",
            machineId: "MAC-004",
            machineName: "Carton Sealing Machine",
            section: "SECTION C - LOGISTIC READY",
            shortName: "CRT-SEAL-04",
            qtyPerMin: 5,
            uom: "CARTONS",
            avgHrsPerDay: 12.5,
        },
        {
            id: "5",
            machineId: "MAC-005",
            machineName: "Final Inspection Table",
            section: "SECTION B - QUALITY CONTROL",
            shortName: "QC-TAB-05",
            qtyPerMin: 15,
            uom: "UNITS",
            avgHrsPerDay: 14.0,
        },
    ];

    const filteredMachines = machines.filter((machine) =>
        machine.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.machineId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        setIsAddModalOpen(false);
        setFormData({
            machineId: "",
            machineName: "",
            section: "",
            shortName: "",
            qtyPerMin: "",
            uom: "UNITS",
            avgHrsPerDay: "",
        });
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
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Production Capacity Master</h1>
                                <p className="text-muted-foreground">Configure and manage manufacturing line throughput and operational parameters</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Capacity
                            </Button>
                        </div>
                    </motion.div>

                    <StatsCards />

                    {/* Search and Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-6"
                    >
                        <Card className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search Machine ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full bg-background border-border"
                                    />
                                </div>

                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <span className="text-sm font-medium">All UOM</span>
                                        <Scale className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-border mx-2"></div>

                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    SHOWING 1-5 OF 12 MACHINES
                                </span>

                                <div className="flex items-center gap-2 ml-auto">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                                        <Filter className="w-4 h-4" />
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MACHINE ID</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MACHINE NAME</th>
                                            <th className="text-left px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MACHINE SHORT NAME</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PROD QTY PER MINUTE</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UOM</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AVG PROD HRS PER DAY</th>
                                            <th className="text-center px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredMachines.map((machine, index) => (
                                            <motion.tr
                                                key={machine.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-6 text-sm font-bold text-blue-600 align-middle">
                                                    {machine.machineId}
                                                </td>
                                                <td className="px-6 py-6 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground mb-1">{machine.machineName}</span>
                                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{machine.section}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-foreground align-middle">
                                                    {machine.shortName}
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-middle">
                                                    {machine.qtyPerMin}
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getUomBadgeStyle(machine.uom)}`}>
                                                        {machine.uom}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm font-bold text-foreground text-center align-middle">
                                                    {machine.avgHrsPerDay}
                                                </td>
                                                <td className="px-6 py-6 text-center align-middle">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-white">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PAGE 1 OF 3</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs">Previous</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 bg-blue-50">Next</Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Footer */}
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

            {/* Add Capacity Modal */}
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
                                    <h2 className="text-2xl font-bold">Add New Capacity</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Machine ID <span className="text-red-500">*</span></label>
                                            <Input name="machineId" value={formData.machineId} onChange={handleInputChange} placeholder="MAC-XXX" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">Short Name</label>
                                            <Input name="shortName" value={formData.shortName} onChange={handleInputChange} placeholder="SHORT-CODE" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Machine Name <span className="text-red-500">*</span></label>
                                        <Input name="machineName" value={formData.machineName} onChange={handleInputChange} required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Section / Area</label>
                                        <Input name="section" value={formData.section} onChange={handleInputChange} placeholder="e.g. SECTION A - PLASTIC COMPONENT" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">Prod Qty / Min</label>
                                            <Input type="number" name="qtyPerMin" value={formData.qtyPerMin} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">UOM</label>
                                            <select
                                                name="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                                            >
                                                <option value="UNITS">UNITS</option>
                                                <option value="PACKS">PACKS</option>
                                                <option value="CARTONS">CARTONS</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-2">Avg Prod Hrs/Day</label>
                                            <Input type="number" step="0.5" name="avgHrsPerDay" value={formData.avgHrsPerDay} onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6">Cancel</Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Save</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductionCapacity;
