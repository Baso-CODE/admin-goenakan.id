"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// === TYPES ===
type Quotation = {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string | null;
  status: string;
  subTotal: string | number;
  totalAmount: string | number;
  currencyCode: string;
  paymentTerms: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  client?: {
    type: "B2B" | "B2C";
    b2b?: { companyName: string };
    b2c?: { name: string; prefix: string | null };
  };
  pic?: { name: string; position: string | null } | null;
  user?: { name: string } | null;
  updatedBy?: { name: string } | null;
  approvedBy?: { name: string } | null;
  followUps: { name: string; date: string }[];
};

type Meta = {
  page: number;
  take: number;
  total: number;
  totalPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// === UTILS ===
const formatCurrencyWithCode = (
  amount: string | number,
  code: string = "IDR",
) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
  }).format(numericAmount);
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "default";
    case "SENT":
      return "secondary";
    case "FOLLOW_UP":
      return "outline";
    case "DRAFT":
      return "secondary";
    default:
      return "destructive";
  }
};

const getStatusClassName = (status: string) => {
  if (status === "FOLLOW_UP")
    return "text-amber-600 border-amber-200 bg-amber-50";
  if (status === "SENT") return "text-blue-600 border-blue-200 bg-blue-50";
  if (status === "ACCEPTED")
    return "text-emerald-600 border-emerald-200 bg-emerald-50";
  return "";
};

const getCustomerName = (quo: Quotation) => {
  if (quo.client?.type === "B2B" && quo.client.b2b)
    return quo.client.b2b.companyName;
  if (quo.client?.type === "B2C" && quo.client.b2c) {
    const prefix = quo.client.b2c.prefix ? `${quo.client.b2c.prefix}. ` : "";
    return `${prefix}${quo.client.b2c.name}`;
  }
  return "Klien Tidak Diketahui";
};

const renderFollowUpProgress = (
  followUps: { name: string; date: string }[],
  status: string,
) => {
  if (status === "DRAFT")
    return (
      <span className="text-[10px] text-muted-foreground italic">
        Belum dikirim
      </span>
    );
  const maxFU = 3;
  const completedCount = Math.min(followUps.length, maxFU);
  const progressPercentage = (completedCount / maxFU) * 100;

  return (
    <div className="flex flex-col gap-1 min-w-36 text-left">
      <Progress
        value={progressPercentage}
        className="h-1.5 w-full bg-slate-100 [&>div]:bg-blue-600"
      />
      <div className="text-[9px] text-slate-500 font-medium">
        {completedCount}/{maxFU} follow-ups completed
      </div>
    </div>
  );
};

export default function QuotationsTable() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // ✨ State untuk delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuotations = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), take: "10" });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetchApi(`/quotations?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const result = await res.json();
      setQuotations(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data penawaran");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, status, fetchApi]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // ✨ Handler delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetchApi(`/quotations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus quotation");
      toast.success(
        `Quotation ${deleteTarget.quotationNumber} berhasil dihapus`,
      );
      setDeleteTarget(null);
      fetchQuotations();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus quotation");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Header */}
      <Card className="border-l-4 border-l-orange-500 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Quotations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Kelola penawaran harga terintegrasi, log persetujuan, dan syarat
                pembayaran klien.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Link href="/admin-invoice/quotations/add">
              <Button className="h-9 gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4" /> Buat Penawaran
              </Button>
            </Link>
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No QUO / Client..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter */}
      <Card className="p-4 shadow-sm bg-gray-50/50 border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1.5 w-full sm:w-48">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Status Penawaran
            </span>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent (Terkirim)</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                <SelectItem value="ACCEPTED">Accepted (Deal)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table Data */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-600">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-28">Tanggal</TableHead>
                  <TableHead className="w-44">Quotation No</TableHead>
                  <TableHead className="w-64">Customer Name</TableHead>
                  <TableHead className="w-52">PIC Customer (B2B)</TableHead>
                  <TableHead className="w-32">Valid Until</TableHead>
                  <TableHead className="w-24 text-center">Currency</TableHead>
                  <TableHead className="w-64">Payment Terms</TableHead>
                  <TableHead className="w-64">Remarks</TableHead>
                  <TableHead className="w-44">Follow-Up Progress</TableHead>
                  <TableHead className="w-36 text-right">Total Nilai</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="w-48">Created By / Time</TableHead>
                  <TableHead className="w-48">Updated By / Time</TableHead>
                  <TableHead className="w-48">Approved By / Date</TableHead>
                  <TableHead className="w-16 text-center sticky right-0 bg-white shadow-md">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 15 }).map((_, colIdx) => (
                        <TableCell key={colIdx}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : quotations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={15}
                      className="h-40 text-center text-muted-foreground">
                      Tidak ada data penawaran.
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((quo) => (
                    <TableRow key={quo.id} className="hover:bg-muted/5">
                      <TableCell className="text-xs font-medium text-gray-700">
                        {format(new Date(quo.date), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-blue-600">
                        {quo.quotationNumber}
                      </TableCell>

                      <TableCell className="text-xs font-bold text-gray-900">
                        {getCustomerName(quo)}
                      </TableCell>

                      <TableCell className="text-xs text-gray-700">
                        {quo.client?.type === "B2B" && quo.pic ? (
                          <div>
                            <p className="font-medium text-slate-900">
                              {quo.pic.name}
                            </p>
                            {quo.pic.position && (
                              <p className="text-[10px] text-slate-400">
                                {quo.pic.position}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-gray-600">
                        {quo.validUntil ? (
                          format(new Date(quo.validUntil), "dd MMM yyyy", {
                            locale: idLocale,
                          })
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-xs font-bold">
                        <Badge variant="outline">{quo.currencyCode}</Badge>
                      </TableCell>

                      <TableCell
                        className="text-xs text-slate-600 max-w-50 truncate"
                        title={quo.paymentTerms || ""}>
                        {quo.paymentTerms || (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </TableCell>

                      <TableCell
                        className="text-xs text-slate-600 max-w-50 truncate"
                        title={quo.remarks || ""}>
                        {quo.remarks || (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {renderFollowUpProgress(
                          quo.followUps || [],
                          quo.status,
                        )}
                      </TableCell>

                      <TableCell className="text-right text-xs font-bold text-slate-900">
                        {formatCurrencyWithCode(
                          quo.totalAmount,
                          quo.currencyCode,
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusBadgeVariant(quo.status) as any}
                          className={`text-[10px] h-5 px-2 capitalize shadow-none ${getStatusClassName(quo.status)}`}>
                          {quo.status.replace("_", " ").toLowerCase()}
                        </Badge>
                      </TableCell>

                      {/* --- Audit: Created --- */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {quo.user?.name || "System"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {format(
                              new Date(quo.createdAt),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </span>
                        </div>
                      </TableCell>

                      {/* --- Audit: Updated --- */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {quo.updatedBy?.name || (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {format(
                              new Date(quo.updatedAt),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </span>
                        </div>
                      </TableCell>

                      {/* --- Audit: Approved --- */}
                      <TableCell className="text-xs bg-slate-50/40">
                        {quo.approvedBy ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-500" />
                              {quo.approvedBy.name}
                            </span>
                            <span className="text-[10px] text-emerald-600">
                              {quo.approvedAt
                                ? format(
                                    new Date(quo.approvedAt),
                                    "dd/MM/yyyy HH:mm",
                                  )
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Pending Approval
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center sticky right-0 bg-white border-l shadow-md">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin-invoice/quotations/detail/${quo.id}`,
                                )
                              }
                              className="cursor-pointer gap-2">
                              <Eye className="h-3.5 w-3.5 text-blue-500" />
                              <span>Detail</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin-invoice/quotations/edit/${quo.id}`,
                                )
                              }
                              className="cursor-pointer gap-2">
                              <Pencil className="h-3.5 w-3.5 text-amber-500" />
                              <span>Edit</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(quo)}
                              className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {meta && (
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="text-xs text-muted-foreground">
            Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{meta.totalPage}</strong> • Total{" "}
            <strong>{meta.total}</strong> Data
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 text-xs">
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs">
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Quotation?"
        description={`Quotation ${deleteTarget?.quotationNumber} akan dihapus permanen.`}
        warningMessage="Semua data item dan notes terkait juga akan ikut terhapus."
      />
    </div>
  );
}
