import Navbar from "@/components/Navbar/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import React, { useState,} from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { FaChartPie } from "react-icons/fa";

import {
  ScanIcon,
  PlusCircleIcon,
  LogOutIcon,
  HelpCircle,
} from "lucide-react";

interface UserLayoutProps {
  children?: React.ReactNode;
}

import { FaAws } from "react-icons/fa";
import { SiMicrosoftazure, SiGooglecloud } from "react-icons/si";

const CloudSecurityPattern = () => {
  const randomPositions = [
    { top: "5%", left: "5%" },
    { top: "15%", left: "65%" },
    { top: "25%", left: "72%" },
    { top: "35%", left: "18%" },
    { top: "45%", left: "5%" },
    { top: "55%", left: "75%" },
    { top: "65%", left: "85%" },
    { top: "75%", left: "95%" },
    { top: "85%", left: "88%" },
    { top: "95%", left: "12%" },
    { top: "5%", left: "4%" },
    { top: "15%", left: "5%" },
    { top: "25%", left: "25%" },
    { top: "35%", left: "88%" },
    { top: "45%", left: "55%" },
    { top: "55%", left: "23%" },
    { top: "65%", left: "44%" },
    { top: "75%", left: "19%" },
    { top: "85%", left: "20%" },
    { top: "95%", left: "32%" },
  ];

  return (
    <div className="w-full h-full overflow-hidden">
      {/* Randomly positioned icons */}
      {randomPositions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            fontSize: "45px",
            color: "rgba(0, 0, 0, 0.2)", // Subtle coloring
          }}
        >
          {/* Randomly pick an icon */}
          {index % 3 === 0 && <FaAws className="text-blue-900/25" />}
          {index % 3 === 1 && <SiMicrosoftazure className="text-blue-900/25" />}
          {index % 3 === 2 && <SiGooglecloud className="text-blue-900/25" />}
        </div>
      ))}
    </div>
  );
};

const UserLayout: React.FC<UserLayoutProps> = () => {
  const auth = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState(() => {
    const path = location.pathname.split("/")[2] || "overview";
    return path;
  });

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
    const breadcrumbs = pathSegments
      .map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
        if (path.startsWith("/user/")) {
          return {
            label:
              segment.charAt(0).toUpperCase() +
              segment.slice(1).replace("-", " "),
            path,
          };
        }
        return {
          label: "Overview",
          path: "/user",
        };
      })
      .filter(Boolean);

    return breadcrumbs.slice(-1);
  };

  const sidebarItems = [
    {
      title: "Overview",
      href: "/user",
      icon: FaChartPie,
      variant: "default",
    },
    {
      title: "My Scan",
      href: "/user/my-scans",
      icon: ScanIcon,
      variant: "default",
    },
    {
      title: "New Scan",
      href: "/user/new-scan",
      icon: PlusCircleIcon,
      variant: "default",
    },
    {
      title: "FAQ",
      href: "/user/faq",
      icon: HelpCircle,
      variant: "default",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-[20%] bg-[#1A1F4D] dark:bg-[#1a1f28] text-white flex flex-col relative overflow-hidden">
          {/* Abstract background pattern */}
          <div className="absolute inset-0 opacity-2">
            <CloudSecurityPattern />
          </div>

          {/* Existing sidebar content - just adding position relative to stay above pattern */}
          <div className="relative z-10">
            <div className="p-4">
              <h1 className="text-xl font-bold">User Dashboard</h1>
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
                        currentPage === item.title.toLowerCase()
                          ? "bg-white text-[#2351E5]"
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
                <LogOutIcon className="w-5 h-5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Breadcrumb */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <li className="text-gray-500">/</li>
                  <li>
                    <Link
                      to={crumb.path}
                      className={`hover:text-gray-700 ${
                        index === getBreadcrumbs().length - 1
                          ? "text-[#2351E5] font-semibold"
                          : "text-gray-500"
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
    </>
  );
};

export default UserLayout;
