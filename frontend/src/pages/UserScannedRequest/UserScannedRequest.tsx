import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import api from "@/lib/api";
import ScanRequestItem from "./ScanRequestItem";

interface ScanRequest {
    _id: string;
    name: string;
    email: string;
    purpose: string;
    officeEmail: string;
    officePassword: string;
    status: string;
    data: string;
}

const ScanRequestList: React.FC = () => {
    const [scanRequests, setScanRequests] = useState<ScanRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScanRequests();
    }, []);

    const fetchScanRequests = async () => {
        try {
            const response = await api.get("/scan/usr");
            setScanRequests(response.data.scanRequests);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch scan requests:", error);
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-8">Scan Requests</h1>
            {loading ? (
                <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    <p>Loading...</p>
                </div>
            ) : scanRequests.length === 0 ? (
                <p>No scan requests yet. Create a new one.</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Id</th>
                            <th className="border px-4 py-2">Name</th>
                            <th className="border px-4 py-2">Email</th>
                            <th className="border px-4 py-2">Purpose</th>
                            <th className="border px-4 py-2">Status</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scanRequests.map((request) => (
                            <ScanRequestItem
                                key={request._id}
                                request={request}
                            />
                        ))}
                    </tbody>
                </table>
            )}
            <div className="mt-8">
                {/* Add more content or actions here */}
            </div>
        </div>
    );
};

export default ScanRequestList;
