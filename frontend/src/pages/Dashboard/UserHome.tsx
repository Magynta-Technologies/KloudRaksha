//@ts-nocheck

"use client";


import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarIcon, ChevronRight } from "lucide-react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import api from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const severityColors = {
  Critical: "#FF4444",
  High: "#FF8888",
  Medium: "#FFA500",
  Low: "#FFD700",
};

interface ScanOverviewResponse {
  donutData: {
    pass: number;
    fail: number;
  };
  severityData: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trendData: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  scanUsage: {
    used: number;
    remaining: number;
    total: number;
  };
}

export default function ScanOverview() {
  const [date, setDate] = useState<Date>(new Date());
  const [account, setAccount] = useState<string>("All");
  const [region, setRegion] = useState<string>("All");
  const [includeMuted, setIncludeMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<ScanOverviewResponse | null>(
    null
  );
  const { theme } = useTheme();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await api.get("/scan/overview");
        setOverviewData(response.data);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  // Donut chart data with dark mode colors
  const donutData = {
    labels: ["Pass", "Fail"],
    datasets: [
      {
        data: [
          overviewData?.donutData.pass || 0,
          overviewData?.donutData.fail || 0,
        ],
        backgroundColor: ["#4CAF50", "#FF5252"],
        borderWidth: 0,
      },
    ],
  };

  // Bar chart data for severity with dark mode colors
  const barData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        data: [
          overviewData?.severityData.critical || 0,
          overviewData?.severityData.high || 0,
          overviewData?.severityData.medium || 0,
          overviewData?.severityData.low || 0,
        ],
        backgroundColor: [
          severityColors.Critical,
          severityColors.High,
          severityColors.Medium,
          severityColors.Low,
        ],
        borderWidth: 0,
      },
    ],
  };

  // Line chart data with dark mode colors
  const lineData = {
    labels: overviewData?.trendData.map((item) => item.date) || [],
    datasets: [
      {
        label: "Low",
        data: overviewData?.trendData.map((item) => item.low) || [],
        backgroundColor: "rgba(255, 215, 0, 0.1)",
        borderColor: "#FFD700",
        fill: "origin",
        order: 4,
      },
      {
        label: "Medium",
        data: overviewData?.trendData.map((item) => item.medium) || [],
        backgroundColor: "rgba(255, 165, 0, 0.1)",
        borderColor: "#FFA500",
        fill: "origin",
        order: 3,
      },
      {
        label: "High",
        data: overviewData?.trendData.map((item) => item.high) || [],
        backgroundColor: "rgba(255, 136, 136, 0.1)",
        borderColor: "#FF8888",
        fill: "origin",
        order: 2,
      },
      {
        label: "Critical",
        data: overviewData?.trendData.map((item) => item.critical) || [],
        backgroundColor: "rgba(255, 68, 68, 0.1)",
        borderColor: "#FF4444",
        fill: "origin",
        order: 1,
      },
    ],
  };

  // Single chartTheme declaration with theme-aware colors
  const chartTheme = {
    color: theme === "dark" ? "#ffffff" : "#000000", // Explicit colors for better contrast
    font: {
      family: "inherit",
      size: 12,
    },
  };

  // Chart options with proper dark mode support
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          ...chartTheme,
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        color: chartTheme.color,
        font: {
          size: 16,
          weight: "normal",
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          display: false,
        },
        ticks: {
          ...chartTheme,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          ...chartTheme,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          display: false,
        },
        ticks: {
          ...chartTheme,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 300,
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          ...chartTheme,
          stepSize: 50,
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          ...chartTheme,
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        color: chartTheme.color,
        font: {
          size: 16,
          weight: "normal",
        },
      },
    },
  };

  // Add these specialized skeleton components
  const DonutChartSkeleton = ({ height }: { height: number }) => (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: height, height: height }}>
        <Skeleton className="absolute inset-0 rounded-full" />
        <Skeleton className="absolute inset-[25%] rounded-full bg-background" />
      </div>
      <div className="flex gap-4 justify-center">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );

  const BarChartSkeleton = ({ height }: { height: number }) => (
    <div className="flex items-center justify-end h-[200px] space-x-4">
      <div className="space-y-4">
        {["Critical", "High", "Medium", "Low"].map((label) => (
          <Skeleton key={label} className="h-4 w-16" />
        ))}
      </div>
      <div className="flex-1 flex items-center space-x-2 h-full">
        {[40, 60, 75, 50].map((width, i) => (
          <Skeleton key={i} className={`h-8 w-[${width}%]`} />
        ))}
      </div>
    </div>
  );

  const LineChartSkeleton = ({ height }: { height: number }) => (
    <div className="space-y-4">
      <div className="h-[250px] relative">
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-0.5 w-full opacity-20" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Scan Usage and Plan Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-card text-card-foreground rounded-lg shadow dark:border dark:border-gray-800"
      >
        <div className="flex justify-between items-start">
          {isLoading ? (
            <>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium mb-2">Scan Usage</h2>
                  <p className="text-sm text-muted-foreground">
                    Track your security scan consumption
                  </p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500 dark:text-blue-400">
                    {overviewData?.scanUsage.used || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Scans Used</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                    {overviewData?.scanUsage.remaining || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Scans Remaining
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500 dark:text-green-400">
                    {overviewData?.scanUsage.total || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Scans</p>
                </div>
              </div>
            </>
          )}
        </div>
        <hr className="my-4 mx-4 border-border dark:border-gray-800" />
        {isLoading ? (
          <div className="flex justify-between w-full">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-32" />
            ))}
          </div>
        ) : (
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Plan Type:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                Enterprise
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Renewal Date:
              </span>
              <span className="text-sm font-bold">March 15, 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Billing Cycle:
              </span>
              <span className="text-sm font-bold">Monthly</span>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        {/* Findings by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-card text-card-foreground rounded-lg shadow dark:border dark:border-gray-800"
        >
          <h2 className="text-lg font-medium mb-4">Findings by Status</h2>
          <div className="relative" style={{ height: "200px" }}>
            {isLoading ? (
              <DonutChartSkeleton height={200} />
            ) : (
              <Doughnut data={donutData} options={donutOptions} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Distribution of passing and failing security checks across your
            infrastructure
          </p>
        </motion.div>

        {/* Findings by Severity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-card text-card-foreground rounded-lg shadow dark:border dark:border-gray-800"
        >
          <h2 className="text-lg font-medium mb-4">Findings by Severity</h2>
          <div className="relative" style={{ height: "200px" }}>
            {isLoading ? (
              <BarChartSkeleton height={200} />
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Breakdown of security findings categorized by their risk level
          </p>
        </motion.div>
      </div>

      {/* Findings Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-card text-card-foreground rounded-lg shadow dark:border dark:border-gray-800"
      >
        <h2 className="text-lg font-medium mb-4">Findings Over Time</h2>
        <div style={{ height: "300px" }}>
          {isLoading ? (
            <LineChartSkeleton height={300} />
          ) : (
            <Line data={lineData} options={lineOptions} />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Trend analysis of security findings across different severity levels
          over time
        </p>
      </motion.div>
    </div>
  );
}
