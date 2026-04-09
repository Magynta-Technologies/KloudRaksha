"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { FileText, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ReportFileMeta {
  key: string;
  bucket: string;
  filename?: string;
  region?: string;
  mime_type?: string;
  size?: number;
  type?: string;
}

interface ScanRequest {
  id: string;
  audit_id: string;
  name: string;
  email: string;
  purpose: string;
  status: "reviewing" | "completed";
  lastUpdated: string;
  metadata?: {
    total_findings: number;
    failed_findings: number;
    passed_findings: number;
    critical_findings: number;
    high_findings: number;
    medium_findings: number;
    low_findings: number;
  };
  pdf_urls?: string[];
  severity?: number;
  provider?: string;
  report_s3_bucket?: string;
  report_s3_key?: string;
  report_s3_region?: string;
  report_files?: ReportFileMeta[];
  user_info?: {
    name?: string;
    email?: string;
    purpose?: string;
    officeEmail?: string;
    provider?: string;
  };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface KanbanColumn {
  title: string;
  status: "reviewing" | "completed";
  color: string;
  scans: ScanRequest[];
}

type SortOption = "newest" | "oldest" | "severity-high" | "severity-low";
type ProviderFilter = "all" | "aws" | "azure" | "gcp";

const ProviderIcon = ({ provider }: { provider: string }) => {
  switch (provider?.toLowerCase()) {
    case "aws":
      return <FaAws className="inline mr-2 text-3xl" />;
    case "azure":
      return <VscAzure className="inline mr-2 text-3xl" />;
    case "gcp":
      return <SiGooglecloud className="inline mr-2 text-3xl" />;
    default:
      return null;
  }
};

function ScanCard({
  scan,
  onViewDetails,
  onStatusUpdate,
}: {
  scan: ScanRequest;
  onViewDetails: () => void;
  onStatusUpdate: (scanId: string, currentStatus: string) => void;
}) {
  const getPdfName = (url: string) => {
    const fileName = url.split("/").pop() || "";
    return (
      fileName
        .replace("_audit_report.pdf", "")
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") + " Report"
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reviewing":
        return "border-blue-200 dark:border-blue-800/30";
      case "completed":
        return "border-green-200 dark:border-green-800/30";
      default:
        return "";
    }
  };

  const getStatusButton = (currentStatus: string) => {
    if (currentStatus === "reviewing") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-white hover:bg-green-400"
          style={{ backgroundColor: "#22c55e" }}
          onClick={(e) => {
            e.stopPropagation();
            onStatusUpdate(scan.audit_id, currentStatus);
          }}
        >
          Mark as Completed
        </Button>
      );
    }
    // No button for completed scans
    return null;
  };

  return (
    <Card
      className={`relative p-5 hover:shadow-lg transition-all border hover:scale-[1.02] group ${getStatusColor(
        scan.status
      )}`}
    >
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100 text-lg">
              {scan.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {scan.email}
            </div>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <ProviderIcon provider={scan.provider ?? ""} />
            <span>{scan.provider}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{scan.purpose}</div>

        {scan.metadata && (
          <div className="grid grid-cols-4 gap-3 my-3">
            <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 shadow-sm">
              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                Critical
              </span>
              <span className="text-xl font-bold text-red-700 dark:text-red-400 mt-1">
                {scan.metadata.critical_findings}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 shadow-sm">
              <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                High
              </span>
              <span className="text-xl font-bold text-orange-700 dark:text-orange-400 mt-1">
                {scan.metadata.high_findings}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 shadow-sm">
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Medium
              </span>
              <span className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">
                {scan.metadata.medium_findings}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 shadow-sm">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Low
              </span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {scan.metadata.low_findings}
              </span>
            </div>
          </div>
        )}

        {scan.pdf_urls && scan.pdf_urls.length > 0 && (
          <div className="space-y-2 mt-4 border-t dark:border-gray-700 pt-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reports:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {scan.pdf_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="h-4 w-4" />
                  {getPdfName(url)}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Last updated: {new Date(scan.lastUpdated).toLocaleString()}
        </div>
        <div className="flex justify-between items-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails()}
            className="flex-1 text-white hover:bg-blue-300"
            style={{ backgroundColor: "#3B82F6" }}
          >
            View Details
          </Button>
          {getStatusButton(scan.status)}
        </div>
      </div>
    </Card>
  );
}

export default function ScanKanban() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      title: "Reviewing",
      status: "reviewing",
      color: "from-blue-500/80 to-indigo-600/80",
      scans: [],
    },
    {
      title: "Completed",
      status: "completed",
      color: "from-green-500/80 to-green-700/80",
      scans: [],
    },
  ]);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [selectedScan, setSelectedScan] = useState<ScanRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [findings, setFindings] = useState<any[]>([]);
  const [rawReportLinkLoading, setRawReportLinkLoading] = useState(false);

  const sortScans = (scans: ScanRequest[], sortOption: SortOption) => {
    return [...scans].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case "oldest":
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case "severity-high":
          const bSeverity = b.metadata
            ? b.metadata.critical_findings * 4 +
              b.metadata.high_findings * 3 +
              b.metadata.medium_findings * 2 +
              b.metadata.low_findings
            : 0;
          const aSeverity = a.metadata
            ? a.metadata.critical_findings * 4 +
              a.metadata.high_findings * 3 +
              a.metadata.medium_findings * 2 +
              a.metadata.low_findings
            : 0;
          return bSeverity - aSeverity;
        case "severity-low":
          const bSevLow = b.metadata
            ? b.metadata.critical_findings * 4 +
              b.metadata.high_findings * 3 +
              b.metadata.medium_findings * 2 +
              b.metadata.low_findings
            : 0;
          const aSevLow = a.metadata
            ? a.metadata.critical_findings * 4 +
              a.metadata.high_findings * 3 +
              a.metadata.medium_findings * 2 +
              a.metadata.low_findings
            : 0;
          return aSevLow - bSevLow;
        default:
          return 0;
      }
    });
  };

  const filterScansByProvider = (scans: ScanRequest[], provider: ProviderFilter) => {
    if (provider === "all") return scans;
    return scans.filter((scan) => scan.provider?.toLowerCase() === provider);
  };

  const openScanDetails = async (scan: ScanRequest) => {
    setSelectedScan(scan);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    setFindings([]);

    try {
      const response = await api.get(`/scan/admin/scanresult/${scan.audit_id}`);
      const payload = Array.isArray(response.data) ? { findings: response.data } : response.data;
      
      // Handle 202 status (scan in progress)
      if (response.status === 202) {
        setFindings([]);
        toast({
          title: "Scan in Progress",
          description: payload.message || "Scan is still running. Results will be available when complete.",
          variant: "default",
        });
        return;
      }
      
      setFindings(payload.findings || []);
      if (payload.metadata) {
        setSelectedScan(prev => (prev ? { ...prev, metadata: payload.metadata } : prev));
      }
      if (payload.reportFiles) {
        setSelectedScan(prev => (prev ? { ...prev, report_files: payload.reportFiles } : prev));
      }
      
      // Show message if no findings but scan is completed
      if ((!payload.findings || payload.findings.length === 0) && scan.status === "completed") {
        if (payload.message) {
          toast({
            title: "Info",
            description: payload.message,
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch scan details", error);
      const errorMessage = error.response?.data?.error || error.message || "Unable to load scan details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const downloadRawReport = async (fileKey?: string) => {
    if (!selectedScan) return;
    setRawReportLinkLoading(true);
    try {
      const { data } = await api.get(`/scan/scanRequests/${selectedScan.audit_id}/raw-report`, {
        params: fileKey ? { key: fileKey } : undefined,
      });
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        toast({ title: "Unavailable", description: "Raw report link is not available" });
      }
    } catch (error) {
      console.error("Failed to fetch raw report link", error);
      toast({
        title: "Error",
        description: "Unable to generate raw report link",
        variant: "destructive",
      });
    } finally {
      setRawReportLinkLoading(false);
    }
  };

  const formatReportLabel = (file: ReportFileMeta) => {
    if (file.type) return file.type.toUpperCase();
    if (file.filename) return file.filename;
    return "Download";
  };

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const { data } = await api.get("/scan/getallrequest");
        console.log("Fetched scans:", data);

        const formattedScans = data.map((scan: any) => {
          const rawStatus = scan.status?.toLowerCase();

          // Normalize statuses here: only "completed" is completed, all else defaults to reviewing
          const status: "reviewing" | "completed" = rawStatus === "completed" ? "completed" : "reviewing";

          const userInfo = scan.user_info || {};
          const fallbackName = userInfo.name || scan.name || "Unknown";
          const fallbackEmail = userInfo.email || scan.email || "N/A";
          const fallbackPurpose = userInfo.purpose || scan.purpose || "";
          const provider = scan.provider || userInfo.provider || "";
          const lastUpdated =
            scan.updatedAt ||
            scan.updated_at ||
            scan.completed_at ||
            scan.createdAt ||
            scan.created_at ||
            new Date().toISOString();

          return {
            id: scan._id,
            audit_id: scan.audit_id,
            name: fallbackName,
            email: fallbackEmail,
            purpose: fallbackPurpose,
            status,
            lastUpdated,
            metadata: scan.metadata
              ? {
                  ...scan.metadata,
                  total_findings: scan.metadata.total_findings ?? 0,
                  failed_findings: scan.metadata.failed_findings ?? 0,
                  passed_findings: scan.metadata.passed_findings ?? 0,
                  critical_findings: scan.metadata.critical_findings ?? 0,
                  high_findings: scan.metadata.high_findings ?? 0,
                  medium_findings: scan.metadata.medium_findings ?? 0,
                  low_findings: scan.metadata.low_findings ?? 0,
                }
              : undefined,
            pdf_urls: scan.pdf_urls || [],
            provider,
            report_s3_bucket: scan.report_s3_bucket,
            report_s3_key: scan.report_s3_key,
            report_s3_region: scan.report_s3_region,
            report_files: scan.report_files || [],
            user_info: scan.user_info,
          };
        });

        const sortedScans = sortScans(formattedScans, sortBy);
        const filteredScans = filterScansByProvider(sortedScans, providerFilter);

        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            scans: filteredScans.filter((scan) => scan.status === col.status),
          }))
        );
      } catch (error) {
        console.error("Error fetching scans:", error);
      }
    };

    fetchScans();
  }, [sortBy, providerFilter]);

  // Status flow: reviewing -> completed
  const statusFlow: Record<string, string | null> = {
    reviewing: "completed",
    completed: null,
  };

  const handleStatusUpdate = async (auditId: string, currentStatus: string) => {
    try {
      if (!auditId) {
        toast({
          title: "Error",
          description: "Invalid scan ID",
          variant: "destructive",
        });
        return;
      }

      const newStatus = statusFlow[currentStatus];
      if (!newStatus) {
        toast({
          title: "Info",
          description: "Scan is already completed",
        });
        return;
      }

      await api.put(`/scan/scanRequests/${auditId}/update`, {
        status: newStatus,
        is_verified: newStatus === "completed",
      });

      setColumns((prevColumns) => {
        let scanToMove: ScanRequest | undefined;

        const updatedColumns = prevColumns.map((col) => {
          if (col.status === currentStatus) {
            scanToMove = col.scans.find((s) => s.audit_id === auditId);
            return {
              ...col,
              scans: col.scans.filter((s) => s.audit_id !== auditId),
            };
          }
          return col;
        });

        if (scanToMove) {
          //@ts-ignore
          scanToMove = { ...scanToMove, status: newStatus };
          return updatedColumns.map((col) =>
            col.status === newStatus ? { ...col, scans: [...col.scans, scanToMove!] } : col
          );
        }
        return updatedColumns;
      });

      toast({
        title: "Success",
        description: `Scan moved to ${newStatus.replace("-", " ")}`,
      });
    } catch (error) {
      console.error("Error updating scan status:", error);
      toast({
        title: "Error",
        description: "Failed to update scan status",
        variant: "destructive",
      });
    }
  };

  const handleSort = (value: SortOption) => {
    setSortBy(value);
  };

  return (
    <div className="p-8 max-w-[1920px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Scan Management</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={providerFilter === "all" ? "default" : "outline"}
              onClick={() => setProviderFilter("all")}
              size="sm"
              className="dark:border-gray-800"
            >
              All Providers
            </Button>
            <Button
              variant={providerFilter === "aws" ? "default" : "outline"}
              onClick={() => setProviderFilter("aws")}
              size="sm"
              className="dark:border-gray-800"
            >
              <FaAws className="mr-2" />
              AWS
            </Button>
            <Button
              variant={providerFilter === "azure" ? "default" : "outline"}
              onClick={() => setProviderFilter("azure")}
              size="sm"
              className="dark:border-gray-800"
            >
              <VscAzure className="mr-2" />
              Azure
            </Button>
            <Button
              variant={providerFilter === "gcp" ? "default" : "outline"}
              onClick={() => setProviderFilter("gcp")}
              size="sm"
              className="dark:border-gray-800"
            >
              <SiGooglecloud className="mr-2" />
              GCP
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="severity-high">Highest Severity</SelectItem>
              <SelectItem value="severity-low">Lowest Severity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {columns.map((column) => (
          <div
            key={column.status}
            className="h-full rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div
              className={`p-4 flex items-center justify-between border-b dark:border-gray-700 bg-gradient-to-r ${column.color} rounded-t-xl`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg text-white">{column.title}</span>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">
                  {column.scans.length}
                </Badge>
              </div>
            </div>
            <div className="p-4 space-y-4 min-h-[calc(100vh-200px)] max-h-[calc(100vh-100px)] overflow-y-auto">
              {column.scans.map((scan) => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  onViewDetails={() => openScanDetails(scan)}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Scan Details</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading scan results...
            </div>
          ) : selectedScan ? (
            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold">{selectedScan.name}</div>
                <div className="text-sm text-muted-foreground">{selectedScan.email}</div>
                <div className="text-sm text-muted-foreground">
                  Provider: {selectedScan.provider?.toUpperCase() || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Purpose: {selectedScan.purpose || "N/A"}</div>
                <div className="text-xs text-muted-foreground">Audit ID: {selectedScan.audit_id}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedScan.metadata ? (
                  [
                    { label: "Total", value: selectedScan.metadata.total_findings },
                    { label: "Failed", value: selectedScan.metadata.failed_findings },
                    { label: "Passed", value: selectedScan.metadata.passed_findings },
                    { label: "Critical", value: selectedScan.metadata.critical_findings },
                    { label: "High", value: selectedScan.metadata.high_findings },
                    { label: "Medium", value: selectedScan.metadata.medium_findings },
                    { label: "Low", value: selectedScan.metadata.low_findings },
                  ].map((item) => (
                    <Card key={item.label} className="p-3">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-xl font-semibold">{item.value ?? 0}</div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-4 text-sm text-muted-foreground">
                    Metadata not available for this scan.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => navigate(`/admin/${selectedScan.audit_id}`)}>
                  Open Full Result View
                </Button>
                {selectedScan.report_files && selectedScan.report_files.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedScan.report_files.map((file) => (
                      <Button
                        key={file.key}
                        variant="outline"
                        onClick={() => downloadRawReport(file.key)}
                        disabled={rawReportLinkLoading}
                      >
                        {rawReportLinkLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {formatReportLabel(file)}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => downloadRawReport()} disabled={rawReportLinkLoading}>
                    {rawReportLinkLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Download Raw Report
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <div className="text-base font-semibold mb-2">Recent Findings</div>
                {findings.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No findings available for this scan.</div>
                ) : (
                  <ScrollArea className="h-64 border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Severity</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {findings.slice(0, 20).map((finding) => (
                          <tr key={finding.Id} className="border-t">
                            <td className="p-2 pr-4">
                              <div className="font-medium">{finding.Title}</div>
                              <div className="text-xs text-muted-foreground">{finding.Id}</div>
                            </td>
                            <td className="p-2">
                              <Badge
                                className={
                                  finding.Severity?.Label === "CRITICAL"
                                    ? "bg-red-500"
                                    : finding.Severity?.Label === "HIGH"
                                    ? "bg-orange-500"
                                    : finding.Severity?.Label === "MEDIUM"
                                    ? "bg-yellow-400 text-black"
                                    : "bg-blue-500"
                                }
                              >
                                {finding.Severity?.Label || "N/A"}
                              </Badge>
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {finding.Compliance?.Status || "UNKNOWN"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a scan to view details.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
