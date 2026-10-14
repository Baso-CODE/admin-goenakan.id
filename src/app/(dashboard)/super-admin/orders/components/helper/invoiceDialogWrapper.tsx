"use client";

import { useApi } from "@/hooks/useApi";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInvoiceDialog } from "../../hooks/useInvoiceDialog";
import type { NoteCategory, OrderDetail } from "../../types/order.types";
import { GenerateInvoiceDialog } from "./GenerateInvoiceDialog";

interface InvoiceDialogWrapperProps {
  orderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceDialogWrapper({
  orderId,
  onClose,
  onSuccess,
}: InvoiceDialogWrapperProps) {
  const { fetchApi, status } = useApi();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);
  const closedOrderIdRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);
  const fetchApiRef = useRef(fetchApi);

  onCloseRef.current = onClose;
  fetchApiRef.current = fetchApi;

  const handleClose = useCallback(() => {
    requestIdRef.current += 1;
    closedOrderIdRef.current = orderId;
    setOrder(null);
    setNoteCategories([]);
    setIsLoading(false);
    onCloseRef.current();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      requestIdRef.current += 1;
      closedOrderIdRef.current = null;
      return;
    }

    if (status !== "authenticated") return;

    if (closedOrderIdRef.current === orderId) return;

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);

      try {
        const [resOrder, resNotes] = await Promise.all([
          fetchApiRef.current(`/orders/${orderId}`),
          fetchApiRef.current("/invoice-notes/categories/list"),
        ]);

        if (!resOrder.ok) {
          throw new Error("Gagal memuat detail order");
        }

        const orderData: OrderDetail = await resOrder.json();

        if (!orderData?.id || orderData.id !== orderId) {
          throw new Error("Data order tidak sesuai");
        }

        let categories: NoteCategory[] = [];

        if (resNotes.ok) {
          const notesData = await resNotes.json();
          categories = Array.isArray(notesData)
            ? notesData
            : Array.isArray(notesData?.data)
              ? notesData.data
              : [];
        }

        if (cancelled || requestId !== requestIdRef.current) return;

        setOrder(orderData);
        setNoteCategories(categories);
      } catch (error) {
        if (cancelled || requestId !== requestIdRef.current) return;

        console.error("Gagal menyiapkan invoice:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Gagal menyiapkan data invoice",
        );

        closedOrderIdRef.current = orderId;
        onCloseRef.current();
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [orderId, status]);

  const totalOrderAmount = order ? Number(order.totalAmount) : 0;

  const activeInvoices = (order?.invoices ?? []).filter(
    (invoice) => invoice.status !== "CANCELLED" && invoice.status !== "DRAFT",
  );

  const totalInvoiced = activeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount),
    0,
  );

  const remainingToInvoice = Math.max(0, totalOrderAmount - totalInvoiced);

  const isFirstInvoice = activeInvoices.length === 0;

  const invoiceDialog = useInvoiceDialog({
    order,
    totalOrderAmount,
    remainingToInvoice,
    splitTotalAmount: 0,
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const { invoiceDialogOpen, setInvoiceDialogOpen, selectedItems } =
    invoiceDialog;

  const splitTotalAmount = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  useEffect(() => {
    if (!orderId || !order || isLoading) return;
    if (order.id !== orderId) return;
    if (closedOrderIdRef.current === orderId) return;

    setInvoiceDialogOpen(true);
  }, [orderId, order?.id, isLoading, setInvoiceDialogOpen]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setInvoiceDialogOpen(true);
      return;
    }

    if (invoiceDialog.isCreatingInvoice) return;

    setInvoiceDialogOpen(false);
    handleClose();
  };

  if (!order || order.id !== orderId || isLoading) {
    return null;
  }

  return (
    <GenerateInvoiceDialog
      open={invoiceDialogOpen}
      onOpenChange={handleOpenChange}
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
      selectedItems={selectedItems}
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
