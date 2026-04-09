

//@ts-nocheck
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Mail, Calendar, BarChart2, CheckCircle, XCircle } from "lucide-react";

// Mock user data
const users = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    plan: "Essential",
    onboardDate: "2023-01-15",
    scansInitiated: 25,
    scanHistory: [
      { date: "2023-06-01", status: "Completed", vulnerabilities: 3 },
      { date: "2023-05-15", status: "Completed", vulnerabilities: 1 },
      { date: "2023-04-30", status: "Failed", vulnerabilities: 0 },
    ],
    monthlyScans: [
      { month: "Jan", scans: 3 },
      { month: "Feb", scans: 5 },
      { month: "Mar", scans: 4 },
      { month: "Apr", scans: 6 },
    ],
  },
];

const planColors = {
  Essential: "bg-blue-100 text-blue-800",
  Advanced: "bg-green-100 text-green-800",
  Enterprise: "bg-purple-100 text-purple-800",
  default: "bg-gray-100 text-gray-800",
};

function UserProfile({ id }) {
  const user = users.find((u) => u.id === id);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{user.name}'s Profile</h1>

      {/* User Details */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Email" value={user.email} icon={<Mail />} />
        <Card
          title="Plan"
          value={<span className={`badge ${planColors[user.plan]}`}>{user.plan}</span>}
          icon={<BarChart2 />}
        />
        <Card title="Onboard Date" value={user.onboardDate} icon={<Calendar />} />
        <Card title="Total Scans" value={user.scansInitiated} icon={<BarChart2 />} />
      </div>

      {/* Monthly Scans Chart */}
      <div className="bg-white shadow rounded-md p-4">
        <h2 className="text-xl font-semibold">Monthly Scan History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={user.monthlyScans}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="scans" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scan History Table */}
      <div className="bg-white shadow rounded-md p-4">
        <h2 className="text-xl font-semibold">Recent Scans</h2>
        <table className="table-auto w-full border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border border-gray-200 px-4 py-2">Date</th>
              <th className="border border-gray-200 px-4 py-2">Status</th>
              <th className="border border-gray-200 px-4 py-2">Vulnerabilities</th>
            </tr>
          </thead>
          <tbody>
            {user.scanHistory.map((scan, index) => (
              <tr key={index}>
                <td className="border border-gray-200 px-4 py-2">{scan.date}</td>
                <td className="border border-gray-200 px-4 py-2">
                  {scan.status === "Completed" ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <XCircle className="mr-2 h-4 w-4" />
                      Failed
                    </span>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">{scan.vulnerabilities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="p-4 bg-white shadow rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {icon}
      </div>
      <div className="mt-2 text-lg font-bold">{value}</div>
    </div>
  );
}

export default UserProfile;
