"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AlertCircle, CheckCircle, Factory, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiUrl } from "@/helper/apiurl";

// --- TYPES (Sesuaikan dengan response API Order Detail Anda) ---
type ProductionTracker = {
  id: string;
  vendorId: string;
  quantity: number;
  startDate: string;
  endDate: string | null;
  status: "IN_PRODUCTION" | "COMPLETED";
  vendor: { companyName: string };
};

type OrderProduct = {
  id: string; // OrderProduct ID (Penting untuk Production Service)
  productName: string;
  sku: string;
  quantity: number; // Total Qty Order
  productionTrackers: ProductionTracker[]; // History produksi item ini
};

type Vendor = { id: string; companyName: string }; // Untuk dropdown pabrik

interface ProductionTabProps {
  orderId: string;
  products: OrderProduct[];
  vendors: Vendor[]; // List vendor tipe 'PRODUCT' (Pabrik)
  onUpdate: () => void; // Fungsi refresh data setelah update
}

export default function ProductionTab({
  orderId,
  products,
  vendors,
  onUpdate,
}: ProductionTabProps) {
  // Modal States

  console.log(products, "ini adlaah data productg");

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form States
  const [selectedProduct, setSelectedProduct] = useState<string>(""); // OrderProductID
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [activeTrackerId, setActiveTrackerId] = useState<string>(""); // Untuk Complete

  // --- HANDLER: START PRODUCTION ---
  const handleStartProduction = async () => {
    try {
      setLoading(true);
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Payload sesuai DTO ProductionService.startProduction
      const payload = {
        orderId,
        orderProductId: selectedProduct, // ID Pivot OrderProduct
        vendorId: selectedVendor,
        quantity: Number(qty),
        startDate: new Date(date).toISOString(),
        remarks: "Started via Admin Dashboard",
      };

      const res = await fetch(`${apiUrl}/logistics/production/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal memulai produksi");

      toast.success("Produksi dimulai!");
      setIsStartOpen(false);
      onUpdate(); // Refresh halaman
    } catch (error) {
      toast.error("Error start production");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: COMPLETE PRODUCTION ---
  const handleCompleteProduction = async () => {
    try {
      setLoading(true);

      if (!activeTrackerId) {
        toast.error("ID Produksi tidak ditemukan.");
        return;
      }
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Payload sesuai DTO ProductionService.completeProduction
      const payload = {
        endDate: new Date(date).toISOString(),
        remarks: "Completed via Admin Dashboard",
      };

      const res = await fetch(
        `${apiUrl}/logistics/production/${activeTrackerId}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Gagal menyelesaikan produksi");

      toast.success("Produksi selesai!");
      setIsCompleteOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Error complete production");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-orange-600" />
            <CardTitle>Production Tracking</CardTitle>
          </div>
          <Button
            onClick={() => setIsStartOpen(true)}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700">
            <Play className="mr-2 h-4 w-4" /> Mulai Produksi Baru
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Status Produksi</TableHead>
                <TableHead>Pabrik (Vendor)</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod) =>
                prod.productionTrackers &&
                prod.productionTrackers.length > 0 ? (
                  // Jika ada history produksi, render baris per history
                  prod.productionTrackers.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-medium">
                        {prod.productName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            track.status === "COMPLETED"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            track.status === "IN_PRODUCTION"
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }>
                          {track.status === "IN_PRODUCTION"
                            ? "Sedang Produksi"
                            : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell>{track.vendor?.companyName || "-"}</TableCell>
                      <TableCell>{track.quantity} pcs</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3 text-green-600" />
                          {format(new Date(track.startDate), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                        {track.endDate && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="h-3 w-3 text-blue-600" />
                            {format(new Date(track.endDate), "dd MMM yyyy", {
                              locale: idLocale,
                            })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {track.status === "IN_PRODUCTION" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => {
                              setActiveTrackerId(track.id);
                              setIsCompleteOpen(true);
                            }}>
                            <CheckCircle className="mr-1 h-3 w-3" /> Selesai
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Jika belum ada produksi sama sekali untuk item ini
                  <TableRow key={prod.id}>
                    <TableCell className="font-medium">
                      {prod.productName}
                    </TableCell>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground italic text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Belum ada data
                        produksi.
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-orange-600"
                        onClick={() => {
                          setSelectedProduct(prod.id);
                          setQty(prod.quantity); // Default max qty
                          setIsStartOpen(true);
                        }}>
                        + Mulai
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === MODAL 1: START PRODUCTION === */}
      <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Produksi (Start)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Pilih Produk</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.productName} (Total: {p.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Pilih Pabrik (Vendor)</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pabrik" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Jumlah (Qty)</Label>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleStartProduction}
              disabled={loading || !selectedProduct || !selectedVendor}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === MODAL 2: COMPLETE PRODUCTION === */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Produksi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCompleteProduction}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700">
              {loading ? "Menyimpan..." : "Tandai Selesai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
