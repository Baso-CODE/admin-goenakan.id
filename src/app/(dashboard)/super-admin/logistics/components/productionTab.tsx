"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CheckCircle, Factory, Play, Plus } from "lucide-react";
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

type ProductionTracker = {
  id: string;
  vendorId: string;
  quantity: number;
  step: number;
  startDate: string;
  endDate: string | null;
  status: "IN_PRODUCTION" | "COMPLETED";
  vendor: { companyName: string };
  remarks?: string;
};

type OrderProduct = {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  productionTrackers: ProductionTracker[];
};

type Vendor = { id: string; companyName: string };

interface ProductionTabProps {
  orderId: string;
  products: OrderProduct[];
  vendors: Vendor[];
  onUpdate: () => void;
}

export default function ProductionTab({
  orderId,
  products,
  vendors,
  onUpdate,
}: ProductionTabProps) {
  const { fetchApi, status } = useApi();

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form States
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [qty, setQty] = useState<number>(0);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [remarks, setRemarks] = useState<string>("");
  const [activeTrackerId, setActiveTrackerId] = useState<string>("");

  const handleStartProduction = async () => {
    try {
      // 🛑 Guard: Jangan jalan jika sesi belum siap
      if (status !== "authenticated") return;

      setLoading(true);

      const payload = {
        orderId,
        orderProductId: selectedProduct,
        vendorId: selectedVendor,
        step: Number(step),
        quantity: Number(qty),
        startDate: new Date(date).toISOString(),
        remarks: remarks || `Tahap Produksi ${step}`,
      };

      // ✨ Gunakan fetchApi (Otomatis handle Base URL, Token, dan JSON Header)
      const res = await fetchApi("/logistics/production/start", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal memulai tahap produksi");
      }

      toast.success("Tahap produksi baru ditambahkan!");
      setIsStartOpen(false);

      // Reset Form
      setSelectedProduct("");
      setSelectedVendor("");
      setQty(0);
      setRemarks("");
      setStep(1);

      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error start production");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProduction = async () => {
    try {
      if (status !== "authenticated") return;

      setLoading(true);

      const payload = {
        endDate: new Date(date).toISOString(),
        remarks: "Selesai",
      };

      const res = await fetchApi(
        `/logistics/production/${activeTrackerId}/complete`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menyelesaikan tahapan");
      }

      toast.success("Tahapan produksi ditandai selesai!");
      setIsCompleteOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error complete production");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-blue-600" />
            <CardTitle>Riwayat Tahapan Produksi</CardTitle>
          </div>
          <Button
            onClick={() => {
              setSelectedProduct("");
              setQty(0);
              setRemarks("");
              setStep(1);
              setIsStartOpen(true);
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Mulai Produksi
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[30%]">Produk & Target</TableHead>
                <TableHead>Pabrik / Vendor</TableHead>
                <TableHead>Tahap & Qty</TableHead>
                <TableHead>Status & Timeline</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod) => {
                // Urutkan tracker berdasarkan tahap (step)
                const trackers = (prod.productionTrackers || []).sort(
                  (a, b) => a.step - b.step,
                );

                return (
                  <TableRow key={prod.id} className="border-b-2">
                    <TableCell
                      className="align-top border-r"
                      rowSpan={trackers.length > 0 ? trackers.length : 1}>
                      <div className="font-bold text-slate-800">
                        {prod.productName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total Order:{" "}
                        <span className="font-semibold text-blue-600">
                          {prod.quantity} pcs
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] w-full border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedProduct(prod.id);
                            setQty(prod.quantity);
                            const nextStep =
                              trackers.length > 0
                                ? Math.max(...trackers.map((t) => t.step)) + 1
                                : 1;
                            setStep(nextStep);
                            setRemarks(`Proses Lanjutan`);
                            setIsStartOpen(true);
                          }}>
                          <Plus className="mr-1.5 h-3 w-3" /> Tambah Tahap
                          Lanjut
                        </Button>
                      </div>
                    </TableCell>

                    {/* RENDER TRACKER PERTAMA */}
                    {trackers.length > 0 ? (
                      <>
                        {/* 1. Kolom Vendor (Sesuai TableHead ke-2) */}
                        <TableCell className="font-medium text-slate-700">
                          {trackers[0].vendor?.companyName || "-"}
                        </TableCell>

                        {/* 2. Kolom Tahap & Qty (Sesuai TableHead ke-3) */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shrink-0">
                                {trackers[0].step}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Tahapan Proses
                              </span>
                            </div>
                            <div className="font-bold text-base text-slate-800">
                              {trackers[0].quantity}{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                pcs
                              </span>
                            </div>
                            {trackers[0].remarks && (
                              <div className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 w-fit italic">
                                {trackers[0].remarks}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* 3. Kolom Status & Timeline (Sesuai TableHead ke-4) */}
                        <TableCell className="text-xs">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "mb-2",
                              trackers[0].status === "IN_PRODUCTION"
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200",
                            )}>
                            {trackers[0].status === "IN_PRODUCTION"
                              ? "Sedang Proses"
                              : "Selesai"}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Play className="h-3 w-3 text-orange-500" />
                            Mulai:{" "}
                            {format(
                              new Date(trackers[0].startDate),
                              "dd MMM yyyy",
                              { locale: idLocale },
                            )}
                          </div>
                        </TableCell>

                        {/* 4. Kolom Action */}
                        <TableCell className="text-right align-top">
                          {trackers[0].status === "IN_PRODUCTION" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-green-600 text-green-600 hover:bg-green-50"
                              onClick={() => {
                                setActiveTrackerId(trackers[0].id);
                                setIsCompleteOpen(true);
                              }}>
                              <CheckCircle className="mr-1 h-3 w-3" /> Selesai
                            </Button>
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground italic text-xs text-center py-6">
                        Belum ada tahapan produksi untuk item ini.
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}

              {/* RENDER TRACKER LANJUTAN */}
              {products.map((prod) => {
                const trackers = (prod.productionTrackers || []).sort(
                  (a, b) => a.step - b.step,
                );
                if (trackers.length <= 1) return null;

                return trackers.slice(1).map((track) => (
                  <TableRow
                    key={track.id}
                    className="border-b-2 bg-slate-50/30">
                    {/* Kolom Vendor dengan garis indikator */}
                    <TableCell className="font-medium text-slate-700 border-l relative">
                      <div className="absolute -left-3 top-1/2 w-3 h-px bg-slate-300"></div>
                      {track.vendor?.companyName || "-"}
                    </TableCell>

                    {/* Kolom Tahap & Qty */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-[10px] font-bold text-white shrink-0">
                            {track.step}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Tahapan Lanjutan
                          </span>
                        </div>
                        <div className="font-bold text-base text-slate-800">
                          {track.quantity}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            pcs
                          </span>
                        </div>
                        {track.remarks && (
                          <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 w-fit italic">
                            {track.remarks}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Kolom Status & Timeline */}
                    <TableCell className="text-xs">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mb-2",
                          track.status === "IN_PRODUCTION"
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200",
                        )}>
                        {track.status === "IN_PRODUCTION"
                          ? "Sedang Proses"
                          : "Selesai"}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Play className="h-3 w-3 text-orange-500" />
                        Mulai:{" "}
                        {format(new Date(track.startDate), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </div>
                    </TableCell>

                    {/* Kolom Action */}
                    <TableCell className="text-right align-top">
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
                ));
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === MODAL 1: START PRODUCTION === */}
      <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Tahap Produksi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Pilih Produk</Label>
              <Select
                value={selectedProduct}
                onValueChange={(val) => {
                  setSelectedProduct(val);
                  const prod = products.find((p) => p.id === val);
                  if (prod) setQty(prod.quantity);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.productName} (Total: {p.quantity} pcs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-blue-600">Tahap Produksi Ke-</Label>
                <Input
                  type="number"
                  value={step}
                  onChange={(e) => setStep(Number(e.target.value))}
                  min={1}
                  className="border-blue-400 bg-blue-50 font-bold"
                />
              </div>
              <div className="grid gap-2">
                <Label>Pilih Pabrik (Vendor)</Label>
                <Select
                  value={selectedVendor}
                  onValueChange={setSelectedVendor}>
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
            </div>

            <div className="grid gap-2">
              <Label>Nama / Keterangan Tahap (Opsional)</Label>
              <Input
                placeholder="Contoh: Jahit Pola, Sablon DTF, Finishing..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Jumlah yang diproses (Qty)</Label>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  min={1}
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
              disabled={
                loading || !selectedProduct || !selectedVendor || qty <= 0
              }>
              {loading ? "Menyimpan..." : "Simpan Tahapan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* (Modal Complete Sama Saja) */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Tahap Produksi</DialogTitle>
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
