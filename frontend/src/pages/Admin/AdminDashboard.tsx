import React, { useState } from "react";
import GetAllRequest from "../GetAllRequest/GetAllRequest";
import AdminGraph from "./AdminGraph";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar/Navbar";



const Admin: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<string>("myscan");
    const auth = useAuth();
    const {toast} = useToast();
    const navigate = useNavigate();

    const renderPage = () => {
        switch (currentPage) {
            case "Dashboard":
                return <AdminGraph />;
            case "Scan List":
                return <GetAllRequest />;
            default:
                return null;
        }
    };
    const handleLogout = () => {
        auth?.logout();
        navigate('/');
        toast({
            title : `Logged out ${auth?.user?.name}`
        })
        navigate("/")
    };

    return (
        <>
        <Navbar/>
            <div className="flex h-screen">
                <div className="w-1/4 bg-gray-200 p-4">
                    <ul>
                        <li
                            className={`cursor-pointer text-center py-3 ${
                                currentPage === "Dashboard" ? "p-2 justify-center rounded-md bg-white font-bold text-[#2351E5]" : ""
                            }`}
                            onClick={() => setCurrentPage("Dashboard")}
                        >
                            <span className="text-lg">
                                Dashboard
                            </span>
                        </li>
                        <li
                            className={`cursor-pointer text-center py-3 ${
                                currentPage === "Scan List" ? "px-2 justify-center rounded-md bg-white font-bold text-[#2351E5]" : ""
                            }`}
                            onClick={() => setCurrentPage("Scan List")}
                        >
                            <span className="text-lg">Scan List</span>
                        </li>
                    </ul>
                    <div className="flex justify-center mt-10">
                <Button onClick={handleLogout} >Logout</Button>
            </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 flex ">
                    {renderPage()}
                </div>
            </div>
        </>
    );
};

export default Admin; 
