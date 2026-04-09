"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Flag,
  Layers,
  ChevronRight,
  ChevronUp,
  Save,
  RotateCcw,
  HeartPulse,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define types
type Severity = {
  Label: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};
type Compliance = {
  Status: "FAILED" | "PASSED" | "WARNING";
};
type AuditType =
  | "CIS AWS Foundations Benchmark"
  | "AWS Security Best Practices"
  | "IAM";
type Region = "ap-south-1" | "us-east-1" | "eu-west-1" | "us-west-2";

type RemediationType = {
  Recommendation: {
    Text: string;
    Url: string;
  };
};

type S3ReportInfo = {
  bucket?: string;
  key?: string;
  region?: string;
};

type ReportFileMeta = {
  key: string;
  bucket: string;
  filename?: string;
  region?: string;
  mime_type?: string;
  size?: number;
  type?: string;
};

type UploadError = {
  file?: string;
  message: string;
  timestamp?: string;
};

interface AuditItem {
  Id: string;
  Title: string;
  Description: string;
  Severity: Severity;
  Compliance: Compliance;
  Types: AuditType[];
  Region: Region;
  Remediation: RemediationType;
  CreatedAt: string;
  UpdatedAt: string;
  clusteredItems?: AuditItem[];
}

type SortConfig = {
  key: keyof AuditItem | null;
  direction: "ascending" | "descending";
};

interface RawAuditItem extends Omit<AuditItem, "Region"> {
  Resources: [{ Region: Region }];
}

// Add this utility function at the top of the file, before the component
const removeDuplicates = (data: AuditItem[]): AuditItem[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  // First pass - identify duplicates
  data.forEach((item) => {
    if (seen.has(item.Id)) {
      duplicates.add(item.Id);
    }
    seen.add(item.Id);
  });

  // Log duplicates if any found
  if (duplicates.size > 0) {
    console.warn("Duplicate IDs found:", Array.from(duplicates));
  }

  // Second pass - keep only the most recent version of each item
  const uniqueMap = new Map<string, AuditItem>();
  data.forEach((item) => {
    const existingItem = uniqueMap.get(item.Id);
    if (
      !existingItem ||
      new Date(item.UpdatedAt) > new Date(existingItem.UpdatedAt)
    ) {
      uniqueMap.set(item.Id, item);
    }
  });

  return Array.from(uniqueMap.values());
};

export default function AdminDashboard(): React.ReactElement {
  const [auditData, setAuditData] = useState<AuditItem[]>([]);
  const [originalAuditData, setOriginalAuditData] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<
    Severity["Label"] | "All"
  >("All");
  const [selectedCompliance, setSelectedCompliance] = useState<
    Compliance["Status"] | "All"
  >("All");
  const [selectedType, setSelectedType] = useState<AuditType | "All">("All");
  const [selectedRegion, setSelectedRegion] = useState<Region | "All">("All");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "ascending",
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [flaggedRows, setFlaggedRows] = useState<string[]>([]);
  const [clusterModalOpen, setClusterModalOpen] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [s3Report, setS3Report] = useState<S3ReportInfo | null>(null);
  const [isFetchingRawReport, setIsFetchingRawReport] = useState(false);
  const [reportFiles, setReportFiles] = useState<ReportFileMeta[]>([]);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

  const audit_id = useParams().id;

  const navigate = useNavigate();

  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    if (checked) {
      setSelectedRows(sortedData.map((item) => item.Id));
    } else {
      setSelectedRows([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/scan/admin/scanresult/${audit_id}`);
        console.log("Response data:", response.data);

        if (response.status === 404) {
          toast({
            title: "Error",
            description: "Scan results not found",
            variant: "destructive",
          });
          return navigate("/");
        }
        const payload = Array.isArray(response.data)
          ? { findings: response.data }
          : response.data || {};

        const data = Array.isArray(payload.findings) ? payload.findings : [];
        setS3Report(payload.s3Report || null);
        setReportFiles(payload.reportFiles || []);
        setUploadErrors(payload.uploadErrors || []);

        const transformedData = data.map((item: RawAuditItem) => ({
          ...item,
          Region: item.Resources[0].Region,
        }));

        const uniqueData = removeDuplicates(transformedData);
        setAuditData(uniqueData);
        setOriginalAuditData(uniqueData);
      } catch (error) {
        console.error("Failed to fetch audit data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [audit_id, navigate]);

  useEffect(() => {
    setHasUnsavedChanges(
      JSON.stringify(auditData) !== JSON.stringify(originalAuditData)
    );
  }, [auditData, originalAuditData]);

  useEffect(() => {
    // Debug: Check for duplicate IDs in auditData
    const ids = auditData.map((item) => item.Id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn("Duplicate IDs found:", duplicateIds);
    }
  }, [auditData]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    auditData?.forEach((item) => {
      if (item.Types) {
        item.Types.forEach((type: AuditType) => types.add(type.toString()));
      }
    });
    return Array.from(types);
  }, [auditData]);

  const filteredData = useMemo(() => {
    return auditData.filter((item) => {
      const titleMatch = item.Title.toLowerCase().includes(
        searchTerm.toLowerCase()
      );
      const descriptionMatch = item.Description.toLowerCase().includes(
        searchTerm.toLowerCase()
      );
      const severityMatch =
        selectedSeverity === "All" || item.Severity.Label === selectedSeverity;
      const complianceMatch =
        selectedCompliance === "All" ||
        item.Compliance.Status === selectedCompliance;
      const typeMatch =
        selectedType === "All" ||
        item.Types.some((type) => type === selectedType);
      const regionMatch =
        selectedRegion === "All" || item.Region === selectedRegion;

      return (
        (titleMatch || descriptionMatch) &&
        severityMatch &&
        complianceMatch &&
        typeMatch &&
        regionMatch
      );
    });
  }, [
    auditData,
    searchTerm,
    selectedSeverity,
    selectedCompliance,
    selectedType,
    selectedRegion,
  ]);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        //@ts-expect-error - dynamic sort key comparison
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        //@ts-expect-error - dynamic sort key comparison
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof AuditItem) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction })
  };

  const severityCounts = useMemo(() => {
    return filteredData.reduce((acc: Record<string, number>, item) => {
      acc[item.Severity.Label] = (acc[item.Severity.Label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredData]);

  const complianceCounts = useMemo(() => {
    return filteredData.reduce((acc: Record<string, number>, item) => {
      acc[item.Compliance.Status] = (acc[item.Compliance.Status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredData]);

  const getSeverityColor = (Severity: Severity["Label"]): string => {
    switch (Severity) {
      case "LOW":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100";
      case "MEDIUM":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      case "HIGH":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100";
      case "CRITICAL":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100";
    }
  };

  const getComplianceColor = (Compliance: Compliance["Status"]): string => {
    switch (Compliance) {
      case "FAILED":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      case "PASSED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "WARNING":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100";
    }
  };

  const handleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleFlagRow = (id: string) => {
    setFlaggedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleClusterRows = () => {
    if (selectedRows.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least two rows to cluster.",
        variant: "destructive",
      });
      return;
    }
    setClusterModalOpen(true);
  };

  const handleClusterSelection = (id: string) => {
    const primaryItem = auditData.find((item) => item.Id === id);
    if (!primaryItem) return;

    const clusteredItems = auditData.filter(
      (item) => selectedRows.includes(item.Id) && item.Id !== id
    );
    const newClusteredItem: AuditItem = {
      ...primaryItem,
      Title: `Cluster: ${primaryItem.Title}`,
      clusteredItems: clusteredItems,
    };

    const updatedAuditData = auditData.filter(
      (item) => !selectedRows.includes(item.Id)
    );
    updatedAuditData.unshift(newClusteredItem);

    setAuditData(updatedAuditData);
    setSelectedRows([]);
    setClusterModalOpen(false);
    toast({
      title: "Success",
      description: "Rows have been clustered successfully.",
    });
  };

  const toggleClusterExpansion = (id: string) => {
    setExpandedClusters((prev) =>
      prev.includes(id)
        ? prev.filter((clusterId) => clusterId !== id)
        : [...prev, id]
    );
  };
  const handleSaveChanges = async () => {
    // Get all removed items (including both flagged and previously removed)
    const itemsToRemove = [...new Set([...flaggedRows, ...removedItems])];

    // Get clustering information
    const clusteringInfo = auditData
      .filter((item) => item.clusteredItems)
      .map((item) => ({
        primaryId: item.Id,
        clusteredIds: item.clusteredItems?.map((subItem) => subItem.Id) || [],
      }));

    try {
      await api.put(`/scan/scanRequests/${audit_id}/update`, {
        status: "completed",
        removed_items: itemsToRemove.length > 0 ? itemsToRemove : undefined,
        clustering: clusteringInfo.length > 0 ? clusteringInfo : undefined,
        is_verified: true,
      });

      setOriginalAuditData(auditData);
      setHasUnsavedChanges(false);
      setFlaggedRows([]);
      setRemovedItems([]); // Clear removed items after successful save
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      navigate("/admin");
    }
  };

  const handleDiscardChanges = () => {
    setAuditData(originalAuditData);
    setFlaggedRows([]);
    setSelectedRows([]);
    setExpandedClusters([]);
    setHasUnsavedChanges(false);
    toast({
      title: "Changes Discarded",
      description: "All changes have been discarded.",
    });
  };

  const handleForwardClick = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmedSave = async () => {
    setShowConfirmationModal(false);
    await handleSaveChanges();
  };

  const handleDownloadRawReport = async (fileKey?: string) => {
    if (!audit_id) return;
    if (!s3Report && reportFiles.length === 0) {
      toast({
        title: "Raw report unavailable",
        description: "This audit does not have a stored raw report yet.",
      });
      return;
    }

    setIsFetchingRawReport(true);
    try {
      const { data } = await api.get(
        `/scan/scanRequests/${audit_id}/raw-report`,
        { params: fileKey ? { key: fileKey } : undefined }
      );
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        toast({
          title: "Unable to download",
          description: "Could not generate a signed download link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch raw report:", error);
      toast({
        title: "Unable to download",
        description: "An error occurred while preparing the raw report.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingRawReport(false);
    }
  };

  const formatReportLabel = (file: ReportFileMeta) => {
    if (file.type) return file.type.toUpperCase();
    if (file.filename) return file.filename;
    return "Download";
  };

  const renderUploadErrors = () => {
    if (!uploadErrors.length) return null;
    const maxVisible = uploadErrors.slice(0, 3);
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Raw report upload issues</AlertTitle>
        <AlertDescription>
          <p>
            Findings were saved, but we could not upload {uploadErrors.length} file
            {uploadErrors.length > 1 ? "s" : ""} to S3. Please verify AWS
            credentials or bucket permissions.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {maxVisible.map((error, index) => (
              <li key={`${error.file || "unknown"}-${index}`}>
                <span className="font-medium">{error.file || "Report"}</span>
                {": "}
                {error.message}
                {error.timestamp && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({new Date(error.timestamp).toLocaleString()})
                  </span>
                )}
              </li>
            ))}
          </ul>
          {uploadErrors.length > maxVisible.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              +{uploadErrors.length - maxVisible.length} more issue
              {uploadErrors.length - maxVisible.length > 1 ? "s" : ""}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  // Add this useEffect to handle selectedAll state
  useEffect(() => {
    setSelectedAll(
      selectedRows.length === sortedData.length && sortedData.length > 0
    );
  }, [selectedRows, sortedData]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Audit Dashboard
            </h1>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <>
                  <Button
                    onClick={handleForwardClick}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button onClick={handleDiscardChanges} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Discard Changes
                  </Button>
                </>
              )}
              {reportFiles.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isFetchingRawReport}>
                      <FileText className="mr-2 h-4 w-4" />
                      {isFetchingRawReport ? "Preparing..." : "Raw Reports"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white dark:bg-gray-900">
                    {reportFiles.map(file => (
                      <DropdownMenuItem
                        key={file.key}
                        onClick={() => handleDownloadRawReport(file.key)}
                        className="cursor-pointer"
                      >
                        {formatReportLabel(file)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleDownloadRawReport()}
                  disabled={!s3Report || isFetchingRawReport}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isFetchingRawReport ? "Preparing..." : "Raw Report"}
                </Button>
              )}
              <>
                <Button
                  onClick={handleForwardClick}
                  className={`bg-green-500 hover:bg-green-600 text-white ${
                    hasUnsavedChanges ? "hidden" : ""
                  }`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Forward
                </Button>
              </>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center">
              <p className="text-lg">Loading audit data...</p>
            </div>
          ) : (
            <>
              {renderUploadErrors()}
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium dark:text-gray-200">
                      Total Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold dark:text-white">
                      {filteredData.length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium dark:text-gray-200">
                      Failed Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold dark:text-white">
                      {complianceCounts["FAILED"] || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium dark:text-gray-200">
                      Severity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {Object.entries(severityCounts).map(
                        ([Severity, count]) => (
                          <div key={Severity} className="flex justify-between">
                            <span>{Severity}:</span>
                            <span>{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium dark:text-gray-200">
                      Compliance Status
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="text-sm">
                      {Object.entries(complianceCounts).map(
                        ([Compliance, count]) => (
                          <div
                            key={Compliance}
                            className="flex justify-between"
                          >
                            <span>{Compliance}:</span>
                            <span>{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
              </Card>
            </div>

              {(s3Report || reportFiles.length > 0) && (
                <Card className="bg-white dark:bg-gray-800 mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium dark:text-gray-200">
                      Raw Report Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {s3Report && (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-semibold">Bucket:</span> {" "}
                          {s3Report.bucket || "-"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                          <span className="font-semibold">Key:</span> {" "}
                          {s3Report.key || "-"}
                        </p>
                      </>
                    )}
                    {reportFiles.length > 0 && (
                      <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-semibold">Available Files:</p>
                        {reportFiles.map(file => (
                          <div key={file.key} className="flex justify-between gap-2">
                            <span>{formatReportLabel(file)}</span>
                            <span className="text-xs text-muted-foreground">
                              {file.mime_type || file.type || ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Filters and Search */}
              <div className="mb-4 flex space-x-2 items-center">
                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search audits..."
                  className="w-full bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear
                </Button>
              </div>
              <div className="mb-6 flex flex-wrap gap-4">
                <Select
                  value={selectedSeverity}
                  onValueChange={(value: Severity["Label"] | "All") =>
                    setSelectedSeverity(value)
                  }
                >
                  <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 dark:text-white">
                    <SelectValue placeholder="Select Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="All">All Severities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCompliance}
                  onValueChange={(value: Compliance["Status"]) =>
                    setSelectedCompliance(value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Compliance" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="All">All Compliance</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedType as string}
                  onValueChange={(value: string) =>
                    setSelectedType(value as AuditType | "All")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedRegion}
                  onValueChange={(value: Region | "All") =>
                    setSelectedRegion(value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Regions</SelectItem>
                    <SelectItem value="ap-south-1">ap-south-1</SelectItem>
                    <SelectItem value="us-east-1">us-east-1</SelectItem>
                    <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                    <SelectItem value="us-west-2">us-west-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedSeverity !== "All" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Severity: {selectedSeverity}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSelectedSeverity("All")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedCompliance !== "All" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Compliance: {selectedCompliance}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSelectedCompliance("All")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedType !== "All" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Type: {selectedType}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSelectedType("All")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedRegion !== "All" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Region: {selectedRegion}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setSelectedRegion("All")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
              <div className="mb-4 flex justify-end space-x-2">
                <Button
                  onClick={handleClusterRows}
                  disabled={selectedRows.length < 2}
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Cluster Selected Rows
                </Button>
                <Button
                  onClick={() => {
                    setAuditData((prev) =>
                      prev.filter((item) => !flaggedRows.includes(item.Id))
                    );
                    setRemovedItems((prev) => [...prev, ...flaggedRows]);
                    setFlaggedRows([]);
                    toast({
                      title: "Success",
                      description: "Flagged rows have been removed.",
                    });
                  }}
                  disabled={flaggedRows.length === 0}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Flagged Rows
                </Button>
              </div>
              {/* Audit Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:bg-gray-800">
                      <TableHead className="dark:text-gray-200">
                        <Checkbox
                          checked={selectedAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="dark:text-gray-200">
                        <Button
                          variant="ghost"
                          onClick={() => requestSort("Title")}
                        >
                          Title
                          {sortConfig.key === "Title" &&
                            (sortConfig.direction === "ascending"
                              ? " 🔼"
                              : " 🔽")}
                        </Button>
                      </TableHead>
                      <TableHead className="dark:text-gray-200">
                        <Button
                          variant="ghost"
                          onClick={() => requestSort("Severity")}
                        >
                          Severity
                          {sortConfig.key === "Severity" &&
                            (sortConfig.direction === "ascending"
                              ? " 🔼"
                              : " 🔽")}
                        </Button>
                      </TableHead>
                      <TableHead className="dark:text-gray-200">
                        <Button
                          variant="ghost"
                          onClick={() => requestSort("Compliance")}
                        >
                          Compliance Status
                          {sortConfig.key === "Compliance" &&
                            (sortConfig.direction === "ascending"
                              ? " 🔼"
                              : " 🔽")}
                        </Button>
                      </TableHead>
                      <TableHead className="dark:text-gray-200">
                        <Button
                          variant="ghost"
                          onClick={() => requestSort("Region")}
                        >
                          Region
                          {sortConfig.key === "Region" &&
                            (sortConfig.direction === "ascending"
                              ? " 🔼"
                              : " 🔽")}
                        </Button>
                      </TableHead>
                      <TableHead className="dark:text-gray-200">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-gray-500 dark:text-gray-400"
                        >
                          No matching audits found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedData.map((item) => (
                        <React.Fragment key={item.Id}>
                          <TableRow className="dark:bg-gray-800 dark:hover:bg-gray-700">
                            <TableCell>
                              <Checkbox
                                checked={selectedRows.includes(item.Id)}
                                onCheckedChange={() =>
                                  handleRowSelection(item.Id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {item.clusteredItems ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleClusterExpansion(item.Id)
                                  }
                                >
                                  {expandedClusters.includes(item.Id) ? (
                                    <ChevronUp className="mr-2 h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="mr-2 h-4 w-4" />
                                  )}
                                  {item.Title}
                                </Button>
                              ) : (
                                item.Title
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getSeverityColor(
                                  item.Severity.Label
                                )}
                              >
                                {item.Severity.Label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getComplianceColor(
                                  item.Compliance.Status
                                )}
                              >
                                {item.Compliance.Status}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.Region}</TableCell>
                            <TableCell>
                              <div className="flex gap-2 items-center">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <HeartPulse />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View Remediation Details</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Remediation</DialogTitle>
                                    </DialogHeader>
                                    <DialogDescription>
                                      <p>
                                        {item.Remediation.Recommendation.Text}
                                      </p>
                                      <a
                                        href={
                                          item.Remediation.Recommendation.Url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500"
                                      >
                                        View Details
                                      </a>
                                    </DialogDescription>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="sm">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <FileText />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Full Report</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFlagRow(item.Id)}
                              >
                                <Flag
                                  className={`h-4 w-4 ${
                                    flaggedRows.includes(item.Id)
                                      ? "text-red-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {item.clusteredItems &&
                            expandedClusters.includes(item.Id) &&
                            item.clusteredItems.map((subItem) => (
                              <TableRow
                                key={subItem.Id}
                                className="bg-gray-50 dark:bg-gray-700"
                              >
                                <TableCell></TableCell>
                                <TableCell className="pl-8">
                                  {subItem.Title}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getSeverityColor(
                                      subItem.Severity.Label
                                    )}
                                  >
                                    {subItem.Severity.Label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={getComplianceColor(
                                      subItem.Compliance.Status
                                    )}
                                  >
                                    {subItem.Compliance.Status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{subItem.Region}</TableCell>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        View Remediation
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Remediation</DialogTitle>
                                      </DialogHeader>
                                      <DialogDescription>
                                        <p>
                                          {
                                            subItem.Remediation.Recommendation
                                              .Text
                                          }
                                        </p>
                                        <a
                                          href={
                                            subItem.Remediation.Recommendation
                                              .Url
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500"
                                        >
                                          View Details
                                        </a>
                                      </DialogDescription>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Cluster Modal */}
              <Dialog
                open={clusterModalOpen}
                onOpenChange={setClusterModalOpen}
              >
                <DialogContent className="dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle className="dark:text-white">
                      Select Primary Row for Cluster
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[300px]">
                    {sortedData
                      .filter((item) => selectedRows.includes(item.Id))
                      .map((item) => (
                        <div
                          key={item.Id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleClusterSelection(item.Id)}
                        >
                          <h3 className="font-semibold dark:text-white">
                            {item.Title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.Description}
                          </p>
                        </div>
                      ))}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              {/* Pagination (if needed) */}
              <div className="flex justify-center mt-6">
                <Button variant="outline" disabled={true}>
                  Previous
                </Button>
                <Button variant="outline" className="mx-2">
                  1
                </Button>
                <Button variant="outline">Next</Button>
              </div>
            </>
          )}
        </main>
      </div>
      <Dialog
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Confirm Action
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure? This action will send the data to the client and
              cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmationModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedSave}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
