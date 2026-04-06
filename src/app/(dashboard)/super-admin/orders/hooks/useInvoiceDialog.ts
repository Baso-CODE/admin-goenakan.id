import { apiUrl } from "@/helper/apiurl";
import { useState } from "react";
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
  splitTotalAmount,
  onSuccess,
}: UseInvoiceDialogProps) {
  // Dialog open state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // Standard mode
  const [invoiceCategory, setInvoiceCategory] = useState<string>("");
  const [dpType, setDpType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [invoiceDPPercent, setInvoiceDPPercent] = useState<number>(0);
  const [invoiceDPAmount, setInvoiceDPAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<number>(0);

  // Split mode
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SplitItem[]>([]);
  const [splitPaymentCategory, setSplitPaymentCategory] =
    useState<string>("FULL_PAYMENT");
  const [splitDpType, setSplitDpType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [splitDpPercent, setSplitDpPercent] = useState<number>(0);
  const [splitDpAmount, setSplitDpAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>("");
  // Notes
  const [invoiceNotes, setInvoiceNotes] = useState<InvoiceNote[]>([]);
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  // Loading
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const toggleNoteTemplate = (categoryId: string, templateContent: string) => {
    setInvoiceNotes((prev) => {
      const existingCat = prev.find((n) => n.categoryId === categoryId);
      if (existingCat) {
        const contentExists = existingCat.contents.includes(templateContent);
        const newContents = contentExists
          ? existingCat.contents.filter((c) => c !== templateContent)
          : [...existingCat.contents, templateContent];

        if (newContents.length === 0) {
          return prev.filter((n) => n.categoryId !== categoryId);
        }
        return prev.map((n) =>
          n.categoryId === categoryId ? { ...n, contents: newContents } : n,
        );
      }
      return [...prev, { categoryId, contents: [templateContent] }];
    });
  };

  const addManualNote = (categoryId: string) => {
    const text = manualInputs[categoryId];
    if (!text || text.trim() === "") return;
    toggleNoteTemplate(categoryId, text);
    setManualInputs((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const updateItemQty = (productId: string, newQty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const openDialog = () => {
    setInvoiceCategory("");
    setIsSplitMode(false);
    setSelectedItems([]);
    setPaymentDate("");
    setPaidAt("");
    setInvoiceDialogOpen(true);
  };

  const resetAndClose = () => {
    setInvoiceDialogOpen(false);
    setInvoiceCategory("");
    setIsSplitMode(false);
    setSelectedItems([]);
    setSplitPaymentCategory("FULL_PAYMENT");
    setSplitDpPercent(0);
    setSplitDpAmount(0);
    setInvoiceDPPercent(0);
    setInvoiceDPAmount(0);
    setCustomAmount(0);
    setInvoiceNotes([]);
    setManualInputs({});
    setPaymentDate("");
    setPaidAt("");
  };

  const handleCreateInvoice = async () => {
    if (!order) return;
    setIsCreatingInvoice(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      let finalDpPercentage: number | undefined = undefined;
      let finalCustomAmount: number | undefined = undefined;
      let payloadSelectedItems: any[] | undefined = undefined;

      if (isSplitMode) {
        if (selectedItems.length === 0) {
          throw new Error("Pilih minimal 1 produk untuk Split Invoice.");
        }
        payloadSelectedItems = selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        if (splitPaymentCategory === "DP") {
          if (splitDpType === "PERCENTAGE") {
            finalDpPercentage = splitDpPercent;
          } else if (splitTotalAmount > 0) {
            finalDpPercentage = (splitDpAmount / splitTotalAmount) * 100;
          }
        } else if (splitPaymentCategory === "INSTALLMENT") {
          finalCustomAmount = customAmount;
        }
      } else {
        if (invoiceCategory === "DP") {
          if (dpType === "PERCENTAGE") {
            finalDpPercentage = invoiceDPPercent;
          } else {
            if (totalOrderAmount > 0 && invoiceDPAmount > 0) {
              finalDpPercentage = (invoiceDPAmount / totalOrderAmount) * 100;
            } else {
              throw new Error("Isi nominal DP terlebih dahulu");
            }
          }
        }
      }

      const payload = {
        orderId: order.id,
        category: isSplitMode ? splitPaymentCategory : invoiceCategory,
        dpPercentage: finalDpPercentage,
        customAmount: finalCustomAmount,
        selectedItems: payloadSelectedItems,
        paymentDate: paymentDate || undefined,
        paidAt: paidAt || undefined,
        notes: invoiceNotes
          .filter((n) => n.contents.length > 0)
          .map((n) => ({ categoryId: n.categoryId, contents: n.contents })),
      };

      const res = await fetch(`${apiUrl}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membuat invoice");
      }

      const { toast } = await import("sonner");
      toast.success("Invoice berhasil dibuat!");
      resetAndClose();
      onSuccess();
    } catch (error: any) {
      const { toast } = await import("sonner");
      toast.error(error.message);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return {
    // State
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
    // Actions
    openDialog,
    resetAndClose,
    handleCreateInvoice,
    toggleNoteTemplate,
    addManualNote,
    updateItemQty,
  };
}
