import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const subscriptionData = [
  { plan: "Essential", users: 500, color: "#3B82F6" },
  { plan: "Advanced", users: 300, color: "#10B981" },
  { plan: "Enterprise", users: 100, color: "#8B5CF6" },
  { plan: "Flexi", users: 200, color: "#F59E0B" },
]

const monthlyGrowthData = [
  { month: "Jan", Essential: 400, Advanced: 200, Enterprise: 50, Flexi: 150 },
  { month: "Feb", Essential: 450, Advanced: 250, Enterprise: 75, Flexi: 175 },
  { month: "Mar", Essential: 480, Advanced: 280, Enterprise: 90, Flexi: 190 },
  { month: "Apr", Essential: 500, Advanced: 300, Enterprise: 100, Flexi: 200 },
]

export default function SubscriptionAnalytics() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Subscription Plan Analytics</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  dataKey="users"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Subscription Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGrowthData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Essential" stackId="a" fill="#3B82F6" />
                <Bar dataKey="Advanced" stackId="a" fill="#10B981" />
                <Bar dataKey="Enterprise" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="Flexi" stackId="a" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

