"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarIcon, // Icon baru untuk Date Picker
  CheckCircle,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Import Calendar & Popover
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiUrl } from "@/helper/apiurl";
import { cn } from "@/lib/utils"; // Pastikan Anda punya utilitas cn

interface ShipmentManagerProps {
  type: "INBOUND" | "OUTBOUND";
  orderId: string;
  shipments: any[];
  products: any[];
  couriers: any[];
  onUpdate: () => void;
}

export default function ShipmentManager({
  type,
  orderId,
  shipments,
  products,
  couriers,
  onUpdate,
}: ShipmentManagerProps) {
  // === STATE MANAGEMENT ===
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // State untuk Mark Arrived
  const [confirmArriveId, setConfirmArriveId] = useState<string | null>(null);
  const [arriving, setArriving] = useState(false);

  // Date Picker State (Gunakan Date object, bukan string)
  const [arriveDate, setArriveDate] = useState<Date | undefined>(new Date());
  const [arriveRemarks, setArriveRemarks] = useState("");

  // Form States (Create Shipment)
  const [vendorId, setVendorId] = useState("");
  const [trackingNo, setTrackingNo] = useState("");

  // Field Origin, Destination, CourierLink DIHAPUS dari State (Disederhanakan)

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [method, setMethod] = useState("LAND");
  const [remarks, setRemarks] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    { id: string; qty: number }[]
  >([]);

  // === HELPER FUNCTIONS ===
  const getRemainingQty = (productId: string, totalOrderQty: number) => {
    let shippedCount = 0;
    shipments.forEach((ship) => {
      ship.items.forEach((item: any) => {
        if (item.orderProduct.productId === productId) {
          shippedCount += item.quantity;
        }
      });
    });
    return Math.max(0, totalOrderQty - shippedCount);
  };

  const handleToggleItem = (checked: boolean, product: any) => {
    if (checked) {
      const max = getRemainingQty(product.productId, product.quantity);
      if (max > 0) {
        setSelectedItems((prev) => [...prev, { id: product.id, qty: max }]);
      } else {
        toast.error("Item ini sudah terkirim semua (Quota habis)");
      }
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.id !== product.id));
    }
  };

  const handleQtyChange = (id: string, newQty: number, max: number) => {
    if (newQty > max) {
      toast.error(`Maksimal pengiriman adalah ${max}`);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: newQty } : i))
    );
  };

  // === API ACTIONS ===
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal 1 item untuk dikirim");
      return;
    }
    if (!vendorId) {
      toast.error("Pilih Vendor/Ekspedisi");
      return;
    }
    if (!trackingNo) {
      toast.error("Nomor Resi wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const payload = {
        orderId,
        type,
        vendorId,
        trackingNumber: trackingNo,
        // Courier Link diambil otomatis di backend
        // Origin & Destination dibuat null (optional)
        method,
        departureDate: date ? date.toISOString() : new Date().toISOString(),
        remarks: remarks || null,
        items: selectedItems.map((i) => ({
          orderProductId: i.id,
          quantity: Number(i.qty),
        })),
      };

      const res = await fetch(`${apiUrl}/logistics/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Pengiriman berhasil dibuat!");
      setIsOpen(false);
      onUpdate();

      // Reset Form
      setSelectedItems([]);
      setVendorId("");
      setTrackingNo("");
      setRemarks("");
      setDate(new Date());
    } catch (e) {
      toast.error("Gagal membuat pengiriman");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArrive = async () => {
    if (!confirmArriveId) return;
    setArriving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      await fetch(`${apiUrl}/logistics/shipments/${confirmArriveId}/arrive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          arrivalDate: arriveDate
            ? arriveDate.toISOString()
            : new Date().toISOString(),
          remarks: arriveRemarks || "Arrived confirmed by Admin",
        }),
      });

      toast.success("Status updated: Arrived");
      onUpdate();

      // Close & Reset
      setConfirmArriveId(null);
      setArriveRemarks("");
      setArriveDate(new Date());
    } catch (e) {
      toast.error("Failed to update");
    } finally {
      setArriving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        className={
          type === "INBOUND"
            ? "border-t-4 border-t-blue-500 shadow-sm"
            : "border-t-4 border-t-green-500 shadow-sm"
        }>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {type === "INBOUND"
                ? "Inbound Log (Masuk)"
                : "Outbound Log (Keluar)"}
            </CardTitle>
            <CardDescription>
              {type === "INBOUND"
                ? "Catat perjalanan dari Vendor -> Gudang -> HO."
                : "Catat pengiriman dari HO -> Client."}
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Buat Pengiriman Baru
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center justify-center">
                <Truck className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p>Belum ada riwayat pengiriman {type.toLowerCase()}.</p>
              </div>
            ) : (
              shipments.map((ship) => (
                <div
                  key={ship.id}
                  className="border rounded-lg p-5 bg-card hover:shadow-md transition-shadow">
                  {/* HEADER CARD */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    {/* INFO KIRI: Tracking & Lokasi */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs px-2 py-0.5">
                          {ship.method}
                        </Badge>

                        {/* Tracking No + Link */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-lg tracking-tight">
                            {ship.trackingNumber || "No Resi"}
                          </span>
                          {ship.courierLink && (
                            <Link
                              href={
                                ship.courierLink.startsWith("http")
                                  ? ship.courierLink
                                  : `https://${ship.courierLink}`
                              }
                              target="_blank"
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-50"
                              title="Lacak Resi">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>

                        <Badge
                          className={
                            ship.status === "ARRIVED"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }>
                          {ship.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">
                          {ship.vendor?.companyName || "Unknown Courier"}
                        </span>
                        {(ship.origin || ship.destination) && (
                          <>
                            <span className="text-muted-foreground/30">|</span>
                            <MapPin className="h-4 w-4" />
                            <span>{ship.origin || "?"}</span>
                            <span className="text-muted-foreground/50">➝</span>
                            <span>{ship.destination || "?"}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ACTION BUTTONS (KANAN) */}
                    <div className="flex gap-2">
                      <Link
                        href={`/super-admin/logistics/print/${ship.id}`}
                        target="_blank">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 border-gray-300 hover:bg-gray-100 text-gray-700">
                          <FileText className="h-3.5 w-3.5" />
                          {type === "OUTBOUND" ? "Surat Jalan" : "Manifest"}
                        </Button>
                      </Link>

                      {/* TOMBOL MARK ARRIVED */}
                      {ship.status === "DISPATCHED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors gap-2"
                          onClick={() => {
                            setConfirmArriveId(ship.id);
                            setArriveDate(new Date());
                            setArriveRemarks("");
                          }}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Arrived
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ITEM LIST */}
                  <div className="bg-muted/30 p-3 rounded-md border text-sm">
                    <p className="font-semibold mb-2 text-[10px] uppercase text-muted-foreground tracking-wider">
                      Items in this shipment:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                      {ship.items.map((item: any) => (
                        <li key={item.id} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/40"></span>
                          <span>{item.orderProduct.product.name}</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5 ml-auto">
                            {item.quantity} pcs
                          </Badge>
                        </li>
                      ))}
                    </ul>

                    {ship.remarks && (
                      <>
                        <Separator className="my-3 bg-muted-foreground/10" />
                        <div className="flex gap-2 items-start text-muted-foreground">
                          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                          <div>
                            <span className="text-[10px] font-bold uppercase mr-1">
                              Note:
                            </span>
                            <span className="text-xs italic">
                              {ship.remarks}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* FOOTER DATE */}
                  <div className="mt-3 flex items-center text-xs text-muted-foreground font-medium">
                    <span>
                      Berangkat:{" "}
                      {ship.departureDate
                        ? format(new Date(ship.departureDate), "dd MMM yyyy", {
                            locale: idLocale,
                          })
                        : "-"}
                    </span>
                    {ship.arrivalDate && (
                      <>
                        <span className="mx-2 text-muted-foreground/30">•</span>
                        <span className="text-green-600">
                          Sampai:{" "}
                          {format(new Date(ship.arrivalDate), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* === CREATE DIALOG (SIMPLIFIED) === */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Pengiriman Baru ({type})</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 1. Vendor Selection */}
            <div className="grid gap-2">
              <Label>Ekspedisi / Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Ekspedisi / Vendor" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 2. Resi Input */}
              <div className="grid gap-2">
                <Label>No. Resi (Tracking Number)</Label>
                <Input
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Masukkan Nomor Resi"
                />
              </div>

              {/* 3. Method Selection */}
              <div className="grid gap-2">
                <Label>Metode</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAND">Darat</SelectItem>
                    <SelectItem value="SEA">Laut</SelectItem>
                    <SelectItem value="AIR">Udara</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. Date Picker (Shadcn UI) */}
            <div className="grid gap-2">
              <Label>Tanggal Berangkat</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: idLocale })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Catatan (Opsional)</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Catatan tambahan..."
              />
            </div>

            <Separator className="my-2" />

            {/* 5. Items Selection */}
            <div>
              <Label className="mb-2 block font-semibold">
                Pilih Barang untuk Dikirim:
              </Label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Sisa</TableHead>
                      <TableHead>Kirim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => {
                      const remaining = getRemainingQty(
                        p.productId,
                        p.quantity
                      );
                      const isSelected = selectedItems.find(
                        (i) => i.id === p.id
                      );
                      if (remaining === 0 && !isSelected) return null;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Checkbox
                              checked={!!isSelected}
                              onCheckedChange={(c) => handleToggleItem(!!c, p)}
                              disabled={remaining === 0}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {p.productName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{remaining}</Badge>
                          </TableCell>
                          <TableCell>
                            {isSelected ? (
                              <Input
                                type="number"
                                className="h-8 w-20"
                                value={isSelected.qty}
                                max={remaining}
                                min={1}
                                onChange={(e) =>
                                  handleQtyChange(
                                    p.id,
                                    Number(e.target.value),
                                    remaining
                                  )
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Pengiriman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === MODAL ARRIVED DIALOG (Date Picker Updated) === */}
      <Dialog
        open={!!confirmArriveId}
        onOpenChange={(open) => {
          if (!open) setConfirmArriveId(null);
        }}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Konfirmasi Barang Sampai</DialogTitle>
            <CardDescription>
              Status pengiriman akan diubah menjadi <strong>ARRIVED</strong>.
            </CardDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="arriveDate">Tanggal Sampai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !arriveDate && "text-muted-foreground"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arriveDate ? (
                      format(arriveDate, "PPP", { locale: idLocale })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={arriveDate}
                    onSelect={setArriveDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="arriveRemarks">Catatan Tambahan (Opsional)</Label>
              <Input
                id="arriveRemarks"
                placeholder="Contoh: Diterima oleh Satpam"
                value={arriveRemarks}
                onChange={(e) => setArriveRemarks(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmArriveId(null)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmArrive}
              disabled={arriving}
              className="bg-green-600 hover:bg-green-700">
              {arriving ? "Menyimpan..." : "Konfirmasi Sampai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
