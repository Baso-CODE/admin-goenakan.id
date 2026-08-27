"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Edit,
  ExternalLink,
  FileText,
  Printer,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmCancelDialog } from "@/app/(dashboard)/components/confirmCancelDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { useInvoiceDialog } from "../hooks/useInvoiceDialog";
import { NoteCategory, OrderDetail } from "../types/order.types";
import { FinancialSummaryCard } from "./financialSummaryCard";
import { GenerateInvoiceDialog } from "./helper/GenerateInvoiceDialog";
import { InvoiceHistoryTable } from "./invoiceHistoryTable";
import { OrderItemsTable } from "./orderItemsTable";
import { OrderSampleFollowUps } from "./orderSampleFollowUps";
import {
  CustomerCard,
  SalesCard,
  ShippingCard,
  VendorsCard,
} from "./orderSidebarCards";

export default function OrderDetailPage() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // === FETCH ORDER ===
  const loadOrder = async () => {
    if (!id || status !== "authenticated") return;

    try {
      setLoading(true);
      const res = await fetchApi(`/orders/${id}`);

      if (!res.ok) throw new Error("Gagal memuat detail order");

      const data = await res.json();

      setOrder(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat detail order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id, status, fetchApi]);

  // === FETCH NOTE CATEGORIES ===
  useEffect(() => {
    const fetchNoteCategories = async () => {
      if (status !== "authenticated") return;

      try {
        //  Gunakan fetchApi (Otomatis handle Base URL dan Token)
        const res = await fetchApi("/invoice-notes/categories/list");

        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setNoteCategories(data || []);
      } catch (error) {
        console.error("Failed to load note categories", error);
      }
    };

    fetchNoteCategories();
  }, [status, fetchApi]);

  // === FINANCIAL CALCULATIONS ===
  const totalOrderAmount = order ? Number(order.totalAmount) : 0;

  const totalInvoiced =
    order?.invoices
      .filter((inv) => inv.status !== "CANCELLED")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0;

  const totalPaid =
    order?.invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0;

  const remainingToInvoice = totalOrderAmount - totalInvoiced;
  const paymentProgress =
    totalOrderAmount > 0 ? Math.round((totalPaid / totalOrderAmount) * 100) : 0;
  const isFirstInvoice = order ? order.invoices.length === 0 : true;

  // === INVOICE DIALOG HOOK ===
  const splitTotalAmountCalc = (selectedItems: any[]) =>
    selectedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const invoiceDialog = useInvoiceDialog({
    order,
    totalOrderAmount,
    remainingToInvoice,
    splitTotalAmount: splitTotalAmountCalc(/* will be injected */ [] as any),
    onSuccess: loadOrder,
  });

  const handleConfirmCancel = async () => {
    try {
      setIsCancelling(true);
      const res = await fetchApi(`/orders/${id}/cancel`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Gagal membatalkan order");

      toast.success("Order berhasil dibatalkan");
      setIsCancelOpen(false);
      loadOrder(); // Muat ulang data detail order
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat membatalkan order");
    } finally {
      setIsCancelling(false);
    }
  };
  // Compute splitTotalAmount from selected items
  const splitTotalAmount = invoiceDialog.selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  if (loading) return <DetailPageSkeleton />;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-semibold text-gray-600">
          Order tidak ditemukan
        </h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 mx-auto pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Order {order.orderNumber}
                </h1>
                <Badge
                  variant={
                    order.salesCategory === "SAMPLE" ? "secondary" : "default"
                  }>
                  {order.salesCategory}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(order.dateOrder), "dd MMMM yyyy", {
                  locale: idLocale,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button
              onClick={() =>
                router.push(`/super-admin/orders/edit/${order.id}`)
              }>
              <Edit className="mr-2 h-4 w-4" /> Edit Order
            </Button>

            {(order as any).status !== "CANCELLED" && (
              <Button
                variant="destructive"
                onClick={() => setIsCancelOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Batalkan Order
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* FINANCIAL SUMMARY */}
        <FinancialSummaryCard
          totalOrderAmount={totalOrderAmount}
          totalInvoiced={totalInvoiced}
          currencyCode={order.currencyCode}
          totalPaid={totalPaid}
          remainingToInvoice={remainingToInvoice}
          paymentProgress={paymentProgress}
          onGenerateInvoice={invoiceDialog.openDialog}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <InvoiceHistoryTable invoices={order.invoices} />
            <OrderItemsTable
              currencyCode={order.currencyCode}
              products={order.products}
              totalAmount={order.totalAmount}
            />
            <ShippingCard shippingAddress={order.shippingAddress} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <CustomerCard
              clientInfo={order.clientInfo}
              purchaseChannelName={order.purchaseChannelName}
            />
            {order.clientPurchaseOrder && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Client Purchase Order (PO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Nomor PO Client:
                    </span>
                    <span className="font-medium text-slate-800">
                      {order.clientPurchaseOrder.poNumber || "-"}
                    </span>
                  </div>
                  {order.clientPurchaseOrder?.fileUrl ? (
                    <div className="pt-2 border-t flex items-center justify-between gap-2">
                      <span
                        className="text-xs truncate max-w-45 text-muted-foreground"
                        title={
                          order.clientPurchaseOrder.fileName || "Dokumen PO"
                        }>
                        📎 {order.clientPurchaseOrder.fileName || "Dokumen PO"}
                      </span>

                      {/* ✨ TOMBOL UNDUH AMAN */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex items-center gap-1.5"
                        asChild>
                        <a
                          href={order.clientPurchaseOrder.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={
                            order.clientPurchaseOrder.fileName ||
                            "client-po.pdf"
                          }>
                          <ExternalLink className="h-3 w-3" /> Unduh File
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pt-1">
                      Tidak ada file dokumen yang dilampirkan.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            <SalesCard sales={order.sales} />
            <VendorsCard vendors={order.vendors} />

            {order.salesCategory === "SAMPLE" && (
              <OrderSampleFollowUps
                orderId={order.id}
                followUps={order.sampleFollowUps || []}
                onUpdate={loadOrder}
              />
            )}
          </div>
        </div>

        {/* INVOICE DIALOG */}
        <GenerateInvoiceDialog
          open={invoiceDialog.invoiceDialogOpen}
          onOpenChange={invoiceDialog.setInvoiceDialogOpen}
          order={order}
          isFirstInvoice={isFirstInvoice}
          remainingToInvoice={remainingToInvoice}
          totalOrderAmount={totalOrderAmount}
          isSplitMode={invoiceDialog.isSplitMode}
          setIsSplitMode={invoiceDialog.setIsSplitMode}
          invoiceCategory={invoiceDialog.invoiceCategory}
          setInvoiceCategory={invoiceDialog.setInvoiceCategory}
          dpType={invoiceDialog.dpType}
          setDpType={invoiceDialog.setDpType}
          invoiceDPPercent={invoiceDialog.invoiceDPPercent}
          setInvoiceDPPercent={invoiceDialog.setInvoiceDPPercent}
          invoiceDPAmount={invoiceDialog.invoiceDPAmount}
          setInvoiceDPAmount={invoiceDialog.setInvoiceDPAmount}
          customAmount={invoiceDialog.customAmount}
          setCustomAmount={invoiceDialog.setCustomAmount}
          selectedItems={invoiceDialog.selectedItems}
          setSelectedItems={invoiceDialog.setSelectedItems}
          splitPaymentCategory={invoiceDialog.splitPaymentCategory}
          setSplitPaymentCategory={invoiceDialog.setSplitPaymentCategory}
          splitDpType={invoiceDialog.splitDpType}
          setSplitDpType={invoiceDialog.setSplitDpType}
          splitDpPercent={invoiceDialog.splitDpPercent}
          setSplitDpPercent={invoiceDialog.setSplitDpPercent}
          splitDpAmount={invoiceDialog.splitDpAmount}
          setSplitDpAmount={invoiceDialog.setSplitDpAmount}
          splitTotalAmount={splitTotalAmount}
          updateItemQty={invoiceDialog.updateItemQty}
          paymentDate={invoiceDialog.paymentDate}
          setPaymentDate={invoiceDialog.setPaymentDate}
          paidAt={invoiceDialog.paidAt}
          setPaidAt={invoiceDialog.setPaidAt}
          noteCategories={noteCategories}
          invoiceNotes={invoiceDialog.invoiceNotes}
          manualInputs={invoiceDialog.manualInputs}
          setManualInputs={invoiceDialog.setManualInputs}
          toggleNoteTemplate={invoiceDialog.toggleNoteTemplate}
          addManualNote={invoiceDialog.addManualNote}
          isCreatingInvoice={invoiceDialog.isCreatingInvoice}
          onSubmit={invoiceDialog.handleCreateInvoice}
        />
      </div>
      <ConfirmCancelDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
    </>
  );
}

// Skeleton
function DetailPageSkeleton() {
  return (
    <div className="space-y-6 mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
