"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Box,
  CalendarIcon,
  Edit3,
  FileText,
  History,
  Lock,
  MessageSquare,
  Printer,
  Send,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/useApi";
import { FollowUpStepperDialog } from "./followUpStepperDialog";

// === TYPES (Sesuai Schema Database) ===
// === 1. Tambahkan Type Khusus Follow Up ===
type QuotationFollowUp = {
  id: string;
  name: string;
  quotationId: string;
  date: string;
  method: string | null;
  notes: string | null;
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
};
type QuotationItemTier = {
  id: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
};

// === 2. Tambahkan Type Khusus Item (Opsional tapi disarankan) ===
type QuotationItem = {
  id: string;
  productName: string;
  description: string | null;
  discount?: string | number;
  variant?: {
    variantName: string;
  };
  tiers: QuotationItemTier[];
};

type QuotationNote = {
  id: string;
  categoryId: string;
  content: string;
  category: {
    name: string;
    isPublic: boolean;
  };
};

// === 3. Update QuotationDetail Utama ===
type QuotationDetail = {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string | null;
  status: string;
  subTotal: string | number;
  totalAmount: string | number;
  notes: QuotationNote[];
  client?: any;
  manualClientName?: string | null;
  manualClientCompany?: string | null;
  manualClientEmail?: string | null;
  manualClientPhone?: string | null;
  manualClientAddress?: string | null;

  // Hubungkan dengan type yang kita buat di atas
  items: QuotationItem[];
  followUps: QuotationFollowUp[]; // <--- Ini yang paling penting
};

export default function QuotationDetail() {
  const { fetchApi, status } = useApi(); // ✨ Ambil fetchApi dan status
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<QuotationDetail | null>(null);

  const publicNotes = data?.notes?.filter((n) => n.category.isPublic) || [];
  const internalNotes = data?.notes?.filter((n) => !n.category.isPublic) || [];

  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // === FETCH DATA ===
  const fetchDetail = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !id) return;

    try {
      setLoading(true);
      const res = await fetchApi(`/quotations/${id}`);

      if (!res.ok) throw new Error("Quotation not found");

      const result = await res.json();
      setData(result.data || result);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat detail penawaran");
      router.push("/admin-invoice/quotations");
    } finally {
      setLoading(false);
    }
  }, [id, status, fetchApi, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // === DELETE HANDLER ===
  const handleDelete = async () => {
    if (status !== "authenticated") return;

    setIsDeleting(true);
    try {
      // ✨ Gunakan fetchApi dengan method DELETE
      const res = await fetchApi(`/quotations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Penawaran berhasil dihapus");
      router.push("/admin-invoice/quotations");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };
  // === UTILS ===
  const formatIDR = (val: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val));
  };

  if (loading) return <LoadingSkeleton />;

  if (!data) return null;

  return (
    <div className=" mx-auto py-6 space-y-6 pb-20">
      {/* ACTION BAR ATAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>

        <div className="flex flex-wrap gap-2">
          {/* Tombol Edit */}
          <Link href={`/admin-invoice/quotations/edit/${data.id}`}>
            <Button variant="outline" className="gap-2">
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
          </Link>

          {/* Tombol Print (Placeholder) */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              window.open(
                `/admin-invoice/quotations/print/${data.id}`,
                "_blank",
              );
            }}>
            <Printer className="h-4 w-4" /> Print PDF
          </Button>

          {/* Tombol Delete dengan Modal Shadcn */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Apakah anda benar-benar yakin?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus
                  permanen penawaran
                  <strong> {data.quotationNumber}</strong> beserta seluruh
                  riwayat item didalamnya.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Sekarang"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: INFO UTAMA & CLIENT */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {data.quotationNumber}
                </CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  Dibuat pada{" "}
                  {format(new Date(data.date), "dd MMMM yyyy", {
                    locale: idLocale,
                  })}
                </div>
              </div>
              <Badge
                variant="outline"
                className="px-3 py-1 capitalize bg-slate-50">
                {data.status.toLowerCase()}
              </Badge>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" /> Informasi
                    Client
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="font-bold text-lg">
                      {data.client?.b2b?.companyName ||
                        data.client?.b2c?.name ||
                        data.manualClientName}
                    </p>
                    {data.manualClientCompany && (
                      <p className="text-muted-foreground">
                        {data.manualClientCompany}
                      </p>
                    )}
                    <p>
                      {data.manualClientPhone ||
                        data.client?.b2b?.phone ||
                        data.client?.b2c?.phone ||
                        "-"}
                    </p>
                    <p className="text-muted-foreground italic">
                      {data.manualClientEmail ||
                        data.client?.b2b?.email ||
                        "No Email"}
                    </p>
                  </div>
                </div>

                {/* Shipping/Address */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />{" "}
                    Alamat Penagihan
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.manualClientAddress ||
                      data.client?.b2b?.fullAddress ||
                      data.client?.b2c?.fullAddress ||
                      "Alamat tidak tersedia"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABEL ITEMS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="h-5 w-5 text-muted-foreground" /> Daftar Produk
                / Jasa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-1/2">
                      Deskripsi Produk
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      Opsi Qty
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Harga Satuan
                    </TableHead>
                    <TableHead className="text-right pr-6 whitespace-nowrap">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item, itemIdx) => {
                    const tiers =
                      item.tiers && item.tiers.length > 0 ? item.tiers : [];

                    return tiers.map((tier, tierIdx) => (
                      <TableRow key={tier.id || `${itemIdx}-${tierIdx}`}>
                        {tierIdx === 0 && (
                          <TableCell
                            className="pl-6 align-top border-r border-slate-100"
                            rowSpan={tiers.length}>
                            <div className="font-bold text-blue-700">
                              {item.productName}
                            </div>

                            {item.variant?.variantName && (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-[10px] bg-slate-100 text-slate-600">
                                {item.variant.variantName}
                              </Badge>
                            )}

                            {item.description && (
                              <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-2 leading-relaxed">
                                {item.description}
                              </div>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center font-medium">
                          {tier.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatIDR(tier.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-slate-700">
                          {formatIDR(tier.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ));
                  })}

                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-muted-foreground">
                        Belum ada item produk.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: RINGKASAN BIAYA & CATATAN */}
        <div className="space-y-6">
          <Card className="bg-slate-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Ringkasan Biaya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatIDR(data.subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Diskon</span>
                <span>- Rp 0</span>
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="font-bold">Total Akhir</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatIDR(data.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* NOTES */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Catatan Penawaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {publicNotes.length > 0 ? (
                // Grouping berdasarkan kategori agar rapi
                Object.entries(
                  publicNotes.reduce(
                    (acc, note) => {
                      const catName = note.category.name;
                      if (!acc[catName]) acc[catName] = [];
                      acc[catName].push(note.content);
                      return acc;
                    },
                    {} as Record<string, string[]>,
                  ),
                ).map(([categoryName, contents]) => (
                  <div key={categoryName} className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {categoryName}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {contents.map((content, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-700 leading-relaxed italic">
                          {content}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Tidak ada catatan untuk client.
                </p>
              )}
            </CardContent>
          </Card>

          {/* === UPDATE: DISPLAY INTERNAL NOTES === */}
          {internalNotes.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="flex flex-row items-center gap-2 py-3">
                <Lock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-sm font-semibold text-amber-700">
                  Internal Memo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border-l-2 border-amber-200 pl-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase">
                      {note.category.name}
                    </p>
                    <p className="text-xs text-amber-800">{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Table Follow Up */}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Riwayat Follow Up
          </CardTitle>
          <FollowUpStepperDialog
            quotationId={data.id}
            existingFollowUps={data.followUps || []}
            onSuccess={() => fetchDetail()}
            onSubmit={async (payload) => {
              if (status !== "authenticated") {
                toast.error("Sesi berakhir, silakan login kembali.");
                return;
              }

              const res = await fetchApi(`/quotations/${data.id}/follow-up`, {
                method: "POST",
                body: JSON.stringify(payload),
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Gagal mencatat follow up");
              }

              toast.success("Follow up berhasil dicatat");
            }}
          />
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {data.followUps && data.followUps.length > 0 ? (
              data.followUps.map((fu: any, index: number) => (
                <div
                  key={fu.id}
                  className="relative pl-8 border-l-2 border-slate-100 last:border-l-0 pb-2">
                  {/* Dot Indicator */}
                  <div className="absolute -left-2.25 top-1 h-4 w-4 rounded-full border-2 border-white bg-orange-500 shadow-sm" />

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">
                        {format(new Date(fu.date), "dd MMM yyyy HH:mm", {
                          locale: idLocale,
                        })}
                      </span>
                      {fu.method && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-2 bg-blue-50 text-blue-600 border-blue-100">
                          {fu.method}
                        </Badge>
                      )}
                    </div>

                    {/* --- TAMPILKAN NAMA / JUDUL DI SINI --- */}
                    <p className="text-base font-bold text-gray-900 mt-1">
                      {fu.name}
                    </p>

                    {fu.notes && (
                      <p className="text-sm text-slate-700 font-medium">
                        {fu.notes}
                      </p>
                    )}

                    {fu.nextAction && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
                        <Send className="h-3 w-3" />
                        Next: {fu.nextAction}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  Belum ada riwayat follow up.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// === KOMPONEN LOADING ===
function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
