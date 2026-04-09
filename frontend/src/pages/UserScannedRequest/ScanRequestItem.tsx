import React from "react";
import { AxiosResponse } from "axios";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ScanRequest {
    _id: string;
    name: string;
    email: string;
    purpose: string;
    officeEmail: string;
    officePassword: string;
    status: string;
    data: string; // Assuming data contains file URL
}

interface Props {
    request: ScanRequest;
}

const ScanRequestItem: React.FC<Props> = ({ request }) => {
    const downloadFile = async (): Promise<void> => {
        try {
            const res: AxiosResponse<Blob> = await api.get(
                `/scan/downloadfile`,
                { responseType: "blob" }
            );
            const blob = new Blob([res.data], { type: res.data.type });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = "file.pdf";
            link.click();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <tr>
            <td className="border px-4 py-2">{request._id}</td>
            <td className="border px-4 py-2">{request.email}</td>
            <td className="border px-4 py-2">{request.purpose}</td>
            <td className="border px-4 py-2">{request.status}</td>
            <td className="border px-4 py-2">
                <Button onClick={downloadFile}>Download File</Button>
            </td>
        </tr>
    );
};

export default ScanRequestItem;
