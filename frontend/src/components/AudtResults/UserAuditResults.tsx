"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";

// Define types
type Severity = {
  Label: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};
type Compliance = {
  Status: "FAILED" | "PASSED" | "WARNING";
};
type AuditType = string;
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
  createdAt: string;
  updatedAt: string;
  clusteredItems?: AuditItem[];
}

type RawAuditItem = Omit<AuditItem, "Region"> & {
  Resources: { Region: Region }[];
};

type SortConfig = {
  key: keyof AuditItem | null;
  direction: "ascending" | "descending";
};

export default function UserDashboard(): React.ReactElement {
  const [auditData, setAuditData] = useState<AuditItem[]>([]);
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
  const [s3Report, setS3Report] = useState<S3ReportInfo | null>(null);
  const [isFetchingRawReport, setIsFetchingRawReport] = useState(false);
  const [reportFiles, setReportFiles] = useState<ReportFileMeta[]>([]);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

  const audit_id = useParams().id;

  const navigate = useNavigate();
  console.log("audit_id", audit_id);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/scan/scanresult/${audit_id}`);
        const payload = Array.isArray(response.data)
          ? { findings: response.data }
          : response.data || {};
        const data = Array.isArray(payload.findings) ? payload.findings : [];
        setS3Report(payload.s3Report || null);
        setReportFiles(payload.reportFiles || []);
        setUploadErrors(payload.uploadErrors || []);

        // Ensure unique entries based on Id
        const uniqueData = Array.from(
          new Map(
            data.map((item: RawAuditItem) => [
              item.Id,
              {
                ...item,
                Region: item.Resources[0].Region,
              } as AuditItem
            ])
          ).values()
        ) as AuditItem[];

        setAuditData(uniqueData);
      } catch (error) {
        console.error("Failed to fetch audit data:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [audit_id, navigate]);

  const filteredData = useMemo(() => {
    return auditData.filter(
      (item) =>
        (item.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.Description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedSeverity === "All" ||
          item.Severity.Label === selectedSeverity) &&
        (selectedCompliance === "All" ||
          item.Compliance.Status === selectedCompliance) &&
        (selectedType === "All" || 
          item.Types.some(type => type === selectedType)) &&
        (selectedRegion === "All" || item.Region === selectedRegion)
    );
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
    setSortConfig({ key, direction });
  };

  const handleDownloadRawReport = async (fileKey?: string) => {
    if (!audit_id) return;
    if (!s3Report && reportFiles.length === 0) {
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
      }
    } catch (error) {
      console.error("Failed to download raw report", error);
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
            We saved every finding, but some report files could not be uploaded
            to S3. You can still review everything below. Please let us know if
            the issue persists.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {maxVisible.map((error, index) => (
              <li key={`${error.file || "unknown"}-${index}`}>
                <span className="font-medium">{error.file || "Report"}</span>
                {": "}
                {error.message}
              </li>
            ))}
          </ul>
          {uploadErrors.length > maxVisible.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              +{uploadErrors.length - maxVisible.length} more upload issue
              {uploadErrors.length - maxVisible.length > 1 ? "s" : ""}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
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
        return "bg-blue-100 text-blue-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getComplianceColor = (Compliance: Compliance["Status"]): string => {
    switch (Compliance) {
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PASSED":
        return "bg-green-100 text-green-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    auditData?.forEach(item => {
      if (item.Types) {
        item.Types.forEach((type: AuditType) => types.add(type.toString()));
      }
    });
    return Array.from(types);
  }, [auditData]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Audit Dashboard
            </h1>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Customize <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Show Summary Cards</DropdownMenuItem>
                  <DropdownMenuItem>Enable Dark Mode</DropdownMenuItem>
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredData.length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {filteredData.length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Failed Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {complianceCounts["FAILED"] || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
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
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
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
                <Card className="bg-white mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Raw Report Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {s3Report && (
                      <>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Bucket:</span> {" "}
                          {s3Report.bucket || "-"}
                        </p>
                        <p className="text-sm text-gray-600 break-all">
                          <span className="font-semibold">Key:</span> {" "}
                          {s3Report.key || "-"}
                        </p>
                      </>
                    )}
                    {reportFiles.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p className="font-semibold">Available Files:</p>
                        {reportFiles.map(file => (
                          <div key={file.key} className="flex justify-between">
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
              {/* <div className="mb-4 flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search audits..."
                  className="w-full"
                />
                <Button variant="outline" onClick={() => setSearchTerm('')}>Clear</Button>
              </div> */}
              <div className="mb-4 flex space-x-2 items-center">
                {" "}
                <Search className="h-5 w-5 text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search audits..."
                  className="w-full bg-white"
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
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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
                  <SelectContent className="bg-white">
                    <SelectItem value="All">All Compliance</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedType as string}
                  onValueChange={(value: string) =>{
                    console.log("value",value)
                    setSelectedType(value as AuditType | "All")}
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
              {/* Audit Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
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
                      <TableHead>
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
                      <TableHead>
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
                      <TableHead>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-gray-500"
                        >
                          No matching audits found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedData.map((item) => (
                        <React.Fragment key={item.Id}>
                          <TableRow>
                            <TableCell>
                              {item.Title}
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
                                      {item.Remediation.Recommendation.Text}
                                    </p>
                                    <a
                                      href={item.Remediation.Recommendation.Url}
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
                          </TableRow>
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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
    </div>
  );
}
