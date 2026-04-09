import React, { useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import GetAllRequest from "../GetAllRequest/GetAllRequest";
import UserList from "./UsersandDelete";
import SuperAdminGraph from "./SuperAdminGraph";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";



const SuperAdmin: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<string>("myscan");
    const auth = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();


    const renderPage = () => {
        switch (currentPage) {
            case "Graph":
                return <SuperAdminGraph />;
            case "User List":
                return <UserList />;
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
                <div className="w-[20%] bg-gray-200 p-4 flex flex-col justify-between">
                    <ul>
                    <li
                            className={`cursor-pointer text-center py-3 ${
                                currentPage === "Graph" ? "p-2 justify-center rounded-md bg-white font-bold text-[#2351E5]" : ""
                            }`}
                            onClick={() => setCurrentPage("Graph")}
                        >
                            <span className="text-lg">Dashboard</span>
                        </li>
                        <li
                            className={`cursor-pointer text-center py-3 ${
                                currentPage === "User List" ? "p-2 justify-center rounded-md bg-white font-bold text-[#2351E5]" : ""
                            }`}
                            onClick={() => setCurrentPage("User List")}
                        >
                            <span className="text-lg">User List</span>
                        </li>
                        <li
                            className={`cursor-pointer text-center py-3 ${
                                currentPage === "Scan List" ? "p-2 justify-center rounded-md bg-white font-bold text-[#2351E5]" : ""
                            }`}
                            onClick={() => setCurrentPage("Scan List")}
                        >
                            <span className="text-lg">Scan List</span>
                        </li>
                    </ul>
                    <div className="flex justify-center mb-20">
                <Button onClick={handleLogout} >Logout</Button>
            </div>
                </div>
                <div className="flex-1 p-4 flex ">
                    {renderPage()}
                </div>
            </div>
        </>
    );
};

export default SuperAdmin;
