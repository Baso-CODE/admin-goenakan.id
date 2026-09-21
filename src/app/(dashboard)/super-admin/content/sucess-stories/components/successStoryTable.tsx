"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";
import {
  CalendarIcon,
  FileDown,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

// === Type Definitions ===
type SuccessStory = {
  id: string;
  slug: string;
  titleId: string;
  titleEn?: string;
  clientName: string;
  heroImageUrl: string;
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface SuccessStoryExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export default function SuccessStoryTable() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [page, setPage] = useState(1);

  // === EXPORT DATE RANGE STATE ===
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [exporting, setExporting] = useState<boolean>(false);

  // === FETCH DATA ===
  const fetchStories = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Memanggil API getAllAdmin yang sudah kita buat
      const res = await fetchApi(`/success-story/admin/list?${params}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Failed to fetch success stories data.",
        );
      }

      setStories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load success stories data");
      console.error("❌ Fetch Stories Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [page, debouncedSearch, status, fetchApi]);

  // === DELETE HANDLER ===
  const handleDelete = async (id: string) => {
    if (!id || status !== "authenticated") return;

    if (!confirm("Are you sure you want to delete this success story?")) return;

    setDeletingId(id);
    try {
      const res = await fetchApi(`/success-story/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete success story");
      }

      toast.success("Success story deleted successfully");
      fetchStories();
    } catch (error: any) {
      console.error("❌ Delete Story Error:", error);
      toast.error(error.message || "Failed to delete success story");
    } finally {
      setDeletingId(null);
    }
  };

  // === EXPORT HANDLER ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: SuccessStoryExportQuery = {
        ...(dateRange?.from && {
          startDate: format(dateRange.from, "yyyy-MM-dd"),
        }),
        ...(dateRange?.to && {
          endDate: format(dateRange.to, "yyyy-MM-dd"),
        }),
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(
        `/success-story/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `success_stories_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Success stories exported successfully!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export data (Endpoint might be missing).");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === HEADER & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Success Story Management
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search title or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* === ACTION BAR (ADD & EXPORT) === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Filters & Actions:
          </h3>

          {/* Export Date Range Picker */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Filter Date Range (Export)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-65 justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground",
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select date range...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={new Date().getFullYear() + 5}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Add Button */}
          <Link
            href="/super-admin/content/sucess-stories/add"
            className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Story
            </Button>
          </Link>

          {/* Export Button */}
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
            onClick={handleExport}
            disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export
          </Button>
        </div>
      </Card>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-30 pl-4">Preview</TableHead>
                  <TableHead className="min-w-50">Title (ID)</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-4">
                        <Skeleton className="h-16 w-24 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48 mb-2" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="pr-4">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-red-500 py-6">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : stories.length > 0 ? (
                  stories.map((story) => (
                    <TableRow key={story.id}>
                      {/* Image Preview */}
                      <TableCell className="pl-4">
                        <div className="relative w-24 h-14 bg-muted rounded-md overflow-hidden border">
                          <Image
                            src={
                              story.heroImageUrl || "/images/placeholder.jpg"
                            }
                            alt={story.titleId}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>

                      {/* Title */}
                      <TableCell>
                        <div
                          className="font-semibold text-sm line-clamp-1"
                          title={story.titleId}>
                          {story.titleId}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          /{story.slug}
                        </div>
                      </TableCell>

                      {/* Client Name */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-700">
                          {story.clientName}
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(story.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right space-x-2 whitespace-nowrap pr-4">
                        <Link
                          href={`/super-admin/content/sucess-stories/edit/${story.id}`}>
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
                          onClick={() => handleDelete(story.id)}
                          disabled={deletingId === story.id}>
                          {deletingId === story.id ? (
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
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>No success stories found.</p>
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
