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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PolicyItem = {
  id: number;
  titleId: string;
  titleEn: string;
  contentId: string;
  contentEn: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  category: {
    id: number;
    nameId: string;
    nameEn: string;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function PolicyTable() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [categories, setCategories] = useState<
    { id: number; nameId: string }[]
  >([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("ALL");

  // 1. FETCH CATEGORIES
  useEffect(() => {
    const fetchCats = async () => {
      const res = await fetchApi("/content/policies/categories");
      const result = await res.json();
      setCategories(result.data || []);
    };
    fetchCats();
  }, [fetchApi]);

  // 2. FETCH POLICIES
  const fetchPolicies = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), take: "10" });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (filterCategoryId !== "ALL")
      params.append("categoryId", filterCategoryId);

    const res = await fetchApi(`/content/policies/items?${params}`);
    const result = await res.json();
    setPolicies(result.data || []);
    setMeta(result.meta);
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, [page, debouncedSearch, filterCategoryId]);

  // 3. DELETE
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this policy?")) return;
    await fetchApi(`/content/policies/items/${id}`, { method: "DELETE" });
    toast.success("Policy deleted");
    fetchPolicies();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Policy Management</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Link href="/super-admin/content/policies/items/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Policy
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title (ID/EN)</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading...</TableCell>
                </TableRow>
              ) : (
                policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold">{p.titleId}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.titleEn}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.category.nameId}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
