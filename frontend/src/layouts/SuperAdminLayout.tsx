import Navbar from "@/components/Navbar/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Home, Users, LogOut } from "lucide-react";
import { PieChart, Activity } from "lucide-react";
import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { FaServer } from "react-icons/fa";
import { SiMicrosoftazure, SiGooglecloud } from "react-icons/si";

interface SuperAdminLayoutProps {
  children?: React.ReactNode;
}

// Add this new component for the background pattern
const AdminSecurityPattern = () => {
  const randomPositions = [
    { top: "10%", left: "10%" },
    { top: "20%", left: "70%" },
    { top: "30%", left: "25%" },
    { top: "40%", left: "85%" },
    { top: "50%", left: "15%" },
    { top: "60%", left: "65%" },
    { top: "70%", left: "35%" },
    { top: "80%", left: "75%" },
    { top: "90%", left: "45%" },
    { top: "15%", left: "40%" },
    { top: "25%", left: "55%" },
    { top: "35%", left: "30%" },
    { top: "45%", left: "80%" },
    { top: "55%", left: "20%" },
    { top: "65%", left: "60%" },
  ];

  return (
    <div className="w-full h-full overflow-hidden">
      {randomPositions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            fontSize: "40px",
            color: "rgba(0, 0, 0, 0.2)",
          }}
        >
          {index % 3 === 0 && <FaServer className="text-purple-900/25" />}
          {index % 3 === 1 && (
            <SiMicrosoftazure className="text-purple-900/25" />
          )}
          {index % 3 === 2 && <SiGooglecloud className="text-purple-900/25" />}
        </div>
      ))}
    </div>
  );
};

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = () => {
  const [currentPage, setCurrentPage] = useState<string>("myscan");
  const auth = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  console.log("Current Page:", currentPage);
  console.log(location.pathname);

  const sidebarItems = [
    { title: "Home", href: "/superadmin", icon: Home },
    { title: "User Management", href: "/superadmin/user-data", icon: Users },
    {
      title: "Audit Overview",
      href: "/superadmin/subscription-plan-analytics",
      icon: PieChart,
    },
    {
      title: "Platform Logs",
      href: "/superadmin/platform-logs",
      icon: Activity,
    },
  ];

  const handleLogout = () => {
    auth?.logout();
    navigate("/");
    toast({
      title: `Logged out ${auth?.user?.name}`,
    });
    navigate("/");
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment);
    const breadcrumbs = pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
      return {
        label:
          segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " "),
        path,
      };
    });
    return breadcrumbs;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <Navbar />
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-[20%] bg-[#2D1A4D] dark:bg-[#1a1f28] text-white flex flex-col relative overflow-hidden">
          {/* Abstract background pattern */}
          <div className="absolute inset-0 opacity-2">
            <AdminSecurityPattern />
          </div>

          {/* Sidebar content */}
          <div className="relative z-10">
            <div className="p-4">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>

            <div className="flex-1 px-3">
              <ul className="space-y-2">
                {sidebarItems.map((item) => (
                  <li key={item.title}>
                    <button
                      onClick={() => {
                        navigate(item.href);
                        setCurrentPage(item.title.toLowerCase());
                      }}
                      className={`w-full flex items-center px-4 py-2.5 rounded-md transition-colors ${
                        location.pathname === item.href
                          ? "bg-white text-[#6E2EE5]"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto bg-gray-50 dark:bg-gray-900">
          {/* Breadcrumb */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Home
                </Link>
              </li>
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <li className="text-gray-500 dark:text-gray-400">/</li>
                  <li>
                    <Link
                      to={crumb.path}
                      className={`hover:text-gray-700 dark:hover:text-gray-300 ${
                        index === getBreadcrumbs().length - 1
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {crumb.label}
                    </Link>
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
