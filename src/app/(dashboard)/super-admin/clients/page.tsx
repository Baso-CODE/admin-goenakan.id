"use client";

import { Search, UserCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";

type ClientType = "B2B" | "B2C";

interface ClientBase {
  id: string;
  custCode: string;
  type: ClientType;
  createdAt: string;
  phone?: string;
  email?: string;
}

interface ClientB2B extends ClientBase {
  type: "B2B";
  companyName: string;
  picName: string;
}

interface ClientB2C extends ClientBase {
  type: "B2C";
  name: string;
}

type ClientData = ClientB2B | ClientB2C;

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const ClientManagementTable: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    perPage: 10,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);

      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Query params
        const params = new URLSearchParams({
          page: meta.page.toString(),
          take: meta.perPage.toString(),
          type: clientTypeFilter,
        });
        if (debouncedSearch.trim()) {
          params.append("search", debouncedSearch.trim());
        }

        const res = await fetch(`http://localhost:8000/clients?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();
        setClients(result.data || []);
        setMeta(result.meta || meta);
      } catch (err) {
        console.error("❌ Error fetching clients:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [meta.page, clientTypeFilter, debouncedSearch]);

  // === UTILITIES ===
  const getClientName = (client: ClientData) =>
    client.type === "B2B" ? client.companyName : client.name;

  const getClientPicOrEmail = (client: ClientData) =>
    client.type === "B2B" ? client.picName : client.email;

  // === RENDER ===
  return (
    <div className="space-y-4 w-full  mx-auto">
      {/* === HEADER & FILTER === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <UserCircle className="h-7 w-7 font-bold" />
            Client Management
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* === FILTER TYPE === */}
            <Select
              value={clientTypeFilter}
              onValueChange={setClientTypeFilter}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="B2B">B2B (Bisnis)</SelectItem>
                <SelectItem value="B2C">B2C (Individu)</SelectItem>
              </SelectContent>
            </Select>

            {/* === SEARCH INPUT === */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Kode, Nama, Perusahaan, atau Email..."
                value={search}
                onChange={(e) => {
                  setMeta((prev) => ({ ...prev, page: 1 }));
                  setSearch(e.target.value);
                }}
                className="pl-10 h-10 rounded-lg"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* === ADD CLIENT BUTTON === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/clients/add">
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Add New Client
          </Button>
        </Link>
      </div>

      {/* === TABLE === */}
      <Card className="w-full overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px] font-semibold">
                  Kode Klien
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold">
                  Nama / Perusahaan
                </TableHead>
                <TableHead className="font-semibold">Tipe</TableHead>
                <TableHead className="min-w-[150px] font-semibold">
                  Kontak Utama
                </TableHead>
                <TableHead className="min-w-[150px] font-semibold">
                  Telepon
                </TableHead>
                <TableHead className="min-w-[150px] font-semibold">
                  Created
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                /* Penanganan Loading menggunakan Skeleton */
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {/* Kolom 1: Customer Code (font-mono text-xs) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    {/* Kolom 2: Client Name (font-medium) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-[200px]" />
                    </TableCell>
                    {/* Kolom 3: Type (Badge) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-[50px]" />
                    </TableCell>
                    {/* Kolom 4: PIC/Email (text-sm text-muted-foreground) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    {/* Kolom 5: Phone (text-sm) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    {/* Kolom 6: Created (font-mono text-xs) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    {/* Kolom 7: Actions (text-right) */}
                    <TableCell className="h-12 text-right">
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-[60px]" />
                        {/* View Button */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                /* Penanganan Error */
                <TableRow>
                  <TableCell
                    colSpan={7} // Jumlah kolom: 7
                    className="text-center text-red-500 py-6"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : clients.length > 0 ? (
                /* Menampilkan Data Client */
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-xs">
                      {client.custCode}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {getClientName(client)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.type === "B2B"
                            ? "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300"
                        }
                      >
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getClientPicOrEmail(client) || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.phone || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDate(client.createdAt, { style: "relative" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/super-admin/clients/detail/${client.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                /* Data Kosong */
                <TableRow>
                  <TableCell
                    colSpan={7} // Jumlah kolom: 7
                    className="text-center py-6 text-muted-foreground"
                  >
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* === PAGINATION === */}
      {meta.total > 0 && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
          </span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() =>
                setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() =>
                setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagementTable;
