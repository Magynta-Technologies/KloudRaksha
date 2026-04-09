import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { Users, CheckCircle2, FileCheck, Inbox } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import { motion } from "framer-motion";


export default function Home() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { data: overviewData },
        } = await api.get("/superadmin/dashboard-overview");

        const dashboardData = {
          stats: overviewData.stats,
          subscriptionDistribution: overviewData.subscriptionDistribution,
          userGrowthData: [
            ...overviewData.userGrowth.map((item: any) => ({
              //@ts-ignore
              name: getMonthName(item["_id"].month),
              daily: item.daily,
              weekly: item.weekly,
              monthly: item.monthly,
            })),
          ],
          auditCompletion:
            overviewData.auditCompletion.length > 0
              ? overviewData.auditCompletion
              : [],
        };
        console.log("dashboardData", dashboardData);
        setDashboardData(dashboardData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-card text-card-foreground rounded-lg shadow-lg dark:border dark:border-gray-800"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Platform Overview
              </h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white">
                  <div className="space-y-4">
                    {/* Role Distribution */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                        User Demographics
                      </h4>
                      <div className="space-y-2">
                        {dashboardData?.stats?.totalUsers[0]?.roleDistribution?.map(
                          (role: any) => (
                            <div
                              key={role._id}
                              className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize text-sm">
                                  {role._id}
                                </span>
                              </div>
                              <Badge
                                variant="secondary"
                                className="bg-primary/10"
                              >
                                {role.count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Subscription Distribution */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                        Plan Distribution
                      </h4>
                      <div className="space-y-2">
                        {dashboardData?.subscriptionDistribution?.map(
                          (sub: any) => (
                            <div
                              key={sub._id}
                              className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{sub.planName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/10"
                                >
                                  {sub.users}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {(
                                    (sub.users /
                                      dashboardData?.stats?.totalUsers[0]
                                        ?.totalCount[0]?.count) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </Badge>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Total Active Users */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Active Users
                        </span>
                        <span className="font-semibold">
                          {
                            dashboardData?.stats?.totalUsers[0]?.totalCount[0]
                              ?.count
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Key metrics and platform statistics
            </p>
          </div>
          <div className="flex gap-12">
            {/* Total Users */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-1">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                {dashboardData?.stats?.totalUsers[0]?.totalCount[0]?.count || 0}
              </p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Users
              </p>
            </div>

            {/* Active Subscriptions */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-1">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                {dashboardData?.stats?.activeSubscriptions[0]?.count || 0}
              </p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Active Subscriptions
              </p>
            </div>

            {/* Reviewed Requests */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mx-auto mb-1">
                <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
                {dashboardData?.stats?.reviewedRequests?.[0]?.count || 0}
              </p>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Reviewed Requests
              </p>
            </div>

            {/* Pending Requests */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-1">
                <Inbox className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-400 dark:from-red-400 dark:to-red-300 bg-clip-text text-transparent">
                {dashboardData?.stats?.pendingRequests?.[0]?.count || 0}
              </p>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Pending Requests
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscriber Distribution */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Subscriber Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData?.subscriptionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="planName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Audit Completion */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Audit Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {dashboardData?.auditCompletion && (
                <PieChart>
                  <Pie
                    data={dashboardData?.auditCompletion}
                    dataKey="value"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    label
                  >
                    {dashboardData?.auditCompletion?.map(
                      //@ts-ignore
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#4ade80", "#f87171", "#fbbf24"][index % 3]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* User Growth Chart */}
      <div>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="daily"
                  stroke="#8884d8"
                  name="Daily"
                />
                <Line
                  type="monotone"
                  dataKey="weekly"
                  stroke="#82ca9d"
                  name="Weekly"
                />
                <Line
                  type="monotone"
                  dataKey="monthly"
                  stroke="#ffc658"
                  name="Monthly"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
