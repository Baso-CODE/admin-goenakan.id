import { useApi } from "@/hooks/useApi";
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceNote, OrderDetail, SplitItem } from "../types/order.types";

interface UseInvoiceDialogProps {
  order: OrderDetail | null;
  totalOrderAmount: number;
  remainingToInvoice: number;
  splitTotalAmount: number;
  onSuccess: () => void;
}

export function useInvoiceDialog({
  order,
  totalOrderAmount,
  remainingToInvoice,
  onSuccess,
}: UseInvoiceDialogProps) {
  const { fetchApi, status } = useApi();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceCategory, setInvoiceCategory] = useState("");
  const [dpType, setDpType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [invoiceDPPercent, setInvoiceDPPercent] = useState(0);
  const [invoiceDPAmount, setInvoiceDPAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState(0);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SplitItem[]>([]);
  const [splitPaymentCategory, setSplitPaymentCategory] =
    useState("FULL_PAYMENT");
  const [splitDpType, setSplitDpType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [splitDpPercent, setSplitDpPercent] = useState(0);
  const [splitDpAmount, setSplitDpAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState<InvoiceNote[]>([]);
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const toggleNoteTemplate = (categoryId: string, content: string) => {
    setInvoiceNotes((prev) => {
      const existing = prev.find((note) => note.categoryId === categoryId);
      if (!existing) return [...prev, { categoryId, contents: [content] }];

      const contents = existing.contents.includes(content)
        ? existing.contents.filter((value) => value !== content)
        : [...existing.contents, content];

      if (!contents.length) {
        return prev.filter((note) => note.categoryId !== categoryId);
      }
      return prev.map((note) =>
        note.categoryId === categoryId ? { ...note, contents } : note,
      );
    });
  };

  const addManualNote = (categoryId: string) => {
    const content = manualInputs[categoryId]?.trim();
    if (!content) return;
    toggleNoteTemplate(categoryId, content);
    setManualInputs((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const updateItemQty = (orderProductId: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.orderProductId === orderProductId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQty)) }
          : item,
      ),
    );
  };

  const resetAndClose = () => {
    setInvoiceDialogOpen(false);
    setInvoiceCategory("");
    setDpType("PERCENTAGE");
    setInvoiceDPPercent(0);
    setInvoiceDPAmount(0);
    setCustomAmount(0);
    setIsSplitMode(false);
    setSelectedItems([]);
    setSplitPaymentCategory("FULL_PAYMENT");
    setSplitDpType("PERCENTAGE");
    setSplitDpPercent(0);
    setSplitDpAmount(0);
    setPaymentDate("");
    setPaidAt("");
    setInvoiceNotes([]);
    setManualInputs({});
  };

  const openDialog = () => {
    resetAndClose();
    setInvoiceDialogOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (!order || status !== "authenticated" || isCreatingInvoice) return;

    try {
      const billingMode = isSplitMode ? "PARTIAL_QUANTITY" : "STANDARD";
      let category = isSplitMode ? splitPaymentCategory : invoiceCategory;
      let dpPercentage: number | undefined;
      let finalCustomAmount: number | undefined;

      if (!category) throw new Error("Pilih jenis tagihan terlebih dahulu");
      if (remainingToInvoice <= 0) {
        throw new Error(
          "Order tidak memiliki sisa nilai yang dapat ditagihkan",
        );
      }

      if (isSplitMode) {
        if (
          !["FULL_PAYMENT", "INSTALLMENT", "REMAINING_BALANCE"].includes(
            category,
          )
        ) {
          throw new Error("Jenis tagihan tidak sesuai untuk Partial Quantity");
        }
        if (!selectedItems.length) throw new Error("Pilih minimal satu produk");

        const ids = selectedItems.map((item) => item.orderProductId);
        if (new Set(ids).size !== ids.length) {
          throw new Error("Produk yang sama tidak boleh dipilih dua kali");
        }

        for (const item of selectedItems) {
          if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            throw new Error("Quantity harus bilangan bulat positif");
          }
          if (item.quantity > item.maxQty) {
            throw new Error("Quantity melebihi jumlah produk tersedia");
          }
        }

        const total = selectedItems.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0,
        );
        if (total <= 0 || total > remainingToInvoice + 0.01) {
          throw new Error("Nilai produk melebihi sisa tagihan order");
        }
      } else {
        if (category === "DP") {
          if (dpType === "PERCENTAGE") {
            dpPercentage = invoiceDPPercent;
          } else {
            dpPercentage = (invoiceDPAmount / totalOrderAmount) * 100;
          }
          if (
            !Number.isFinite(dpPercentage) ||
            dpPercentage <= 0 ||
            dpPercentage > 100
          ) {
            throw new Error("Persentase atau nominal DP tidak valid");
          }
          const dpAmount = Math.floor((totalOrderAmount * dpPercentage) / 100);
          if (dpAmount <= 0 || dpAmount > remainingToInvoice) {
            throw new Error("DP melebihi sisa tagihan order");
          }
        }

        if (category === "INSTALLMENT") {
          if (
            !Number.isFinite(customAmount) ||
            customAmount <= 0 ||
            customAmount > remainingToInvoice
          ) {
            throw new Error("Nominal cicilan tidak valid");
          }
          finalCustomAmount = customAmount;
        }

        if (
          category === "FULL_PAYMENT" &&
          remainingToInvoice < totalOrderAmount
        ) {
          throw new Error(
            "Full Payment hanya untuk order yang belum pernah ditagihkan",
          );
        }
      }

      const payload = {
        orderId: order.id,
        billingMode,
        category,
        dpPercentage,
        customAmount: finalCustomAmount,
        selectedItems: isSplitMode
          ? selectedItems.map(({ orderProductId, quantity }) => ({
              orderProductId,
              quantity,
            }))
          : undefined,
        notes: invoiceNotes
          .filter((note) => note.contents.length > 0)
          .map((note) => ({
            categoryId: note.categoryId,
            contents: note.contents,
          })),
      };

      setIsCreatingInvoice(true);
      const res = await fetchApi("/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gagal membuat invoice");
      }

      toast.success("Invoice berhasil dibuat");
      resetAndClose();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat invoice",
      );
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return {
    invoiceDialogOpen,
    setInvoiceDialogOpen,
    invoiceCategory,
    setInvoiceCategory,
    dpType,
    setDpType,
    invoiceDPPercent,
    setInvoiceDPPercent,
    invoiceDPAmount,
    setInvoiceDPAmount,
    customAmount,
    setCustomAmount,
    isSplitMode,
    setIsSplitMode,
    selectedItems,
    setSelectedItems,
    splitPaymentCategory,
    setSplitPaymentCategory,
    splitDpType,
    setSplitDpType,
    splitDpPercent,
    setSplitDpPercent,
    splitDpAmount,
    setSplitDpAmount,
    paymentDate,
    setPaymentDate,
    paidAt,
    setPaidAt,
    invoiceNotes,
    manualInputs,
    setManualInputs,
    isCreatingInvoice,
    openDialog,
    resetAndClose,
    handleCreateInvoice,
    toggleNoteTemplate,
    addManualNote,
    updateItemQty,
  };
}
