import React, { useEffect, useState } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdCloudUpload } from "react-icons/md";
import api from "@/lib/api";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

interface ScanRequest {
    _id: string;
    name: string;
    email: string;
    purpose: string;
    officeEmail: string;
    officePassword: string;
    status: string;
    data?: string;
}

const Admin: React.FC = () => {
    const [requests, setRequests] = useState<ScanRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        async function fetchRequests() {
            try {
                const response = await api.get("/scan/getallrequest");
                setRequests(response.data);
            } catch (error) {
                console.error("Error:", error);
            }
        }

        fetchRequests();
    }, []);

    const handleUpdateRequest = async (
        id: string,
        status: string,
        file: File | null
    ) => {
        try {
            const formData = new FormData();
            formData.append("status", status);
            if (file) {
                formData.append("file", file);
            }

            const response = await api.post(
                `/scan/scanRequests/${id}/upload`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log(response.data);
            alert("File uploaded successfully");
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        try {
            await api.delete("/deleterequest", { data: { id } });
            setRequests(requests.filter((request) => request._id !== id));
            alert("Scan request deleted successfully");
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleStatusChange = (id: string, isChecked: boolean) => {
        const newStatus = isChecked ? "Complete" : "Pending";
        setRequests(
            requests.map((request) =>
                request._id === id ? { ...request, status: newStatus } : request
            )
        );
    };

    const filteredRequests = requests.filter((request) =>
        request.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
        <Navbar/>
           
            <div className="container mx-auto p-4">
                <input
                    type="text"
                    placeholder="Search by name..."
                    className="w-full mb-4 px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring focus:border-blue-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Purpose</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((request) => (
                            <tr key={request._id} className="border-b">
                                <td className="p-3">{request.name}</td>
                                <td className="p-3">{request.email}</td>
                                <td className="p-3">{request.purpose}</td>
                                <td className="p-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={request.status === "Complete"}
                                            onChange={(e) =>
                                                handleStatusChange(request._id, e.target.checked)
                                            }
                                            className="mr-2"
                                        />
                                        {request.status === "Complete" ? (
                                            <AiOutlineCheck className="text-green-500" />
                                        ) : (
                                            "Pending"
                                        )}
                                    </label>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center">
                                        <input
                                            type="file"
                                            className="mr-2"
                                            onChange={(e) =>
                                                handleUpdateRequest(
                                                    request._id,
                                                    request.status,
                                                    e.target.files &&
                                                        e.target.files[0]
                                                )
                                            }
                                        />
                                        <button
                                            onClick={() => handleDeleteRequest(request._id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-md mr-2"
                                        >
                                            <RiDeleteBin6Line className="inline-block mr-1" />
                                            Delete
                                        </button>
                                        <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
                                            <MdCloudUpload className="inline-block mr-1" />
                                            Upload
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Footer/>
        </>
    );
};

export default Admin;
