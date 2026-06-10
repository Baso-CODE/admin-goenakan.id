"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Pencil,
  Printer,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === TYPES ===
type PurchaseOrderDetail = {
  id: string;
  poNumber: string;
  poDate: string;
  purchaseType: string;
  expenseCategory: string;
  paymentTerms: string;
  vendorAddress: string;
  currencyCode: string;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  approvalDate: string | null;
  vendor: { companyName: string; address: string | null } | null;
  currency: { code: string; symbol: string } | null;
  createdBy: { name: string } | null;
  updatedBy: { name: string } | null;
  approvedBy: { name: string } | null;
  items: Array<{
    id: string;
    itemName: string;
    quantityOrder: number;
    quantityStock: number;
    quantityPurchase: number;
    uom: string;
    unitPrice: number;
    totalAmount: number;
    remarks: string | null;
    product: { name: string } | null;
    order: { orderNumber: string } | null;
  }>;
};

// === UTILS ===
const formatCurrency = (amount: number, symbol: string = "Rp") => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: symbol === "Rp" ? "IDR" : "USD", // Sesuaikan fallback
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "APPROVED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SENT":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export default function PurchaseOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const poId = Array.isArray(params.poId) ? params.poId[0] : params.poId;

  const { fetchApi } = useApi();
  const [poData, setPoData] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poId) return;

    async function fetchDetail() {
      try {
        const res = await fetchApi(`/purchase-orders/${poId}`);
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        setPoData(data);
      } catch (error) {
        toast.error("Gagal memuat detail Purchase Order");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [poId, fetchApi]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto p-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!poData) {
    return (
      <div className="text-center py-20 text-slate-500">
        Data Purchase Order tidak ditemukan.
      </div>
    );
  }

  const currSymbol = poData.currency?.symbol || "Rp";

  return (
    <div className="space-y-6  mx-auto pb-10">
      {/* === HEADER ACTION BAR === */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              {poData.poNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn("text-xs", getStatusColor(poData.status))}>
                {poData.status}
              </Badge>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(poData.poDate), "dd MMMM yyyy", {
                  locale: idLocale,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Print (Bisa dihubungkan ke fitur export PDF nanti) */}
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          {/* Sembunyikan tombol edit jika sudah Completed/Cancelled */}
          {poData.status !== "COMPLETED" && poData.status !== "CANCELLED" && (
            <Link href={`/super-admin/purchase-orders/edit/${poData.id}`}>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Pencil className="h-4 w-4" /> Edit PO
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* === GENERAL INFO & VENDOR CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Info */}
        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b py-4">
            <CardTitle className="text-lg text-slate-700">
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-4 gap-x-6 p-5">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Purchase Type
              </p>
              <p className="text-sm font-medium text-slate-800">
                {poData.purchaseType.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Expense Category
              </p>
              <p className="text-sm font-medium text-slate-800">
                {poData.expenseCategory}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Payment Terms
              </p>
              <p className="text-sm font-medium text-slate-800">
                {poData.paymentTerms.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Currency
              </p>
              <p className="text-sm font-medium text-slate-800">
                {poData.currencyCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Info */}
        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b py-4">
            <CardTitle className="text-lg text-slate-700">
              Vendor / Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Company Name
              </p>
              <p className="text-base font-semibold text-blue-700">
                {poData.vendor?.companyName || "Unknown Vendor"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Snapshot Address (On Order)
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 border rounded-md min-h-15">
                {poData.vendorAddress || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === ITEMS TABLE === */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-700 text-white py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Purchase Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead>Item / Service</TableHead>
                  <TableHead>Ref SO/SN</TableHead>
                  <TableHead className="text-center">Qty Order</TableHead>
                  <TableHead className="text-center">In Stock</TableHead>
                  <TableHead className="text-center">Qty Buy</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poData.items.map((item) => (
                  // 1. Hapus logika ganjil-genap, gunakan warna seragam dengan efek hover bawaan
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-slate-800">
                        {item.itemName}
                      </p>
                      {item.remarks && (
                        <p className="text-xs text-slate-500 mt-1">
                          Note: {item.remarks}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {item.order?.orderNumber || "-"}
                    </TableCell>
                    <TableCell className="text-center text-slate-600">
                      {item.quantityOrder}{" "}
                      <span className="text-xs">{item.uom}</span>
                    </TableCell>
                    <TableCell className="text-center text-slate-500">
                      {item.quantityStock}{" "}
                      <span className="text-xs">{item.uom}</span>
                    </TableCell>
                    {/* 2. Hapus bg-green-50/50 di sini agar latar belakangnya menyatu dengan baris */}
                    <TableCell className="text-center font-bold text-green-700">
                      {item.quantityPurchase}{" "}
                      <span className="text-xs">{item.uom}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-700">
                      {formatCurrency(Number(item.unitPrice), currSymbol)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(Number(item.totalAmount), currSymbol)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total Summary */}
          <div className="bg-slate-50 border-t p-4 flex flex-col items-end gap-2">
            <div className="flex justify-between w-full sm:w-64">
              <span className="text-slate-500 font-medium">Grand Total</span>
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(Number(poData.totalAmount), currSymbol)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === NOTES & AUDIT TRAIL === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="bg-slate-50/50 border-b py-3">
            <CardTitle className="text-sm text-slate-700">
              Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {poData.notes || "No internal notes provided."}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b py-3">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4" /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500">Created By</p>
              <p className="text-sm font-medium">
                {poData.createdBy?.name || "System"}
              </p>
              <p className="text-xs text-slate-400">
                {format(new Date(poData.createdAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
            {poData.updatedBy && (
              <div>
                <p className="text-xs text-slate-500">Last Updated By</p>
                <p className="text-sm font-medium">{poData.updatedBy.name}</p>
                <p className="text-xs text-slate-400">
                  {format(new Date(poData.updatedAt), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            )}
            {poData.approvedBy && (
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-500">Approved By</p>
                <p className="text-sm font-medium text-green-700">
                  {poData.approvedBy.name}
                </p>
                <p className="text-xs text-slate-400">
                  {poData.approvalDate
                    ? format(
                        new Date(poData.approvalDate),
                        "dd MMM yyyy, HH:mm",
                      )
                    : "-"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
