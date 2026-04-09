// src/components/ScanRequestList.tsx

import React, { useState, useEffect } from "react";
import api from "@/lib/api";

const ScanRequestList: React.FC = () => {
    const [scanRequests, setScanRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchScanRequests();
    }, []);

    const fetchScanRequests = async () => {
        try {
            const response = await api.get("/scan/getallrequest");
            setScanRequests(response.data);
        } catch (error) {
            console.error("Error fetching scan requests:", error);
        }
    };

    const deleteScanRequest = async (scanRequestId: string) => {
        try {
            await api.delete(`/api/scan-requests/${scanRequestId}`);
            fetchScanRequests();
        } catch (error) {
            console.error("Error deleting scan request:", error);
        }
    };

    return (
        <div>
            <h1>Scan Request List</h1>
            <ul>
                {scanRequests.map((scanRequest) => (
                    <li key={scanRequest._id}>
                        {scanRequest.name} - {scanRequest.email} -{" "}
                        {scanRequest.purpose}
                        <button
                            onClick={() => deleteScanRequest(scanRequest._id)}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ScanRequestList;
