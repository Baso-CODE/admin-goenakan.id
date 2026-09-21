"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Edit, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

// === TYPES ===
type NoteCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count?: { templates: number };
};

type NoteTemplate = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  category: { name: string };
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  take: number;
  total: number;
  totalPage: number;
};

export default function InvoiceNotesPage() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header */}
      <Card className="border-l-4 border-l-purple-600 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Invoice Notes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Kelola kategori dan template catatan untuk invoice.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Kategori Catatan</TabsTrigger>
          <TabsTrigger value="templates">Template Catatan</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesTable />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// COMPONENT 1: CATEGORIES TABLE
// ============================================================================

function CategoriesTable() {
  const { fetchApi, status } = useApi();

  const [data, setData] = useState<NoteCategory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);

  const fetchData = useCallback(async () => {
    // 🛑 Jangan fetch jika session NextAuth masih loading atau tidak ada
    if (status === "loading" || status === "unauthenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);

      //  3. Panggil API tanpa fetch token manual
      const res = await fetchApi(`/invoice-notes/categories?${params}`);

      if (!res.ok) throw new Error("Failed to fetch categories");

      const result = await res.json();
      setData(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4 border-b bg-gray-50/50 flex flex-row justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kategori..."
            className="pl-9 h-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href={"/admin-invoice/notes/category/add"} className="ml-auto">
          <Button size="sm" className="h-9">
            <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Jumlah Template</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Dibuat Pada</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground">
                  Belum ada kategori catatan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {item.slug}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">
                      {item._count?.templates || 0} Items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.isActive ? "default" : "destructive"}
                      className={`text-[10px] h-5 ${
                        item.isActive ? "bg-green-600 hover:bg-green-700" : ""
                      }`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "dd MMM yyyy", {
                      locale: idLocale,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin-invoice/notes/category/edit/${item.slug}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {meta && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Halaman {meta.page} dari {meta.totalPage}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevious}
                onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT 2: TEMPLATES TABLE
// ============================================================================

function TemplatesTable() {
  const { fetchApi, status } = useApi();
  const [data, setData] = useState<NoteTemplate[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);

  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetchApi(`/invoice-notes/templates?${params}`);

      if (!res.ok) throw new Error("Failed to fetch templates");

      const result = await res.json();
      setData(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat template");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4 border-b bg-gray-50/50 flex flex-row justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari template..."
            className="pl-9 h-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href={"/admin-invoice/notes/add"} className="ml-auto">
          <Button size="sm" className="h-9">
            <Plus className="mr-2 h-4 w-4" /> Tambah Template
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Judul Template</TableHead>
              <TableHead className="w-[15%]">Kategori</TableHead>
              <TableHead className="w-[40%]">Isi Konten</TableHead>
              <TableHead className="w-[10%] text-center">Status</TableHead>
              <TableHead className="w-[15%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground">
                  Belum ada template catatan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-gray-900">
                    {item.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">
                      {item.category?.name || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-md">
                      {item.content}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full mx-auto ${
                        item.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={item.isActive ? "Active" : "Inactive"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin-invoice/notes/edit/${item.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Template */}
        {meta && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Halaman {meta.page} dari {meta.totalPage}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevious}
                onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
