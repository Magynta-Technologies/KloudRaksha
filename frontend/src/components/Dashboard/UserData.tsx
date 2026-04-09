import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   plan: string;
//   active: string;
//   status: string;
// }

// const mockUsers: User[] = [
//   {
//     id: "1",
//     name: "Alice Johnson",
//     email: "alice@example.com",
//     plan: "Pro",
//     active: "2024-04-10",
//     status: "Active",
//   },
//   {
//     id: "2",
//     name: "Bob Smith",
//     email: "bob@example.com",
//     plan: "Basic",
//     active: "2024-10-10",
//     status: "Inactive",
//   },
//   {
//     id: "3",
//     name: "Charlie Brown",
//     email: "charlie@example.com",
//     plan: "Enterprise",
//     active: "2024-10-24",
//     status: "Active",
//   },
// ];

const SkeletonRow = () => (
  <TableRow>
    <TableCell className="animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
    <TableCell className="animate-pulse">
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </TableCell>
  </TableRow>
);

export default function SuperAdminUserData() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const {
          data: {
            data: { users },
          },
        } = await api.get("/superadmin/user-management");
        setUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const response = await api.patch(
        `/superadmin/update-user-role/${userId}`,
        {
          newRole,
        }
      );

      if (response.data.status === "success") {
        // Update the local state to reflect the change
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
        // toast.success("User role updated successfully");
      }
    } catch (error: any) {
      // toast.error(
      //   error.response?.data?.message || "Failed to update user role"
      // );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          User Data
        </h2>
        <Table className="bg-white dark:bg-gray-800 shadow-sm rounded-md border border-gray-200 dark:border-gray-700">
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
                Name
              </TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
                Email
              </TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
                Role
              </TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
                Plan
              </TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
                Last Active
              </TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
                Status
              </TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 font-semibold text-center">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
        User Data
      </h2>
      <Table className="bg-white dark:bg-gray-800 shadow-sm rounded-md border border-gray-200 dark:border-gray-700">
        <TableHeader className="bg-gray-100 dark:bg-gray-800">
          <TableRow>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
              Name
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
              Email
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
              Role
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
              Plan
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
              Last Active
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold">
              Status
            </TableHead>
            <TableHead className="text-gray-600 dark:text-gray-300 font-semibold text-center">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user._id}
              className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <TableCell className="text-gray-700 dark:text-gray-300">
                {user.name}
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {user.email}
              </TableCell>
              <TableCell>
                <Badge
                  className={`${
                    user.role === "superadmin"
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      : user.role === "admin"
                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  } py-1 px-2 rounded-full text-sm capitalize`}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={`${
                    user.planName === "Pro"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : user.planName === "Basic"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : user.planName === "Enterprise"
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
                  } py-1 px-2 rounded-full text-sm`}
                >
                  {user.planName}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {new Date(user.lastActive).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge
                  className={`${
                    user.status === "active"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  } py-1 px-2 rounded-full text-sm`}
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {user.role !== "superadmin" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Change Role
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white dark:bg-gray-800">
                        <DropdownMenuItem
                          onClick={() => handleRoleUpdate(user._id, "admin")}
                          disabled={user.role === "admin"}
                        >
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleUpdate(user._id, "user")}
                          disabled={user.role === "user"}
                        >
                          Make User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
