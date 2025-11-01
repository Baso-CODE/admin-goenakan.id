"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link"; // Menggunakan Link dari next/link
import React, { useState } from "react";

// --- Definisi Tipe (sesuai skema Prisma User dan Enum Role) ---
type Role = "SUPER_ADMIN" | "ADMIN_ARTICLE" | "ADMIN_INVOICE";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  isActive: boolean;
}

// --- Data Mockup User sesuai Skema Prisma ---
const initialUserData: User[] = [
  {
    id: "u-12345",
    name: "John Doe",
    email: "john.doe@techvision.com",
    role: "SUPER_ADMIN",
    createdAt: "2024-01-15T10:30:00Z",
    isActive: true,
  },
  {
    id: "u-67890",
    name: "Jane Smith",
    email: "jane.smith@globalsol.com",
    role: "ADMIN_INVOICE",
    createdAt: "2024-03-01T08:00:00Z",
    isActive: true,
  },
  {
    id: "u-11223",
    name: "Budi Santoso",
    email: "budi.s@alphatech.com",
    role: "ADMIN_ARTICLE",
    createdAt: "2024-05-20T14:45:00Z",
    isActive: false,
  },
  {
    id: "u-33445",
    name: "Alice Johnson",
    email: "alice.j@corp.com",
    role: "ADMIN_ARTICLE",
    createdAt: "2024-02-10T11:15:00Z",
    isActive: true,
  },
];

// Helper function untuk memformat Role menjadi tampilan yang lebih bersih
const formatRole = (role: Role): string => {
  return role.replace(/_/g, " ");
};

const UserManagementTable: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [userData, setUserData] = useState<User[]>(initialUserData);

  const filteredData = userData.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      formatRole(user.role).toLowerCase().includes(search.toLowerCase())
  );

  // Fungsi sederhana untuk mengubah status aktif/nonaktif
  const toggleUserStatus = (id: string) => {
    setUserData((prevData) =>
      prevData.map((user) =>
        user.id === id ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  return (
    <div className="space-y-5 w-full max-w-6xl mx-auto">
      {/* === HEADER CARD & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold">User Management</CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-lg"
            />
          </div>
        </CardHeader>
      </Card>
      {/* === ADD USER BUTTON === */}
      <div className="p-1 flex justify-end">
        <Link href="/super-admin/users/add">
          <Button
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 transition duration-200"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </Link>
      </div>
      {/* === TABLE CARD === */}
      <Card className="w-full overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="min-w-[180px] font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </TableHead>
                  <TableHead className="min-w-[250px] font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Role
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Join Date
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300"
                              : user.role === "ADMIN_INVOICE"
                              ? "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300"
                              : "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300"
                          }
                        >
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge
                            variant="default"
                            className="bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-900/20 dark:text-green-400"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-900/20 dark:text-red-400"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Link href={`/super-admin/users/edit/${user.id}`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No users found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementTable;
