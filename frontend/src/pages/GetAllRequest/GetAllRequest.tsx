//@ts-nocheck

import React, { useEffect, useState } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import EnhancedAuditDashboard from "../../components/AudtResults/AdminAuditResults";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  _id: string;
  audit_id: string;
  name: string;
  email: string;
  purpose: string;
  officeEmail: string;
  provider: string;
  status: string;
  report_s3_key?: string;
  report_s3_bucket?: string;
  report_s3_region?: string;
  report_files?: ReportFileMeta[];
  metadata?: {
    total_findings: number;
    failed_findings: number;
    passed_findings: number;
    critical_findings: number;
    high_findings: number;
    medium_findings: number;
    low_findings: number;
  };
  data?: string;
}

const SkeletonRow = () => (
  <TableRow>
    <TableCell className="animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="flex gap-2">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    </TableCell>
  </TableRow>
);

const GetAllRequest: React.FC = () => {
  const [requests, setRequests] = useState<ScanRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const resultData = [];
        const { data } = await api.get("/scan/getallrequest");
        for (let i = 0; i < data.length; i++) {
          resultData.push({
            _id: data[i]._id,
            audit_id: data[i].audit_id,
            status: data[i].status,
            report_s3_key: data[i].report_s3_key,
            report_s3_bucket: data[i].report_s3_bucket,
            report_s3_region: data[i].report_s3_region,
            report_files: data[i].report_files || [],
            metadata: data[i].metadata,
            ...data[i].user_info,
          });
        }
        setRequests(resultData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, []);

  const handleUpdateRequest = async (
    id: string,
    status: string,
    file: File | null
  ) => {
    try {
      const formData = new FormData();
      formData.append("status", status);
      if (file) {
        formData.append("file", file);
      }

      const response = await api.post(
        `/scan/scanRequests/${id}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(response.data);
      alert("File uploaded successfully");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleStatusChange = async (id: string, checked: boolean) => {
    try {
      const status = checked ? "completed" : "pending";
      await api.put(`/scan/scanRequests/${id}/update`, { status });
      setRequests(requests.map(req => req._id === id ? { ...req, status } : req));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleDeleteRequest = async (auditId: string) => {
    try {
      const response = await api.delete(`/scan/deleterequest/${auditId}`);
      if (response.status === 200) {
        alert("Request deleted successfully");
        setRequests(requests?.filter((request) => request.audit_id !== auditId));
      } else {
        alert("Failed to delete request");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while deleting the request");
    }
  };

  const handleDownloadReport = async (auditId: string, fileKey?: string) => {
    try {
      const response = await api.get(`/scan/scanRequests/${auditId}/raw-report`, {
        params: fileKey ? { key: fileKey } : undefined,
      });
      const { url } = response.data;
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error getting report link:", error);
      alert("Failed to get report link");
    }
  };

  const getReportLabel = (file: ReportFileMeta) => {
    if (file.type) return file.type.toUpperCase();
    if (file.filename) return file.filename;
    return "Download";
  };

  const handleViewResults = (auditId: string) => {
    setSelectedAuditId(auditId);
    setIsDialogOpen(true);
  };

  const filteredRequests = requests?.filter((request) =>
    request.name?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <input
        type="text"
        placeholder="Search by name..."
        className="w-full mb-4 px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Name
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Email
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Office Email
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Purpose
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Provider
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Status
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Total Findings
              </TableHead>
              <TableHead className="text-left text-blue dark:text-white">
                Failed Findings
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Report
              </TableHead>
              <TableHead className="text-left text-gray-900 dark:text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => <SkeletonRow key={index} />)
              : filteredRequests?.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium">
                      {request.name}
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{request.officeEmail}</TableCell>
                    <TableCell>{request.purpose}</TableCell>
                    <TableCell>{request.provider}</TableCell>
                    <TableCell>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={request.status === "completed"}
                          onChange={(e) =>
                            handleStatusChange(request._id, e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-gray-900 dark:text-white">
                          {request.status === "completed" ? (
                            <AiOutlineCheck className="text-green-500" />
                          ) : (
                            request.status
                          )}
                        </span>
                      </label>
                    </TableCell>
                    <TableCell>{request.metadata?.total_findings || 0}</TableCell>
                    <TableCell>{request.metadata?.failed_findings || 0}</TableCell>
                    <TableCell>
                      {request.report_files && request.report_files.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {request.report_files.map((file) => (
                            <button
                              key={file.key}
                              onClick={() => handleDownloadReport(request.audit_id, file.key)}
                              className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                            >
                              {getReportLabel(file)}
                            </button>
                          ))}
                        </div>
                      ) : request.report_s3_key ? (
                        <button
                          onClick={() => handleDownloadReport(request.audit_id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Download Report
                        </button>
                      ) : (
                        "N/A"
                      )}
                      {request.status === "completed" && (
                        <button
                          onClick={() => handleViewResults(request.audit_id)}
                          className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
                        >
                          View Results
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          className="text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-white"
                          onChange={(e) =>
                            handleUpdateRequest(
                              request._id,
                              request.status,
                              e.target.files && e.target.files[0]
                            )
                          }
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(request.audit_id);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Results</DialogTitle>
          </DialogHeader>
          {selectedAuditId && <EnhancedAuditDashboard auditId={selectedAuditId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GetAllRequest;
