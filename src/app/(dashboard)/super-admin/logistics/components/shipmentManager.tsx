"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CheckCircle, MapPin, Plus, Truck } from "lucide-react";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog"; // Pastikan path ini benar
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // State untuk Dialog Konfirmasi Arrive
  const [confirmArriveId, setConfirmArriveId] = useState<string | null>(null);
  const [arriving, setArriving] = useState(false);

  // Form States
  const [vendorId, setVendorId] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("LAND");
  const [selectedItems, setSelectedItems] = useState<
    { id: string; qty: number }[]
  >([]);

  // === CALCULATE REMAINING QTY ===
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

  // === SUBMIT CREATE SHIPMENT ===
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal 1 item untuk dikirim");
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
        origin,
        destination,
        method,
        departureDate: new Date(date).toISOString(),
        items: selectedItems.map((i) => ({
          orderProductId: i.id,
          quantity: i.qty,
        })),
      };

      const res = await fetch("http://localhost:8000/logistics/shipments", {
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
      setSelectedItems([]);
    } catch (e) {
      toast.error("Gagal membuat pengiriman");
    } finally {
      setLoading(false);
    }
  };

  // === MARK AS ARRIVED ACTION ===
  const handleConfirmArrive = async () => {
    if (!confirmArriveId) return;

    setArriving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      await fetch(
        `http://localhost:8000/logistics/shipments/${confirmArriveId}/arrive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            arrivalDate: new Date().toISOString(),
            remarks: "Arrived confirmed by Admin",
          }),
        }
      );

      toast.success("Status berhasil diupdate: Arrived ✅");
      onUpdate();
      setConfirmArriveId(null); // Tutup dialog
    } catch (e) {
      toast.error("Gagal mengupdate status");
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
          {/* HISTORY LIST */}
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
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs px-2 py-0.5">
                          {ship.method}
                        </Badge>
                        <span className="font-bold text-lg tracking-tight">
                          {ship.trackingNumber || "No Resi"}
                        </span>
                        <Badge
                          variant={
                            ship.status === "ARRIVED" ? "default" : "secondary"
                          }
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
                        <span className="text-muted-foreground/30">|</span>
                        <MapPin className="h-4 w-4" />
                        <span>{ship.origin}</span>
                        <span className="text-muted-foreground/50">➝</span>
                        <span>{ship.destination}</span>
                      </div>
                    </div>

                    {ship.status === "DISPATCHED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors"
                        onClick={() => setConfirmArriveId(ship.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Arrived
                      </Button>
                    )}
                  </div>

                  {/* ITEM DETAIL */}
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
                  </div>

                  <div className="mt-3 flex items-center text-xs text-muted-foreground font-medium">
                    <span>
                      Berangkat:{" "}
                      {format(new Date(ship.departureDate), "dd MMM yyyy", {
                        locale: idLocale,
                      })}
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

      {/* === CREATE SHIPMENT DIALOG (Modal Input) === */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Pengiriman Baru ({type})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ekspedisi</Label>
                <Select onValueChange={setVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kurir" />
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
              <div className="grid gap-2">
                <Label>No. Resi</Label>
                <Input
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Contoh: JP123456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Asal (Origin)</Label>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Misal: Gudang China"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tujuan (Destination)</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Misal: Gudang Jakarta"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Metode</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAND">Darat (Land)</SelectItem>
                    <SelectItem value="SEA">Laut (Sea)</SelectItem>
                    <SelectItem value="AIR">Udara (Air)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Berangkat</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <Separator className="my-2" />

            {/* PARTIAL SHIPMENT SELECTOR */}
            <div>
              <Label className="mb-2 block">Pilih Barang yang Dikirim:</Label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Sisa (Belum Kirim)</TableHead>
                      <TableHead>Kirim Qty</TableHead>
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
                          <TableCell>
                            {p.productName || p.product?.name}
                          </TableCell>
                          <TableCell>{remaining} pcs</TableCell>
                          <TableCell>
                            {isSelected ? (
                              <Input
                                type="number"
                                className="h-8 w-20"
                                value={isSelected.qty}
                                max={remaining}
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

      {/* === MARK ARRIVED CONFIRMATION DIALOG === */}
      <AlertDialog
        open={!!confirmArriveId}
        onOpenChange={() => setConfirmArriveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Barang Sampai?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menandai status pengiriman menjadi{" "}
              <strong>ARRIVED</strong> (Sampai). Waktu kedatangan akan dicatat
              sesuai waktu saat ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmArrive}
              disabled={arriving}
              className="bg-green-600 hover:bg-green-700">
              {arriving ? "Updating..." : "Ya, Barang Sampai"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
