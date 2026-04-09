// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { AxiosResponse } from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";
import { SiGooglecloud } from "react-icons/si";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
};

// Helper function to remove duplicates
const removeDuplicates = (data) => {
  const seen = new Set();
  return data.filter(item => {
    const key = item.Id || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

async function handleDownloadStyledPDF(scan) {
  const doc = new jsPDF("p", "mm", "a4");
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'passed':
      case 'fixed':
        return [76, 175, 80]; // Green
      case 'fail':
      case 'failed':
      case 'not fixed':
        return [244, 67, 54]; // Red
      case 'warning':
        return [255, 193, 7]; // Yellow
      default:
        return [158, 158, 158]; // Gray
    }
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return [139, 0, 0]; // Dark Red
      case 'high':
        return [255, 0, 0]; // Red
      case 'medium':
        return [255, 165, 0]; // Orange
      case 'low':
        return [255, 255, 0]; // Yellow
      default:
        return [128, 128, 128]; // Gray
    }
  };

  // Function to load audit data
  const loadAuditData = async () => {
    try {
      const response = await api.get(`/scan/admin/scanresult/${scan.audit_id}`);
      console.log("Response data:", response.data);

      if (response.status === 404) {
        console.error("Scan results not found");
        return [];
      }
      
      const payload = Array.isArray(response.data)
        ? { findings: response.data }
        : response.data || {};
      const data = Array.isArray(payload.findings) ? payload.findings : [];
      const transformedData = data.map((item) => ({
        ...item,
        Region: item.Resources?.[0]?.Region || 'global',
      }));

      return removeDuplicates(transformedData);
    } catch (error) {
      console.error("Failed to fetch audit data:", error);
      return [];
    }
  };

  // Function to draw page borders similar to your Python script
  const drawPageBorders = () => {
    // Main border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);
    
    // Header separator
    doc.line(5, 20, 205, 20);
    
    // Vertical line for sidebar
    doc.line(65, 20, 65, 292);
    
    // Sidebar section boxes
    const yPositions = [45, 75, 105];
    yPositions.forEach(y => {
      doc.line(5, y, 65, y);
    });
  };


 // Function to add header similar to your Python script
const addPageHeader = () => {
  // Header background
  doc.setFillColor(245, 245, 245);
  doc.rect(5, 5, 200, 15, 'F');

  // Severity indicator box
  doc.setFillColor(87, 217, 23);
  doc.rect(7, 7, 30, 10, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('LOW', 12, 13);

  // Header text elements with perfect spacing
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  
  // Section 1: Assessment types (40-70mm range)
  doc.text('Internal', 42, 11);
  doc.text('External', 42, 15);
  doc.text('Black-box', 64, 11);
  doc.text('Grey-box', 64, 15);
  
  // Section 2: Service info (80-120mm range) 
  doc.text('Affected Service: AWS', 85, 13);
  
  // Section 3: Report navigation (125-190mm range)
  doc.setTextColor(0, 0, 255);
  doc.text('Vulnerability Overview', 128, 13);
  doc.text('Index', 175, 13);

  drawPageBorders();
};



  // Function to add footer similar to your Python script
  const addPageFooter = () => {
    const pageHeight = 297;
    
    // Footer separator line
    doc.line(5, pageHeight - 15, 205, pageHeight - 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    // Company name in green
    doc.setTextColor(0, 128, 0);
    doc.text('Newtons Apple', 10, pageHeight - 10);
    
    // Confidential in red
    doc.setTextColor(255, 0, 0);
    doc.text('Confidential', 105 - 15, pageHeight - 10);
    
    // Website in green
    doc.setTextColor(0, 128, 0);
    doc.text('www.newtonsapple.in', 155, pageHeight - 10);
    
    // Page number
    doc.setTextColor(0, 0, 0);
    doc.text(doc.internal.getNumberOfPages().toString(), 195, pageHeight - 10);
  };

  // Function to add individual vulnerability finding
  const addVulnerabilityFinding = (finding) => {
    doc.addPage();
    addPageHeader();
    
    let currentY = 25;

    // Reference Links section (left sidebar)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Reference Links', 10, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 255);
    const referenceUrl = finding.Remediation?.Recommendation?.Url || 'No reference available';
    doc.textWithLink('Reference Link', 10, currentY + 8, { url: referenceUrl });

    // Ownership section
    currentY = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Ownership', 10, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text('Cloud Team - demo', 10, currentY + 8);

    // Retest Results section
    currentY = 80;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('Retest Results', 9, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(192, 192, 192);
    const retestStatuses = ['Fixed', 'Not Fixed', 'Mitigated', 'Risk Accepted', 'Risk Transferred'];
    retestStatuses.forEach((status, index) => {
      doc.text(status, 10, currentY + 4 + (index * 5));
    });

    // Main content section (right side)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 255);
    const vulnerabilityTitle = `Vulnerability: ${finding.Title || 'Unknown Vulnerability'}`;
    doc.text(vulnerabilityTitle, 70, 25, { maxWidth: 125 });

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const description = finding.Description || 'No description available';
    const descriptionLines = doc.splitTextToSize(description, 125);
    doc.text(descriptionLines, 70, 35);

    // Calculate Y position after description
    const descriptionHeight = descriptionLines.length * 4;
    currentY = 35 + descriptionHeight + 10;

    // Severity and Status information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Severity: ${finding.Severity?.Label || 'Unknown'}`, 70, currentY);
    doc.text(`Status: ${finding.Compliance?.Status || 'Unknown'}`, 70, currentY + 8);
    doc.text(`Account ID: ${finding.AwsAccountId || 'N/A'}`, 70, currentY + 16);
    doc.text(`Region: ${finding.Resources?.[0]?.Region || 'global'}`, 70, currentY + 24);

    // Resource information
    currentY += 35;
    if (finding.Resources && finding.Resources.length > 0) {
      doc.text('Affected Resource:', 70, currentY);
      const resourceId = finding.Resources[0].Id || finding.Resources[0].Arn || 'No resource ID';
      const resourceLines = doc.splitTextToSize(resourceId, 125);
      doc.setFont("helvetica", "normal");
      doc.text(resourceLines, 70, currentY + 8);
      currentY += 8 + (resourceLines.length * 4) + 8;
    }

    // Solution section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('Solution:', 70, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const solutionText = finding.Remediation?.Recommendation?.Text || 'Please refer to AWS documentation for remediation steps.';
    const solutionLines = doc.splitTextToSize(solutionText, 125);
    doc.text(solutionLines, 70, currentY + 8);

    // Compliance Requirements (if available)
    if (finding.Compliance?.RelatedRequirements && finding.Compliance.RelatedRequirements.length > 0) {
      currentY += 8 + (solutionLines.length * 4) + 10;
      doc.setFont("helvetica", "bold");
      doc.text('Compliance Requirements:', 70, currentY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      finding.Compliance.RelatedRequirements.forEach((req, index) => {
        if (currentY + 8 + (index * 4) < 270) { // Check if we have space
          doc.text(`• ${req}`, 70, currentY + 8 + (index * 4));
        }
      });
    }

    addPageFooter();
  };

  // Load audit data before generating PDF
  const auditData = await loadAuditData();

  // Create title page
  doc.addPage();
  addPageHeader();

  // Title page content
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('AWS Security Audit Report', 70, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(format(new Date(), 'dd MMMM yyyy'), 70, 75);

  // Summary statistics on title page
  const findings = auditData || [];
  if (findings.length > 0) {
    const totalFindings = findings.length;
    const failed = findings.filter(f => f.Compliance?.Status?.toLowerCase() === 'failed').length;
    const passed = findings.filter(f => f.Compliance?.Status?.toLowerCase() === 'passed').length;
    const critical = findings.filter(f => f.Severity?.Label?.toLowerCase() === 'critical').length;
    const high = findings.filter(f => f.Severity?.Label?.toLowerCase() === 'high').length;
    const medium = findings.filter(f => f.Severity?.Label?.toLowerCase() === 'medium').length;
    const low = findings.filter(f => f.Severity?.Label?.toLowerCase() === 'low').length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('Executive Summary', 70, 100);

    // Summary box
    doc.setFillColor(240, 240, 240);
    doc.rect(70, 110, 125, 80, 'F');
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Findings: ${totalFindings}`, 75, 125);
    doc.text(`Account ID: ${findings[0]?.AwsAccountId || 'N/A'}`, 75, 135);
    doc.text('Severity Distribution:', 75, 150);
    doc.text(`Critical: ${critical} | High: ${high}`, 80, 162);
    doc.text(`Medium: ${medium} | Low: ${low}`, 80, 174);
    doc.text('Status Distribution:', 75, 185);
    doc.text(`Failed: ${failed} | Passed: ${passed}`, 80, 197);
  }

  addPageFooter();

  // Add individual vulnerability pages
  if (findings && findings.length > 0) {
    console.log(`Generating ${findings.length} individual vulnerability pages...`);
    
    findings.forEach((finding, index) => {
      console.log(`Processing vulnerability ${index + 1}/${findings.length}: ${finding.Title}`);
      addVulnerabilityFinding(finding);
    });
  }

  // Save the PDF
  const fileName = `detailed-security-audit-${scan?.provider || "aws"}-${findings[0]?.AwsAccountId || scan?.account_id || "report"}-${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);

  console.log(`PDF generated successfully with ${doc.internal.getNumberOfPages()} pages!`);
}

const UserScans: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "reviewing" | "pending"
  >("all");
  const [sortConfig, setSortConfig] = useState<{
    key:
      | "created_at"
      | "user_info.email"
      | "user_info.purpose"
      | "status"
      | "provider"
      | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });
  const [selectedScan, setSelectedScan] = useState<any | null>(null);
  const [downloadingRawId, setDownloadingRawId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScanRequests = async () => {
      setLoading(true);
      try {
        const response = await api.get("/scan/usr");
        const responseData = await response.data;
        setData(responseData.scanRequests.reverse());
      } catch (error) {
        console.error("Error fetching scan requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScanRequests();
  }, []);

  // Download original backend PDF
  const handleDownload = async (id: string) => {
    setLoading(true);
    try {
      const res: AxiosResponse<Blob> = await api.get(
        `/scan/downloadfile/${id}`,
        { responseType: "blob" }
      );
      const contentDisposition = res.headers["content-disposition"];
      let fileName = "scan-report.pdf";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      const blob = new Blob([res.data], { type: res.data.type });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error("Error during file download:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRawReportDownload = async (auditId: string, fileKey?: string) => {
    setDownloadingRawId(auditId);
    try {
      const { data } = await api.get(
        `/scan/scanRequests/${auditId}/raw-report`,
        { params: fileKey ? { key: fileKey } : undefined }
      );
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Error fetching raw report:", error);
    } finally {
      setDownloadingRawId(null);
    }
  };

  const formatReportLabel = (file: any) => {
    if (file?.type) return file.type.toUpperCase();
    if (file?.filename) return file.filename;
    return "Download";
  };

  const filteredData = data.filter((item) => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  const sortData = (data: any[]) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = sortConfig.key.includes(".")
        ? sortConfig.key.split(".").reduce((obj, key) => obj[key], a)
        : a[sortConfig.key];
      let bValue = sortConfig.key.includes(".")
        ? sortConfig.key.split(".").reduce((obj, key) => obj[key], b)
        : b[sortConfig.key];

      // Date sort
      if (sortConfig.key === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: typeof sortConfig.key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const sortedAndFilteredData = sortData(filteredData);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Scan Requests
          </h1>
          <div className="flex items-center gap-2">
            {["all", "completed", "reviewing", "pending"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status as any)}
                size="sm"
                className="dark:border-gray-800 capitalize"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <Button asChild>
          <Link to="/user/new-scan">New Scan</Link>
        </Button>
      </div>

      <div className="rounded-md border dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50"
                onClick={() => handleSort("created_at")}
              >
                Date {getSortIcon("created_at")}
              </TableHead>
              <TableHead
                className="w-[300px] cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50"
                onClick={() => handleSort("user_info.email")}
              >
                Email {getSortIcon("user_info.email")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50"
                onClick={() => handleSort("user_info.purpose")}
              >
                Purpose {getSortIcon("user_info.purpose")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50"
                onClick={() => handleSort("provider")}
              >
                Provider {getSortIcon("provider")}
              </TableHead>
              <TableHead
                className="w-[150px] cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50"
                onClick={() => handleSort("status")}
              >
                Status {getSortIcon("status")}
              </TableHead>
              <TableHead className="w-[170px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      {Array(6)
                        .fill(0)
                        .map((__, colIdx) => (
                          <TableCell key={colIdx}>
                            <Skeleton className="h-6 w-full bg-muted dark:bg-gray-800" />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
              : sortedAndFilteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.email || item.user_info?.email || "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.purpose || item.user_info?.purpose || "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center">
                        <ProviderIcon provider={item.provider} />
                        {item.provider}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "completed" ? "success" : "default"
                        }
                        className={`${
                          item.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : item.status === "reviewing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {item.status === "completed"
                          ? "Completed"
                          : item.status === "reviewing"
                          ? "Reviewing"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Details Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="dark:border-gray-800"
                          onClick={() => setSelectedScan(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Styled PDF Download */}
                        <Button
                          variant="outline"
                          size="sm"
                          title="Download PDF"
                          className="dark:border-gray-800"
                          onClick={() => handleDownloadStyledPDF(item)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="ml-1 hidden md:inline">Download PDF</span>
                        </Button>
                        {item.report_files && item.report_files.length > 0 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Download Raw Reports"
                                className="dark:border-gray-800"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white dark:bg-gray-900">
                              {item.report_files.map((file) => (
                                <DropdownMenuItem
                                  key={file.key}
                                  onClick={() => handleRawReportDownload(item.audit_id, file.key)}
                                  className="cursor-pointer"
                                >
                                  {formatReportLabel(file)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          item.report_s3_key && (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Download Raw Report"
                              className="dark:border-gray-800"
                              onClick={() => handleRawReportDownload(item.audit_id)}
                              disabled={downloadingRawId === item.audit_id}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )
                        )}
                        {/* Backend PDF URLs */}
                        {item.pdf_urls && item.pdf_urls.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="dark:border-gray-800"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Available Reports</DialogTitle>
                                <DialogDescription>
                                  Select a report to view or download
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                {item.pdf_urls.map((url, idx) => {
                                  const reportName = getPdfName(url);
                                  const reportType = url.includes("all_audit")
                                    ? "Complete"
                                    : url.includes("failed_audit")
                                    ? "Failed"
                                    : "Passed";
                                  const getBadgeColor = (type: string) => {
                                    switch (type) {
                                      case "Complete":
                                        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
                                      case "Failed":
                                        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
                                      case "Passed":
                                        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
                                      default:
                                        return "";
                                    }
                                  };
                                  return (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                          <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {reportName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new URL(url).pathname
                                              .split("/")
                                              .pop()}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={getBadgeColor(
                                            reportType
                                          )}
                                        >
                                          {reportType}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            window.open(url, "_blank");
                                          }}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedScan} onOpenChange={() => setSelectedScan(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-foreground">Scan Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed information about the selected scan.
            </DialogDescription>
          </DialogHeader>
          {selectedScan && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Email
                </h4>
                <p className="text-sm text-foreground">
                  {selectedScan.email || selectedScan.user_info?.email}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Purpose
                </h4>
                <p className="text-sm text-foreground">
                  {selectedScan.purpose || selectedScan.user_info?.purpose}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Provider
                </h4>
                <p className="text-sm text-foreground flex items-center">
                  <ProviderIcon provider={selectedScan.provider} />
                  {selectedScan.provider}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </h4>
                <Badge
                  variant={
                    selectedScan.status === "completed" ? "success" : "default"
                  }
                  className={`${
                    selectedScan.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {selectedScan.status === "completed"
                    ? "Completed"
                    : "In Progress"}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Date
                </h4>
                <p className="text-sm text-foreground">
                  {formatDate(selectedScan.created_at)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedScan(null)}
              className="dark:border-gray-800 dark:hover:bg-gray-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserScans;
