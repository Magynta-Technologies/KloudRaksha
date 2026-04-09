import Navbar from "@/components/Navbar/Navbar";

import React, {  } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { ChevronRight } from "lucide-react";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment);

    // Custom mapping for breadcrumb labels
    const labelMap: { [key: string]: string } = {
      admin: "Scan List",
      "scan-requests": "Scan Requests",
      settings: "Settings",
      profile: "Profile",
    };

    const breadcrumbs = pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      const label =
        labelMap[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      return { label, path };
    });

    return breadcrumbs;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <Navbar />
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          {/* Breadcrumb */}
          <div className="px-8 py-4 border-b bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
            <nav className="max-w-[1920px] mx-auto">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-sm font-medium"
                  >
                    Scan List
                  </Link>
                </li>
                {getBreadcrumbs()
                  .slice(1)
                  .map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      <li className="text-gray-400">
                        <ChevronRight className="h-4 w-4" />
                      </li>
                      <li>
                        <Link
                          to={crumb.path}
                          className={`text-sm font-medium ${
                            index === getBreadcrumbs().length - 2
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          }`}
                        >
                          {crumb.label}
                        </Link>
                      </li>
                    </React.Fragment>
                  ))}
              </ol>
            </nav>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
