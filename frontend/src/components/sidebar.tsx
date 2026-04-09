import { NavLink } from "react-router-dom";
import { Home, Users, PieChart } from "lucide-react";

// Navigation items
const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "User Data", href: "/user-data", icon: Users },
  { name: "Subscription Analytics", href: "/subscription-analytics", icon: PieChart },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-md dark:bg-gray-800">
      {/* Sidebar Header */}
      <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Analytics</h1>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="p-4 space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${
                    isActive
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                      : ""
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
