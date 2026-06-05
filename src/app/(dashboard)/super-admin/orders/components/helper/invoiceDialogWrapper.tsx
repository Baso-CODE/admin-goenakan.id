// file: InvoiceDialogWrapper.tsx
"use client";

import { useApi } from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInvoiceDialog } from "../../hooks/useInvoiceDialog";
import { GenerateInvoiceDialog } from "./GenerateInvoiceDialog";

interface InvoiceDialogWrapperProps {
  orderId: string | null; // ✨ Harus mengizinkan null
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceDialogWrapper({
  orderId,
  onClose,
  onSuccess,
}: InvoiceDialogWrapperProps) {
  const { fetchApi } = useApi();
  const [order, setOrder] = useState<any | null>(null);
  const [noteCategories, setNoteCategories] = useState<any[]>([]);

  // Jalankan fetch JIKA orderId ada isinya
  useEffect(() => {
    async function loadData() {
      try {
        const [resOrder, resNotes] = await Promise.all([
          fetchApi(`/orders/${orderId}`),
          fetchApi("/invoice-notes/categories/list"),
        ]);

        if (!resOrder.ok) throw new Error("Gagal memuat detail order");

        const orderData = await resOrder.json();
        setOrder(orderData);

        if (resNotes.ok) {
          const notesData = await resNotes.json();
          setNoteCategories(notesData || []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal menyiapkan data invoice");
        handleClose();
      }
    }

    if (orderId) {
      loadData();
    } else {
      // Jika orderId kembali menjadi null, bersihkan data order lama
      setOrder(null);
    }
  }, [orderId, fetchApi]);

  // Fungsi perantara untuk menutup dialog
  const handleClose = () => {
    setOrder(null);
    onClose();
  };

  // ... (Kalkulasi Finansial tetap sama)
  const totalOrderAmount = order ? Number(order.totalAmount) : 0;
  const totalInvoiced =
    order?.invoices
      ?.filter((inv: any) => inv.status !== "CANCELLED")
      .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0) || 0;

  const remainingToInvoice = totalOrderAmount - totalInvoiced;
  const isFirstInvoice = order ? order.invoices?.length === 0 : true;

  const splitTotalAmountCalc = (selectedItems: any[]) =>
    selectedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const invoiceDialog = useInvoiceDialog({
    order,
    totalOrderAmount,
    remainingToInvoice,
    splitTotalAmount: splitTotalAmountCalc([] as any),
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const splitTotalAmount = invoiceDialog.selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  // Auto-open JIKA data order sudah berhasil diambil
  useEffect(() => {
    if (order && order.id === orderId) {
      invoiceDialog.setInvoiceDialogOpen(true);
    }
  }, [order, orderId]);

  // Pantau status onClose dari dialog
  useEffect(() => {
    if (order && !invoiceDialog.invoiceDialogOpen) {
      handleClose();
    }
  }, [invoiceDialog.invoiceDialogOpen]);

  // ✨ Jangan return null, lebih baik return fragment kosong agar mount stabil
  if (!order) return <></>;

  return (
    <GenerateInvoiceDialog
      open={invoiceDialog.invoiceDialogOpen}
      onOpenChange={invoiceDialog.setInvoiceDialogOpen}
      // ... pass props seperti biasa
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
  );
}
