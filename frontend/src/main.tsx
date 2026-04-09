import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import About from "./pages/About/About";
import ErrorPage from "./pages/ErrorPage/ErrorPage.tsx";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard.tsx";
import UserScans from "./pages/Dashboard/MyScan.tsx";
import NewScan from "./pages/Dashboard/NewScan.tsx";

import Auth from "./pages/Auth/Auth.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import Plans from "./pages/Plans/Plans.tsx";
import Help from "./pages/Help/Help.tsx";
import ProtectedRouteAdmin from "./components/ProtectedRoute/ProtectedRouteAdmin.tsx";
import ProtectedRouteSuperAdmin from "./components/ProtectedRoute/ProtectedRouteSuperAdmin.tsx";
import ContactPage from "./pages/contact/contact.tsx";
import ScanOverview from "./pages/Dashboard/UserHome.tsx";
import SupportPage from "./pages/Support/Support.tsx";
import Preloader from "./components/PreLoader/Preloader.tsx";
import { useEffect, useState } from "react";
import UserProfile from "./pages/Profilepage/Profile.tsx";
import DashboardTest from "./pages/Test-Dashboard/DashboardTest.tsx";
import EnhancedAuditDashboard from "./components/AudtResults/AdminAuditResults.tsx";

import AdminLayout from "./layouts/AdminLayout.tsx";
import UserLayout from "./layouts/UserLayout.tsx";
import UserDashboard from "./components/AudtResults/UserAuditResults.tsx";
import SuperAdminLayout from "./layouts/SuperAdminLayout.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import SuperAdminUserData from "@/components/Dashboard/UserData.tsx";
import Home from "./components/Dashboard/Home.tsx";
import SubscriptionPlanAnalytics from "./components/Dashboard/AuditReport.tsx";
import PlatformLogs from "./components/Dashboard/PlatformLogs.tsx";
import { ThemeProvider } from "./components/ThemeProvider";
import FAQPage from "./pages/Help/FAQPage.tsx";
import ScanKanban from "./components/Kanban/Kanban";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route path="" element={<App />} />
      <Route path="about" element={<About />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/audit/:id"
        element={
          <ProtectedRoute>
            <EnhancedAuditDashboard />
          </ProtectedRoute>
        }
      ></Route>
      <Route path="help" element={<Help />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="payment" element={<Plans />} />
      {/* <Route
        path="superadmin"
        element={
          <ProtectedRouteSuperAdmin>
            <SuperAdmin />
          </ProtectedRouteSuperAdmin>
        }
      /> */}
      <Route path="/dashboard-test" element={<DashboardTest />} />
      {/* <Route
        path="user"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      /> */}
      {/* <Route
        path="admin"
        element={
          <ProtectedRouteAdmin>
            <AdminDashboard />
          </ProtectedRouteAdmin>
        }
      /> */}
      <Route path="auth" element={<Auth />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="*" element={<ErrorPage />} />

      {/* Super Admin Layout */}
      <Route
        path="superadmin"
        element={
          <ProtectedRouteSuperAdmin>
            <SuperAdminLayout />
          </ProtectedRouteSuperAdmin>
        }
      >
        <Route index element={<Home />} />
        <Route path="user-data" element={<SuperAdminUserData />} />
        <Route
          path="subscription-plan-analytics"
          element={<SubscriptionPlanAnalytics />}
        />
        <Route path="platform-logs" element={<PlatformLogs />} />
      </Route>

      {/* Admin Layout */}
      <Route
        path="admin"
        element={
          <ProtectedRouteAdmin>
            <AdminLayout />
          </ProtectedRouteAdmin>
        }
      >
        <Route index element={<ScanKanban />} />
        <Route path=":id" element={<EnhancedAuditDashboard />} />
      </Route>

      {/* User Layout */}
      <Route
        path="user"
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ScanOverview />} />
        <Route path="my-scans" element={<UserScans />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="new-scan" element={<NewScan />} />
        <Route path=":id" element={<UserDashboard />} />
        <Route path="faq" element={<FAQPage />} />
      </Route>
    </Route>
  )
);

const Root = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating some loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <React.StrictMode>
      {loading ? (
        <Preloader />
      ) : (
        <>
          <ThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <RouterProvider router={router} />
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </>
      )}
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
//superadmin
// {
//   "name": "bhattad Parth",
//   "email": "bhattadparth1420@gmail.com",
//   "password":"bhattadparth20"
// }

//admin
// {
//   "name":"bhattad Parth",
//   "password":"bhattadparth20",
//   "email":"bhattadparth142024@gmail.com"
// }
