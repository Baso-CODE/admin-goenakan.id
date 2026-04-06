import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  InvoiceNote,
  NoteCategory,
  OrderDetail,
  SplitItem,
} from "../../types/order.types";
import { InvoiceNotesSelector } from "../invoiceNotesSelector";
interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Order data
  order: OrderDetail;
  isFirstInvoice: boolean;
  remainingToInvoice: number;
  totalOrderAmount: number;

  // Standard mode
  isSplitMode: boolean;
  setIsSplitMode: (v: boolean) => void;
  invoiceCategory: string;
  setInvoiceCategory: (v: string) => void;
  dpType: "PERCENTAGE" | "FIXED";
  setDpType: (v: "PERCENTAGE" | "FIXED") => void;
  invoiceDPPercent: number;
  setInvoiceDPPercent: (v: number) => void;
  invoiceDPAmount: number;
  setInvoiceDPAmount: (v: number) => void;
  customAmount: number;
  setCustomAmount: (v: number) => void;

  // Split mode
  selectedItems: SplitItem[];
  setSelectedItems: (
    items: SplitItem[] | ((prev: SplitItem[]) => SplitItem[]),
  ) => void;
  splitPaymentCategory: string;
  setSplitPaymentCategory: (v: string) => void;
  splitDpType: "PERCENTAGE" | "FIXED";
  setSplitDpType: (v: "PERCENTAGE" | "FIXED") => void;
  splitDpPercent: number;
  setSplitDpPercent: (v: number) => void;
  splitDpAmount: number;
  setSplitDpAmount: (v: number) => void;
  splitTotalAmount: number;
  updateItemQty: (productId: string, newQty: number) => void;

  paymentDate?: string;
  setPaymentDate: (v: string) => void;
  paidAt?: string;
  setPaidAt: (v: string) => void;

  // Notes
  noteCategories: NoteCategory[];
  invoiceNotes: InvoiceNote[];
  manualInputs: Record<string, string>;
  setManualInputs: (inputs: Record<string, string>) => void;
  toggleNoteTemplate: (categoryId: string, content: string) => void;
  addManualNote: (categoryId: string) => void;

  // Submit
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
  splitPaymentCategory,
  setSplitPaymentCategory,
  splitDpType,
  setSplitDpType,
  splitDpPercent,
  setSplitDpPercent,
  splitDpAmount,
  setSplitDpAmount,
  splitTotalAmount,
  updateItemQty,
  paymentDate,
  setPaymentDate,
  paidAt,
  setPaidAt,
  noteCategories,
  invoiceNotes,
  manualInputs,
  setManualInputs,
  toggleNoteTemplate,
  addManualNote,
  isCreatingInvoice,
  onSubmit,
}: GenerateInvoiceDialogProps) {
  const isSubmitDisabled =
    isCreatingInvoice ||
    (!isSplitMode && !invoiceCategory) ||
    (isSplitMode && selectedItems.length === 0);
  // Tambah sementara sebelum filter

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Pilih metode penagihan untuk pesanan ini.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setIsSplitMode(false);
                setInvoiceCategory("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isSplitMode
                  ? "bg-white shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Standard (DP / Full)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSplitMode(true);
                setSplitPaymentCategory("FULL_PAYMENT");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isSplitMode
                  ? "bg-white shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Split Items (Partial)
            </button>
          </div>

          {/* MODE 1: STANDARD */}
          {!isSplitMode && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col gap-2">
                <Label>Jenis Tagihan</Label>
                <Select
                  value={invoiceCategory}
                  onValueChange={setInvoiceCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {isFirstInvoice && (
                      <>
                        <SelectItem value="FULL_PAYMENT">
                          Full Payment (Langsung Lunas)
                        </SelectItem>
                        <SelectItem value="DP">Down Payment (DP)</SelectItem>
                        <SelectItem value="INSTALLMENT">
                          Cicilan Pertama
                        </SelectItem>
                      </>
                    )}
                    {!isFirstInvoice && remainingToInvoice > 0 && (
                      <>
                        <SelectItem value="REMAINING_BALANCE">
                          Pelunasan (Sisa: {formatCurrency(remainingToInvoice)})
                        </SelectItem>
                        <SelectItem value="INSTALLMENT">
                          Cicilan Berikutnya (Manual)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {invoiceCategory === "DP" && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
                  <div className="flex items-center gap-4">
                    <Label className="text-xs">Tipe DP:</Label>
                    <div className="flex bg-white rounded border p-1">
                      {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDpType(t)}
                          className={`text-xs px-2 py-1 rounded ${
                            dpType === t
                              ? "bg-primary text-white"
                              : "text-gray-500"
                          }`}>
                          {t === "PERCENTAGE" ? "%" : "Rp"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {dpType === "PERCENTAGE" ? (
                    <div className="space-y-1">
                      <Input
                        type="number"
                        placeholder="%"
                        value={invoiceDPPercent}
                        onChange={(e) =>
                          setInvoiceDPPercent(Number(e.target.value))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Nominal:{" "}
                        {formatCurrency(
                          (totalOrderAmount * invoiceDPPercent) / 100,
                        )}
                      </p>
                    </div>
                  ) : (
                    <Input
                      type="number"
                      placeholder="Rp"
                      value={invoiceDPAmount}
                      onChange={(e) =>
                        setInvoiceDPAmount(Number(e.target.value))
                      }
                    />
                  )}
                </div>
              )}

              {invoiceCategory === "INSTALLMENT" && (
                <div className="space-y-2">
                  <Label>Nominal Tagihan (Rp)</Label>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {formatCurrency(remainingToInvoice)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: SPLIT ITEMS */}
          {isSplitMode && (
            <div className="space-y-4 animate-in fade-in">
              {/* Product table */}
              <div className="border rounded-md max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Bill Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.products

                      .filter((item) => {
                        const remaining =
                          item.remainingBilledAmount ??
                          item.unitPrice * item.quantity -
                            (item.billedAmount || 0);
                        return remaining > 0;
                      })

                      .map((item) => {
                        const maxQty =
                          item.remainingQuantity !== undefined
                            ? item.remainingQuantity
                            : item.quantity;
                        const isSelected = selectedItems.some(
                          (sel) =>
                            sel.productId === (item.productId || item.id),
                        );
                        const selectedData = selectedItems.find(
                          (sel) =>
                            sel.productId === (item.productId || item.id),
                        );

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedItems((prev: SplitItem[]) => [
                                      ...prev,
                                      {
                                        productId: item.productId || item.id,
                                        quantity: maxQty,
                                        maxQty,
                                        price: item.unitPrice,
                                      },
                                    ]);
                                  } else {
                                    setSelectedItems((prev: SplitItem[]) =>
                                      prev.filter(
                                        (i) =>
                                          i.productId !==
                                          (item.productId || item.id),
                                      ),
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">
                                {item.productName}
                              </div>
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 mt-0.5">
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span>
                                  Total:{" "}
                                  {formatCurrency(
                                    item.unitPrice * item.quantity,
                                  )}
                                </span>
                                {(item.billedAmount || 0) > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600">
                                      Sudah ditagih:{" "}
                                      {formatCurrency(item.billedAmount || 0)}
                                    </span>
                                    <span>•</span>
                                    <span className="text-orange-600 font-medium">
                                      Sisa:{" "}
                                      {formatCurrency(
                                        item.remainingBilledAmount || 0,
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isSelected ? (
                                <Input
                                  type="number"
                                  min={1}
                                  max={maxQty}
                                  className="h-8 w-20 text-center"
                                  value={selectedData?.quantity}
                                  onChange={(e) => {
                                    let val = Number(e.target.value);
                                    if (val > maxQty) val = maxQty;
                                    if (val < 1) val = 1;
                                    updateItemQty(
                                      item.productId || item.id,
                                      val,
                                    );
                                  }}
                                />
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                    {order.products.every((p) => {
                      const remaining =
                        p.remainingBilledAmount ??
                        p.unitPrice * p.quantity - (p.billedAmount || 0);
                      return remaining <= 0;
                    }) && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center h-20 text-gray-500">
                          Semua produk sudah lunas / dibuatkan invoice.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Split total */}
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md border border-blue-100">
                <span className="text-sm font-medium text-blue-900">
                  Total Item Dipilih:
                </span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(splitTotalAmount)}
                </span>
              </div>

              {/* Split payment category */}
              <div className="border-t pt-4 space-y-4">
                <Label className="text-sm font-semibold">
                  Jenis Tagihan Split
                </Label>
                <Select
                  value={splitPaymentCategory}
                  onValueChange={setSplitPaymentCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis Tagihan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_PAYMENT">
                      Full Payment (Langsung Lunas)
                    </SelectItem>
                    <SelectItem value="DP">Down Payment (DP)</SelectItem>
                    <SelectItem value="INSTALLMENT">Cicilan</SelectItem>
                    {selectedItems.some((sel) => {
                      const item = order.products.find(
                        (p) => (p.productId || p.id) === sel.productId,
                      );
                      return (item?.billedAmount || 0) > 0;
                    }) && (
                      <SelectItem value="REMAINING_BALANCE">
                        Pelunasan Sisa Item
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {splitPaymentCategory === "DP" && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
                    <div className="flex items-center gap-4">
                      <Label className="text-xs">Tipe DP:</Label>
                      <div className="flex bg-white rounded border p-1">
                        {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSplitDpType(t)}
                            className={`text-xs px-2 py-1 rounded ${
                              splitDpType === t
                                ? "bg-primary text-white"
                                : "text-gray-500"
                            }`}>
                            {t === "PERCENTAGE" ? "%" : "Rp"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {splitDpType === "PERCENTAGE" ? (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="Contoh: 50 (untuk 50%)"
                          value={splitDpPercent}
                          onChange={(e) =>
                            setSplitDpPercent(Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Nominal DP:{" "}
                          {formatCurrency(
                            (splitTotalAmount * splitDpPercent) / 100,
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="Nominal DP (Rp)"
                          value={splitDpAmount}
                          onChange={(e) =>
                            setSplitDpAmount(Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Max: {formatCurrency(splitTotalAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {splitPaymentCategory === "INSTALLMENT" && (
                  <div className="space-y-2">
                    <Label>Nominal Cicilan (Rp)</Label>
                    <Input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max: {formatCurrency(splitTotalAmount)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-4 animate-in fade-in">
            <h4 className="text-sm font-semibold text-gray-800">
              Informasi Pembayaran (Opsional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* --- TANGGAL MULAI TAGIHAN --- */}
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="paymentDate">Tanggal Mulai Tagihan</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="paymentDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? (
                        format(new Date(paymentDate), "dd MMMM yyyy", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate ? new Date(paymentDate) : undefined}
                      onSelect={(date) => {
                        // Ubah kembali ke format YYYY-MM-DD bawaan input asli
                        setPaymentDate(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-[10px] text-muted-foreground">
                  Tanggal invoice ini diterbitkan atau ditagihkan.
                </p>
              </div>

              {/* --- TANGGAL LUNAS (PAID AT) --- */}
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="paidAt">Tanggal Lunas (Paid At)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="paidAt"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paidAt && "text-muted-foreground",
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paidAt ? (
                        format(new Date(paidAt), "dd MMMM yyyy", {
                          locale: idLocale,
                        })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paidAt ? new Date(paidAt) : undefined}
                      onSelect={(date) => {
                        // Ubah kembali ke format YYYY-MM-DD bawaan input asli
                        setPaidAt(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-[10px] text-muted-foreground">
                  Isi jika tagihan ini sudah dilunasi sebelumnya.
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <InvoiceNotesSelector
            noteCategories={noteCategories}
            invoiceNotes={invoiceNotes}
            manualInputs={manualInputs}
            onToggleNote={toggleNoteTemplate}
            onManualInputChange={setManualInputs}
            onAddManualNote={addManualNote}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitDisabled}>
            {isCreatingInvoice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Proses...
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
