"use client";

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
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";
import { Globe, ImageIcon, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type Definitions ===
type ClientLogo = {
  id: string;
  name: string;
  imageUrl: string;
  altText?: string;
  websiteUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function ClientLogoTable() {
  // === STATE DATA ===
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // === FETCH DATA ===
  const fetchLogos = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Endpoint Admin untuk Client Logo
      const res = await fetch(
        `${apiUrl}/content/client-logos/admin/list?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch client logos.");
      }

      setLogos(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load client logos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, [page, debouncedSearch, statusFilter]);

  // === DELETE HANDLER ===
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this logo?")) return;

    setDeletingId(id);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/content/client-logos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete logo");

      toast.success("Logo deleted successfully");
      fetchLogos(); // Refresh table
    } catch (error) {
      toast.error("Failed to delete logo");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === HEADER & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Client & Partner Logos 🤝
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filter Status */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-32 min-w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* === ACTION BAR === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Total Records: {meta?.total || 0}
          </h3>

          {/* Add Button */}
          <Link href="/super-admin/content/client-logo/add" className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Client Logo
            </Button>
          </Link>
        </div>
      </Card>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Order</TableHead>
                  <TableHead className="w-24">Logo</TableHead>
                  <TableHead className="min-w-37.5">Client Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-12 w-12 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-red-500 py-6">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : logos.length > 0 ? (
                  logos.map((logo) => (
                    <TableRow key={logo.id}>
                      {/* Order */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-slate-50 font-mono">
                          {logo.displayOrder}
                        </Badge>
                      </TableCell>

                      {/* Image Preview */}
                      <TableCell>
                        <div className="relative w-12 h-12 bg-white rounded-md border p-1 overflow-hidden">
                          <Image
                            src={logo.imageUrl}
                            alt={logo.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <div className="font-semibold text-sm">{logo.name}</div>
                        {logo.altText && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-37.5">
                            Alt: {logo.altText}
                          </div>
                        )}
                      </TableCell>

                      {/* Website */}
                      <TableCell className="max-w-37.5">
                        {logo.websiteUrl ? (
                          <a
                            href={logo.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Visit Site
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {logo.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(logo.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/super-admin/content/client-logo/edit/${logo.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 cursor-pointer">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer"
                          onClick={() => handleDelete(logo.id)}
                          disabled={deletingId === logo.id}>
                          {deletingId === logo.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 opacity-20" />
                        <p>No client logos found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* === PAGINATION === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground bg-card rounded-md border shadow-sm">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)} (
            {meta.total} items)
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
