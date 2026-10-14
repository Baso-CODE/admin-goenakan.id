"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { Loader2, Package, ReceiptText, Wallet } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type {
  InvoiceNote,
  NoteCategory,
  OrderDetail,
  SplitItem,
} from "../../types/order.types";
import { InvoiceNotesSelector } from "../invoiceNotesSelector";

type DpType = "PERCENTAGE" | "FIXED";

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
  isFirstInvoice: boolean;
  remainingToInvoice: number;
  totalOrderAmount: number;
  isSplitMode: boolean;
  setIsSplitMode: (value: boolean) => void;
  invoiceCategory: string;
  setInvoiceCategory: (value: string) => void;
  dpType: DpType;
  setDpType: (value: DpType) => void;
  invoiceDPPercent: number;
  setInvoiceDPPercent: (value: number) => void;
  invoiceDPAmount: number;
  setInvoiceDPAmount: (value: number) => void;
  customAmount: number;
  setCustomAmount: (value: number) => void;
  selectedItems: SplitItem[];
  setSelectedItems: Dispatch<SetStateAction<SplitItem[]>>;
  splitPaymentCategory: string;
  setSplitPaymentCategory: (value: string) => void;
  splitDpType: DpType;
  setSplitDpType: (value: DpType) => void;
  splitDpPercent: number;
  setSplitDpPercent: (value: number) => void;
  splitDpAmount: number;
  setSplitDpAmount: (value: number) => void;
  splitTotalAmount: number;
  updateItemQty: (orderProductId: string, quantity: number) => void;
  paymentDate?: string;
  setPaymentDate: (value: string) => void;
  paidAt?: string;
  setPaidAt: (value: string) => void;
  noteCategories: NoteCategory[];
  invoiceNotes: InvoiceNote[];
  manualInputs: Record<string, string>;
  setManualInputs: (inputs: Record<string, string>) => void;
  toggleNoteTemplate: (categoryId: string, content: string) => void;
  addManualNote: (categoryId: string) => void;
  isCreatingInvoice: boolean;
  onSubmit: () => void;
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  order,
  isFirstInvoice,
  remainingToInvoice,
  totalOrderAmount,
  isSplitMode,
  setIsSplitMode,
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
  selectedItems,
  setSelectedItems,
  setSplitPaymentCategory,
  splitTotalAmount,
  updateItemQty,
  noteCategories,
  invoiceNotes,
  manualInputs,
  setManualInputs,
  toggleNoteTemplate,
  addManualNote,
  isCreatingInvoice,
  onSubmit,
}: GenerateInvoiceDialogProps) {
  const activeInvoices = (order.invoices ?? []).filter(
    (invoice) => invoice.status !== "CANCELLED" && invoice.status !== "DRAFT",
  );

  const hasStandardInvoice = activeInvoices.some(
    (invoice) => invoice.billingMode === "STANDARD",
  );

  const hasPartialInvoice = activeInvoices.some(
    (invoice) => invoice.billingMode === "PARTIAL_QUANTITY",
  );

  const hasUnknownInvoiceMode = activeInvoices.some(
    (invoice) => !invoice.billingMode,
  );

  const canUseStandard = !hasPartialInvoice && !hasUnknownInvoiceMode;
  const canUsePartial = !hasStandardInvoice && !hasUnknownInvoiceMode;

  const remainingAmount = Math.max(0, Number(remainingToInvoice));

  const selectedTotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  const estimatedDp =
    dpType === "PERCENTAGE"
      ? Math.floor((totalOrderAmount * invoiceDPPercent) / 100)
      : invoiceDPAmount;

  const estimatedAmount = isSplitMode
    ? selectedTotal
    : invoiceCategory === "FULL_PAYMENT"
      ? totalOrderAmount
      : invoiceCategory === "DP"
        ? estimatedDp
        : invoiceCategory === "INSTALLMENT"
          ? customAmount
          : invoiceCategory === "REMAINING_BALANCE"
            ? remainingAmount
            : 0;

  const estimatedRemaining = Math.max(0, remainingAmount - estimatedAmount);

  const availableProducts = order.products.filter((item) => {
    const quantity =
      item.remainingQuantity !== undefined
        ? Number(item.remainingQuantity)
        : Number(item.quantity);

    return quantity > 0 && Number(item.unitPrice) > 0;
  });

  const invalidSelection = selectedItems.some((selected) => {
    const product = order.products.find(
      (item) => item.id === selected.orderProductId,
    );
    if (!product) return true;

    const maxQuantity =
      product.remainingQuantity !== undefined
        ? Number(product.remainingQuantity)
        : Number(product.quantity);

    return (
      !Number.isInteger(selected.quantity) ||
      selected.quantity < 1 ||
      selected.quantity > maxQuantity
    );
  });

  const invalidStandard =
    !invoiceCategory ||
    (invoiceCategory === "DP" &&
      (!Number.isFinite(estimatedDp) ||
        estimatedDp <= 0 ||
        estimatedDp > remainingAmount ||
        (dpType === "PERCENTAGE" &&
          (invoiceDPPercent <= 0 || invoiceDPPercent > 100)))) ||
    (invoiceCategory === "INSTALLMENT" &&
      (!Number.isFinite(customAmount) ||
        customAmount <= 0 ||
        customAmount > remainingAmount)) ||
    (invoiceCategory === "FULL_PAYMENT" && !isFirstInvoice);

  const invalidPartial =
    selectedItems.length === 0 ||
    invalidSelection ||
    selectedTotal <= 0 ||
    selectedTotal > remainingAmount + 0.01;

  const isSubmitDisabled =
    isCreatingInvoice ||
    remainingAmount <= 0 ||
    (isSplitMode
      ? !canUsePartial || invalidPartial
      : !canUseStandard || invalidStandard);

  const selectProduct = (orderProductId: string, checked: boolean) => {
    const product = order.products.find((item) => item.id === orderProductId);
    if (!product) return;

    const maxQty =
      product.remainingQuantity !== undefined
        ? Number(product.remainingQuantity)
        : Number(product.quantity);

    setSelectedItems((prev) => {
      if (!checked) {
        return prev.filter((item) => item.orderProductId !== orderProductId);
      }

      if (
        maxQty < 1 ||
        prev.some((item) => item.orderProductId === orderProductId)
      ) {
        return prev;
      }

      return [
        ...prev,
        {
          orderProductId,
          quantity: maxQty,
          maxQty,
          price: Number(product.unitPrice),
        },
      ];
    });
  };

  const handleChangeMode = (partial: boolean) => {
    if (partial && !canUsePartial) return;
    if (!partial && !canUseStandard) return;

    setIsSplitMode(partial);
    setSelectedItems([]);
    setInvoiceCategory("");
    setSplitPaymentCategory("FULL_PAYMENT");
  };

  const money = (amount: number) =>
    formatCurrency(amount, order.currencyCode || "IDR");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Buat tagihan untuk Order {order.orderNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Total Purchase Order
              </p>
              <p className="font-bold text-base mt-1">
                {money(totalOrderAmount)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Total Sudah Ditagihkan
              </p>
              <p className="font-bold text-base mt-1">
                {money(totalOrderAmount - remainingAmount)}
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-700">Remaining to Invoice</p>
              <p className="font-bold text-blue-800 text-base mt-1">
                {money(remainingAmount)}
              </p>
            </div>
          </div>

          {hasUnknownInvoiceMode && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Ada invoice lama tanpa informasi billing mode. Pastikan mode
              invoice sebelumnya terlebih dahulu sebelum membuat tagihan baru
              untuk order ini.
            </div>
          )}

          <div className="space-y-2">
            <Label>Metode Penagihan</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <Button
                type="button"
                variant={!isSplitMode ? "default" : "ghost"}
                disabled={!canUseStandard || isCreatingInvoice}
                onClick={() => handleChangeMode(false)}
                className="gap-2">
                <Wallet className="h-4 w-4" />
                Standard
              </Button>
              <Button
                type="button"
                variant={isSplitMode ? "default" : "ghost"}
                disabled={!canUsePartial || isCreatingInvoice}
                onClick={() => handleChangeMode(true)}
                className="gap-2">
                <Package className="h-4 w-4" />
                Partial Quantity
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Standard untuk DP, cicilan nominal, dan pelunasan. Partial
              Quantity untuk menagih berdasarkan jumlah produk yang dipilih.
            </p>
          </div>

          {!isSplitMode && canUseStandard && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label>Jenis Tagihan</Label>
                <Select
                  value={invoiceCategory}
                  onValueChange={setInvoiceCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {isFirstInvoice ? (
                      <>
                        <SelectItem value="FULL_PAYMENT">
                          Full Payment
                        </SelectItem>
                        <SelectItem value="DP">Down Payment (DP)</SelectItem>
                        <SelectItem value="INSTALLMENT">
                          Cicilan Pertama
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="INSTALLMENT">
                          Cicilan Berikutnya
                        </SelectItem>
                        <SelectItem value="REMAINING_BALANCE">
                          Balance Payment / Pelunasan
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {invoiceCategory === "DP" && (
                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                  <Label>Perhitungan DP</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={dpType === "PERCENTAGE" ? "default" : "outline"}
                      onClick={() => setDpType("PERCENTAGE")}>
                      Persentase (%)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={dpType === "FIXED" ? "default" : "outline"}
                      onClick={() => setDpType("FIXED")}>
                      Nominal
                    </Button>
                  </div>

                  {dpType === "PERCENTAGE" ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={invoiceDPPercent}
                        onChange={(event) =>
                          setInvoiceDPPercent(Number(event.target.value))
                        }
                        placeholder="Contoh: 50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Estimasi DP: {money(estimatedDp)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min={1}
                        max={remainingAmount}
                        value={invoiceDPAmount}
                        onChange={(event) =>
                          setInvoiceDPAmount(Number(event.target.value))
                        }
                        placeholder="Masukkan nominal DP"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maksimal: {money(remainingAmount)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {invoiceCategory === "INSTALLMENT" && (
                <div className="space-y-2">
                  <Label>Nominal Cicilan</Label>
                  <Input
                    type="number"
                    min={1}
                    max={remainingAmount}
                    value={customAmount}
                    onChange={(event) =>
                      setCustomAmount(Number(event.target.value))
                    }
                    placeholder="Nominal cicilan"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maksimal: {money(remainingAmount)}
                  </p>
                </div>
              )}

              {invoiceCategory === "REMAINING_BALANCE" && (
                <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  Invoice ini akan menagihkan seluruh sisa nilai order yang
                  belum dibuatkan invoice.
                </p>
              )}
            </div>
          )}

          {isSplitMode && canUsePartial && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">
                  Pilih Produk dan Quantity
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pilih hanya produk dan jumlah yang ingin ditagihkan pada
                  invoice ini.
                </p>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12" />
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Qty Order</TableHead>
                      <TableHead className="text-right">Sisa Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="w-28">Bill Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableProducts.map((product) => {
                      const maxQty =
                        product.remainingQuantity !== undefined
                          ? Number(product.remainingQuantity)
                          : Number(product.quantity);

                      const selected = selectedItems.find(
                        (item) => item.orderProductId === product.id,
                      );

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={!!selected}
                              onCheckedChange={(checked) =>
                                selectProduct(product.id, checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {product.productName}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {product.sku || product.variantName || "-"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {product.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {maxQty}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(Number(product.unitPrice))}
                          </TableCell>
                          <TableCell>
                            {selected ? (
                              <Input
                                type="number"
                                min={1}
                                max={maxQty}
                                step={1}
                                value={selected.quantity}
                                onChange={(event) =>
                                  updateItemQty(
                                    product.id,
                                    Number(event.target.value),
                                  )
                                }
                                className="h-9 w-24"
                              />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!availableProducts.length && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground">
                          Tidak ada produk dengan quantity tersisa.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900">
                  <ReceiptText className="h-4 w-4" />
                  <h4 className="font-semibold text-sm">
                    Partial Quantity Billing
                  </h4>
                </div>
                <p className="text-xs text-blue-700">
                  Nominal tagihan dihitung berdasarkan quantity yang dipilih
                  dikalikan harga satuan.
                </p>
                <div className="flex items-center justify-between gap-3 border-t border-blue-200 pt-3">
                  <span className="text-sm font-medium">Current Billing</span>
                  <span className="text-lg font-bold text-blue-800">
                    {money(selectedTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <InvoiceNotesSelector
            noteCategories={noteCategories}
            invoiceNotes={invoiceNotes}
            manualInputs={manualInputs}
            onToggleNote={toggleNoteTemplate}
            onManualInputChange={setManualInputs}
            onAddManualNote={addManualNote}
          />

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="font-semibold text-sm">Ringkasan Invoice</h4>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Sisa Tagihan Sebelum Invoice
              </span>
              <span>{money(remainingAmount)}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Current Amount Due</span>
              <span className="font-bold">{money(estimatedAmount)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t pt-3 text-sm">
              <span className="font-medium">Estimasi Sisa Setelah Invoice</span>
              <span className="font-bold">{money(estimatedRemaining)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ringkasan merupakan estimasi. Perhitungan dan validasi final
              dilakukan oleh backend. Membuat invoice tidak otomatis mencatat
              pembayaran.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isCreatingInvoice}
            onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" disabled={isSubmitDisabled} onClick={onSubmit}>
            {isCreatingInvoice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Buat Invoice"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
