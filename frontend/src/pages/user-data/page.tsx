//@ts-nocheck

import { Link } from "react-router-dom";

// Example users data
const users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", plan: "Essential", onboardDate: "2023-01-15", scansInitiated: 25 },
  { id: 2, name: "Bob Smith", email: "bob@example.com", plan: "Advanced", onboardDate: "2023-02-20", scansInitiated: 42 },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", plan: "Enterprise", onboardDate: "2023-03-10", scansInitiated: 78 },
  { id: 4, name: "Diana Ross", email: "diana@example.com", plan: "Flexi", onboardDate: "2023-04-05", scansInitiated: 15 },
  { id: 5, name: "Edward Norton", email: "edward@example.com", plan: "Essential", onboardDate: "2023-05-12", scansInitiated: 31 },
];

// Function to determine badge color based on the plan
const getPlanColor = (plan) => {
  switch (plan) {
    case "Essential":
      return "bg-blue-100 text-blue-800";
    case "Advanced":
      return "bg-green-100 text-green-800";
    case "Enterprise":
      return "bg-purple-100 text-purple-800";
    case "Flexi":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Component to render a badge
const Badge = ({ className, children }) => (
  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${className}`}>
    {children}
  </span>
);

// Component to render a button
const Button = ({ children }) => (
  <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100">
    {children}
  </button>
);

export default function UserData() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">User Data</h1>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border-b text-left">Name</th>
            <th className="px-4 py-2 border-b text-left">Email</th>
            <th className="px-4 py-2 border-b text-left">Plan</th>
            <th className="px-4 py-2 border-b text-left">Onboard Date</th>
            <th className="px-4 py-2 border-b text-left">Scans Initiated</th>
            <th className="px-4 py-2 border-b text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-2 border-b font-medium">{user.name}</td>
              <td className="px-4 py-2 border-b">{user.email}</td>
              <td className="px-4 py-2 border-b">
                <Badge className={getPlanColor(user.plan)}>{user.plan}</Badge>
              </td>
              <td className="px-4 py-2 border-b">{user.onboardDate}</td>
              <td className="px-4 py-2 border-b">{user.scansInitiated}</td>
              <td className="px-4 py-2 border-b">
                <Button>
                  <Link to={`/user-data/${user.id}`}>View Profile</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
