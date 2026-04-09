import React, { useEffect, useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import api from "@/lib/api"; // Ensure this points to your API utility

interface User {
    plan: string;
    _id: string;
    name: string;
    email: string;
    role: string;
}

const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch users from the API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/user/allusers'); // Adjust the endpoint as necessary
                setUsers(response.data.users);
            } catch (error) {
                setError('Error fetching users');
                console.error("Error:", error);
            }
        };
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id: string) => {
        try {
            const response = await api.delete(`/user/deleteuser/${id}`);
            if (response.status === 200) {
                setUsers(users.filter((user) => user._id !== id));
                alert("User deleted successfully");
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while deleting the user");
        }
    };

    return (
        <div className="container mx-auto p-4">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id} className="border-b">
                            <td className="p-3 text-center">{user.name}</td>
                            <td className="p-3 text-center">{user.email}</td>
                            <td className="p-3 text-center">{user.role}</td>
                            <td className="p-3 text-center">{user.plan}</td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md"
                                >
                                    <RiDeleteBin6Line className="inline-block mr-1" />
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;
