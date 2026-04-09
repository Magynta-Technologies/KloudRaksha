import React, { useState } from "react";
import Dashboard2 from "./NewScan";
import Dashboard4 from "../Dashboard/MyScan";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HelpPage from "./HelpPage";
import FooterForDashboard from "@/components/Footer/FooterForDashboard";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar/Navbar";

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>("myscan");
  const navigate = useNavigate();
  const { toast } = useToast();

  const auth = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case "myscan":
        return <Dashboard4 />;
      case "newscan":
        return <Dashboard2 />;
      case "Help":
        return <HelpPage />;
      default:
        return null;
    }
  };

  const handleLogout = () => {
    auth?.logout();
    navigate("/");
    toast({
      title: `Logged out ${auth?.user?.name}`,
    });
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[88vh]">
        <div className="w-[20%] bg-gray-200 p-4 flex flex-col justify-between">
          <ul>
            <li
              className={`cursor-pointer text-center py-3 ${
                currentPage === "myscan"
                  ? "p-2 justify-center rounded-md bg-white font-bold text-[#2351E5]"
                  : ""
              }`}
              onClick={() => setCurrentPage("myscan")}
            >
              <span className="text-lg">My Scan</span>
            </li>
            <li
              className={`cursor-pointer text-center py-3 ${
                currentPage === "newscan"
                  ? " p-2 justify-center rounded-md bg-white font-bold text-[#2351E5]"
                  : ""
              }`}
              onClick={() => setCurrentPage("newscan")}
            >
              <span className="text-lg">New Scan</span>
            </li>
            <li
              className={`cursor-pointer text-center py-3 ${
                currentPage === "Help"
                  ? "fp-2 justify-center rounded-md bg-white font-bold text-[#2351E5]"
                  : ""
              }`}
              onClick={() => setCurrentPage("Help")}
            >
              <span className="text-lg">Help</span>
            </li>
          </ul>
          <div className="flex justify-center mb-20">
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 flex">{renderPage()}</div>
      </div>
      <FooterForDashboard />
    </>
  );
};

export default Dashboard;
