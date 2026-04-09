
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "react-feather";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageCircleX, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock, FileCheck } from "lucide-react";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";


const COLORS = ["#0088FE", "#FF8042", "#FFBB28"];

const ProviderIcon = ({ provider }: { provider: string }) => {
  switch (provider?.toLowerCase()) {
    case "aws":
      return <FaAws className="inline mr-2 text-xl" />;
    case "azure":
      return <VscAzure className="inline mr-2 text-xl" />;
    case "gcp":
      return <SiGooglecloud className="inline mr-2 text-xl" />;
    default:
      return null;
  }
};

export default function AuditReportPage() {
  const [auditData, setAuditData] = useState<any>(null);
  const [auditHistory, setAuditHistory] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const {
          data: { data },
        } = await api.get("/superadmin/audit-report");

        const scanMetrics = data["scanMetrics"].map((item: any) => ({
          name: item.type,
          value: item.count,
        }));

        setAuditData(scanMetrics);

        console.log("auditData", auditData);
        setAuditHistory(data["auditHistory"]);
      } catch (error) {
        console.error("Error fetching audit data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditData();
  }, []);

  if (loading) return <div>Loading...</div>;
  else
    return (
      <div className="space-y-6 p-6">
        {/* Audit Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-card text-card-foreground rounded-lg shadow-lg dark:border dark:border-gray-800"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Audit Overview
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Comprehensive audit metrics and performance insights
                </p>
              </div>
            </div>
            <div className="flex gap-12">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-1">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                  {auditData.reduce(
                    (acc: number, item: any) => acc + item.value,
                    0
                  )}
                </p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Audits
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-1">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                  {auditData?.find(
                    (item: any) => item.name === "Scan Completed"
                  )?.value || 0}
                </p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Completed
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-1">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
                  {auditData?.find(
                    (item: any) => item.name === "Scan Initiated"
                  )?.value || 0}
                </p>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Initiated
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mx-auto mb-1">
                  <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
                  {auditData?.find((item: any) => item.name === "Scan Reviewed")
                    ?.value || 0}
                </p>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Reviewed
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rest of your existing cards with updated styling */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-card text-card-foreground rounded-lg shadow-lg dark:border dark:border-gray-800"
          >
            <h2 className="text-xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Audit Distribution by Status
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={auditData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {auditData &&
                  //@ts-ignore
                    auditData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* History Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-card text-card-foreground rounded-lg shadow-lg dark:border dark:border-gray-800"
          >
            <h2 className="text-xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Audit History
            </h2>
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditHistory?.map((audit: any) => (
                  <TableRow
                    key={audit.audit_id}
                    className="hover:bg-gray-100 transition duration-200"
                  >
                    <TableCell>
                      {new Date(audit.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{audit["user_info"].name}</TableCell>
                    <TableCell>
                      <span className="flex items-center">
                        <ProviderIcon provider={audit.provider} />
                        {audit.provider || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                          audit.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : audit.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {audit.status}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`flex items-center gap-2 ${
                        audit.status === "completed" &&
                        audit.pdf_urls &&
                        audit.pdf_urls.length > 0
                          ? ""
                          : "hidden"
                      }`}
                    >
                      {audit.pdf_urls && audit.pdf_urls.length > 0 && (
                        <>
                          <Button
                            onClick={() =>
                              window.open(audit.pdf_urls[0], "_blank")
                            }
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Tooltip>
                              <TooltipTrigger>
                                <FileText className="h-4 w-4" />
                              </TooltipTrigger>
                              <TooltipContent>View All Report</TooltipContent>
                            </Tooltip>
                          </Button>
                          <Button
                            onClick={() =>
                              window.open(audit.pdf_urls[2], "_blank")
                            }
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Tooltip>
                              <TooltipTrigger>
                                <ShieldCheck className="h-4 w-4" />
                              </TooltipTrigger>
                              <TooltipContent>
                                View Passed Report
                              </TooltipContent>
                            </Tooltip>
                          </Button>
                          <Button
                            onClick={() =>
                              window.open(audit.pdf_urls[1], "_blank")
                            }
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Tooltip>
                              <TooltipTrigger>
                                <MessageCircleX className="h-4 w-4" />
                              </TooltipTrigger>
                              <TooltipContent>
                                View Failed Report
                              </TooltipContent>
                            </Tooltip>
                          </Button>
                        </>
                      )}
                    </TableCell>
                    <TableCell
                      className={`${
                        audit.status === "completed" &&
                        audit.pdf_urls &&
                        audit.pdf_urls.length > 0
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <span className="text-red-500">No Report Available</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </div>
      </div>
    );
}
