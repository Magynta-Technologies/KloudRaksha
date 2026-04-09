import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
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
import { FileText } from "lucide-react";




const COLORS = ["#0088FE", "#FF8042", "#FFBB28"];

export default function PlatformLogs() {
  const [logsData, setLogsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const {
          data: { data },
        } = await api.get("/superadmin/platform-logs");
        setLogsData(data);
      } catch (error) {
        console.error("Error fetching audit data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold">Platform Logs</h2>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logs by Count</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-600">
            Total Actions:{" "}
            {logsData?.auditOverview.reduce(
              (acc: number, curr: any) => acc + curr.value,
              0
            )}
          </p>
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Logs Distribution by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={logsData?.auditOverview}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="_id"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {logsData?.auditOverview.map((_: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Audit History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsData?.auditHistory.map((audit: any) => (
                <TableRow
                  key={audit._id}
                  className="hover:bg-gray-100 transition duration-200"
                >
                  <TableCell>
                    {new Date(audit.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(audit.date).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{audit.userName}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                        audit.status === "Passed"
                          ? "bg-green-100 text-green-800"
                          : audit.status === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {audit.status}
                    </span>
                  </TableCell>
                  <TableCell>{audit.type}</TableCell>
                  <TableCell>
                    {audit.reportUrl && (
                      <Button
                        onClick={() => window.open(audit.reportUrl, "_blank")}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" /> Download Report
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
