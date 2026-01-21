import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Company {
    id: string;
    type: "CORPORATE" | "FACTORY";
    name: string;
    taxId: string;
    address: string;
    otherFields: string;
}

const CompanyMaster = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("All Types");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const companies: Company[] = [
        {
            id: "CMP-001",
            type: "CORPORATE",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 88-234-90",
            address: "1245 Industrial Way, Suite 400, New ...",
            otherFields: "Established 1995",
        },
        {
            id: "CMP-002",
            type: "FACTORY",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 44-TR-55",
            address: "88 Port Terminal Drive, Savannah, G...",
            otherFields: "Logistics Hub",
        },
        {
            id: "CMP-003",
            type: "FACTORY",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 12-558-34",
            address: "21 High-Tech Park, Austin, TX 78701",
            otherFields: "R&D Division",
        },
        {
            id: "CMP-004",
            type: "FACTORY",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 77-889-22",
            address: "500 Assembly Lane, Detroit, MI 48201",
            otherFields: "Main Assembly",
        },
        {
            id: "CMP-005",
            type: "CORPORATE",
            name: "ACUMED DEVICES DISTRIBUTION LTD.",
            taxId: "TAX-ID: 33-445-11",
            address: "747 Fulfillment Blvd, Denver, CO 802...",
            otherFields: "Regional HQ",
        },
    ];

    const filteredCompanies = companies.filter((company) => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "All Types" || company.type === selectedType;
        return matchesSearch && matchesType;
    });

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
                                <h1 className="text-3xl font-bold text-foreground mb-2">Company Master</h1>
                                <p className="text-muted-foreground">Configure and manage corporate entity profiles</p>
                            </div>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Company
                            </Button>
                        </div>
                    </motion.div>

                    {/* Search and Filter Bar */}
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
                                        placeholder="Search companies..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border-border focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option>All Types</option>
                                        <option>CORPORATE</option>
                                        <option>FACTORY</option>
                                    </select>
                                    <span className="text-sm text-muted-foreground ml-4">
                                        SHOWING 1-5 OF 5
                                    </span>
                                    <Button variant="outline" size="icon" className="ml-2">
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
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                TYPE
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                COMPANY NAME
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                ADDRESS
                                            </th>
                                            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                OTHER FIELDS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredCompanies.map((company, index) => (
                                            <motion.tr
                                                key={company.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                        {company.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${company.type === "CORPORATE"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-green-100 text-green-700"
                                                            }`}
                                                    >
                                                        {company.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {company.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {company.taxId}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">
                                                        {company.address}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground italic">
                                                        {company.otherFields}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/20">
                                <span className="text-sm text-muted-foreground">PAGE 1 OF 1</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button variant="outline" size="sm" disabled>
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default CompanyMaster;
