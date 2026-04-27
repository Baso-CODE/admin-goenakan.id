"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarIcon,
  FileText,
  History,
  MapPin,
  MessageSquare,
  Plus,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

// --- KONFIGURASI STATUS (Sesuai DTO Backend) ---
const SHIPMENT_STATUSES = {
  INBOUND: [
    { value: "PREPARED", label: "Prepared (Disiapkan)" },
    { value: "DISPATCHED", label: "Dispatched (Berangkat/OTW)" },
    { value: "ARRIVED", label: "Arrived (Sampai Tujuan Step Ini)" },
    { value: "CANCELLED", label: "Cancelled (Dibatalkan)" },
  ],
  OUTBOUND: [
    { value: "PREPARED", label: "Prepared (Disiapkan)" },
    { value: "DISPATCHED", label: "Dispatched (Dikirim)" },
    { value: "ARRIVED", label: "Arrived (Diterima Client/Tujuan)" },
    { value: "CANCELLED", label: "Cancelled (Dibatalkan)" },
  ],
};

// --- TIPE DATA ---
type NoteCategory = {
  id: string;
  name: string;
  templates: { title: string; content: string }[];
};

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
  const { fetchApi, status } = useApi();

  // === STATE MANAGEMENT ===
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Master Data Categories
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);

  // --- STATE UPDATE STATUS (TRACKING) ---
  const [updateStatusId, setUpdateStatusId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form Update Status
  const [statusVal, setStatusVal] = useState("");
  const [statusCity, setStatusCity] = useState("");
  const [statusDate, setStatusDate] = useState<Date | undefined>(new Date());
  const [statusNote, setStatusNote] = useState("");
  const [statusTrackingNo, setStatusTrackingNo] = useState("");

  // --- STATE CREATE SHIPMENT ---
  const [vendorId, setVendorId] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [method, setMethod] = useState("LAND");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [step, setStep] = useState<number>(1);

  const [selectedItems, setSelectedItems] = useState<
    { id: string; qty: number; totalCarton: number }[]
  >([]);

  const [selectedNotes, setSelectedNotes] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    const fetchCategories = async () => {
      if (status !== "authenticated") return;

      try {
        // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
        const res = await fetchApi("/shipment-notes-categories");

        if (res.ok) {
          const data = await res.json();
          setNoteCategories(data);
        }
      } catch (error) {
        console.error("Gagal load categories", error);
      }
    };

    if (isOpen || updateStatusId) {
      fetchCategories();
    }
  }, [isOpen, updateStatusId, status, fetchApi]); // Tambahkan dependensi lengkap

  // === HELPER FUNCTIONS ===

  // 🔄 UPDATE: Menambahkan parameter currentStep
  const getRemainingQty = (
    productId: string,
    totalOrderQty: number,
    currentStep: number,
  ) => {
    let shippedInThisStep = 0;

    shipments.forEach((ship) => {
      if (ship.step === currentStep) {
        ship.items.forEach((item: any) => {
          if (item.orderProduct.productId === productId) {
            shippedInThisStep += item.quantity;
          }
        });
      }
    });
    return Math.max(0, totalOrderQty - shippedInThisStep);
  };

  const handleToggleItem = (checked: boolean, product: any) => {
    if (checked) {
      const max = getRemainingQty(product.productId, product.quantity, step);
      if (max > 0) {
        setSelectedItems((prev) => [
          ...prev,
          { id: product.id, qty: max, totalCarton: 0 },
        ]);
      } else {
        toast.error("Item ini sudah mencapai batas maksimal di step ini.");
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
      prev.map((i) => (i.id === id ? { ...i, qty: newQty } : i)),
    );
  };

  const handleCartonChange = (id: string, newCarton: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, totalCarton: newCarton } : i)),
    );
  };

  // --- LOGIC HANDLE NOTES SELECTION ---
  const handleToggleNote = (categoryId: string, content: string) => {
    setSelectedNotes((prev) => {
      const currentContents = prev[categoryId] || [];
      const exists = currentContents.includes(content);

      let newContents;
      if (exists) {
        newContents = currentContents.filter((c) => c !== content);
      } else {
        newContents = [...currentContents, content];
      }
      if (newContents.length === 0) {
        const { [categoryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [categoryId]: newContents };
    });
  };

  const getNotesPayload = () => {
    return Object.entries(selectedNotes).map(([categoryId, contents]) => ({
      categoryId,
      contents,
    }));
  };

  // === 1. CREATE SHIPMENT ===
  const handleSubmit = async () => {
    if (selectedItems.length === 0) return toast.error("Pilih minimal 1 item");
    if (!vendorId) return toast.error("Pilih Vendor");
    if (!origin || !destination) return toast.error("Isi Kota Asal & Tujuan");
    if (status !== "authenticated") return;
    try {
      setLoading(true);

      const payload = {
        orderId,
        type,
        step: Number(step),
        vendorId,
        trackingNumber: trackingNo,
        method,
        origin,
        destination,
        departureDate: date ? date.toISOString() : new Date().toISOString(),
        arrivalDate: arrivalDate ? arrivalDate.toISOString() : undefined,
        items: selectedItems.map((i) => ({
          orderProductId: i.id,
          quantity: Number(i.qty),
          totalCarton: Number(i.totalCarton),
        })),
        notes: getNotesPayload(),
      };
      const res = await fetchApi("/logistics/shipments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create shipment");
      }

      toast.success("Pengiriman berhasil dibuat!");
      setIsOpen(false);
      onUpdate();

      // Reset Form
      setSelectedItems([]);
      setVendorId("");
      setTrackingNo("");
      setOrigin("");
      setDestination("");
      setSelectedNotes({});
      setDate(new Date());
      setStep(1);
      setArrivalDate(undefined);
    } catch (e) {
      toast.error("Gagal membuat pengiriman");
    } finally {
      setLoading(false);
    }
  };

  // === 2. UPDATE STATUS TRACKING (Add History) ===
  const handleUpdateStatus = async () => {
    if (!updateStatusId) return;
    if (!statusVal) return toast.error("Pilih Status Baru");
    if (!statusCity) return toast.error("Isi Lokasi Terkini (Kota/Gudang)");

    setIsUpdating(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Payload sesuai AddShipmentHistoryDTO
      const payload = {
        status: statusVal,
        city: statusCity,
        date: statusDate ? statusDate.toISOString() : new Date().toISOString(),
        note: statusNote,
        shipmentNotes: getNotesPayload(),
        trackingNumber: statusTrackingNo || undefined,
      };

      const res = await fetch(
        `${apiUrl}/logistics/shipments/${updateStatusId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Failed");

      toast.success("Tracking berhasil diupdate!");
      onUpdate();

      // Close & Reset
      setUpdateStatusId(null);
      setStatusVal("");
      setStatusCity("");
      setStatusNote("");
      setSelectedNotes({});
      setStatusDate(new Date());
      setStatusTrackingNo("");
    } catch (e) {
      toast.error("Gagal update status");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- RENDER COMPONENT NOTES SELECTOR ---
  const renderNotesSelector = () => (
    <div className="space-y-3 border rounded-md p-3 bg-slate-50">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold text-slate-700">
          Catatan Tambahan (Ceklis Kondisi)
        </Label>
        <span className="text-[10px] text-muted-foreground">
          {Object.keys(selectedNotes).length} kategori
        </span>
      </div>
      <ScrollArea className="h-40 pr-3">
        {noteCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Tidak ada template catatan.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {noteCategories.map((cat) => (
              <AccordionItem key={cat.id} value={cat.id} className="border-b-0">
                <AccordionTrigger className="py-2 text-sm hover:no-underline hover:bg-slate-100 rounded px-2">
                  <div className="flex items-center gap-2">
                    <span>{cat.name}</span>
                    {(selectedNotes[cat.id]?.length || 0) > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {selectedNotes[cat.id].length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-2 pl-4">
                  <div className="grid gap-2">
                    {(cat.templates || []).map((tpl, idx) => {
                      const isChecked = (selectedNotes[cat.id] || []).includes(
                        tpl.content,
                      );
                      return (
                        <div
                          key={idx}
                          className="flex items-start space-x-2 border p-2 rounded bg-white">
                          <Checkbox
                            id={`${cat.id}-${idx}`}
                            checked={isChecked}
                            onCheckedChange={() =>
                              handleToggleNote(cat.id, tpl.content)
                            }
                          />
                          <div className="grid gap-1">
                            <label
                              htmlFor={`${cat.id}-${idx}`}
                              className="text-xs font-medium cursor-pointer">
                              {tpl.title}
                            </label>
                            <p className="text-[10px] text-muted-foreground">
                              {tpl.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );

  // Helper untuk mendapatkan label status
  const getStatusLabel = (val: string) => {
    const currentStatuses = SHIPMENT_STATUSES[type];

    return currentStatuses.find((s) => s.value === val)?.label || val;
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
                ? "Inbound Log (Import)"
                : "Outbound Log (Export/Local)"}
            </CardTitle>
            <CardDescription>
              {type === "INBOUND"
                ? "Monitor pergerakan barang dari Supplier ke Gudang."
                : "Monitor pengiriman barang ke Client."}
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              const maxStep =
                shipments.length > 0
                  ? Math.max(...shipments.map((s) => s.step || 1))
                  : 0;
              setStep(maxStep + 1);
              setIsOpen(true);
            }}
            className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Buat Pengiriman
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {shipments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center justify-center">
                <Truck className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p>Belum ada riwayat pengiriman {type.toLowerCase()}.</p>
              </div>
            ) : (
              shipments.map((ship) => (
                <div
                  key={ship.id}
                  className="border rounded-lg bg-card hover:shadow-md transition-shadow overflow-hidden">
                  {/* HEADER CARD */}
                  <div className="p-4 bg-muted/10 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono bg-white">
                          {ship.method}
                        </Badge>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {ship.trackingNumber || "No Resi"}
                          <Badge
                            variant="secondary"
                            className="bg-slate-200 text-slate-700 text-xs">
                            Step {ship.step || 1}
                          </Badge>
                        </h3>
                        <Badge
                          className={cn(
                            "ml-2",
                            ship.status.includes("ARRIVED_DESTINATION")
                              ? "bg-green-600"
                              : "bg-blue-600",
                          )}>
                          {getStatusLabel(ship.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" />{" "}
                          {ship.vendor?.companyName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {ship.origin}{" "}
                          <span className="mx-1">→</span> {ship.destination}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {type === "OUTBOUND" && (
                        <Link
                          href={`/super-admin/logistics/print/${ship.id}`}
                          target="_blank">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 gap-2">
                            <FileText className="h-3.5 w-3.5" /> Doc
                          </Button>
                        </Link>
                      )}

                      {!["ARRIVED", "CANCELLED"].includes(ship.status) && (
                        <Button
                          size="sm"
                          className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            setUpdateStatusId(ship.id);
                            setStatusVal("");
                            setStatusCity("");
                            setSelectedNotes({});
                            setStatusTrackingNo("");
                          }}>
                          <History className="h-3.5 w-3.5" /> Update Tracking
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 grid md:grid-cols-3 gap-6">
                    {/* COLUMN LEFT: Items & NOTES */}
                    <div className="md:col-span-1 border-r pr-4">
                      {/* 1. LIST BARANG */}
                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-3">
                        Items:
                      </p>
                      <ul className="space-y-2 mb-6">
                        {ship.items.map((item: any) => (
                          <li
                            key={item.id}
                            className="text-sm flex flex-col bg-slate-50 p-2 rounded">
                            <div className="flex justify-between items-center w-full">
                              <span className="line-clamp-1 text-slate-700">
                                {item.orderProduct.product.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] ml-2 shrink-0">
                                {item.quantity} pcs
                              </Badge>
                            </div>
                            {item.totalCarton > 0 && (
                              <div className="text-[10px] text-muted-foreground mt-1 text-right">
                                {item.totalCarton} Karton
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* 2. FIX: MENAMPILKAN NOTES DISINI */}
                      {ship.notes && ship.notes.length > 0 && (
                        <div className="pt-4 border-t border-dashed">
                          <p className="font-semibold text-xs uppercase text-muted-foreground mb-3 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Catatan /
                            Kondisi:
                          </p>

                          <div className="space-y-3">
                            {Array.from(
                              new Set(
                                ship.notes.map((n: any) => n.category?.name),
                              ),
                            )
                              .filter(Boolean)
                              .map((catName: any) => (
                                <div
                                  key={catName}
                                  className="bg-yellow-50/50 p-2 rounded border border-yellow-100">
                                  <span className="text-[10px] font-bold text-yellow-700 uppercase block mb-1">
                                    {catName}
                                  </span>
                                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                                    {ship.notes
                                      .filter(
                                        (n: any) =>
                                          n.category?.name === catName,
                                      )
                                      .map((n: any, i: number) => (
                                        <li key={i}>{n.content}</li>
                                      ))}
                                  </ul>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COLUMN RIGHT: TIMELINE HISTORY */}
                    <div className="md:col-span-2">
                      <p className="font-semibold text-xs uppercase text-muted-foreground mb-3">
                        Tracking History:
                      </p>

                      <div className="relative pl-2 ml-1 border-l-2 border-slate-200 space-y-6">
                        {ship.history && ship.history.length > 0 ? (
                          ship.history.map((hist: any, idx: number) => (
                            <div key={hist.id} className="relative pl-6">
                              {/* DOT */}
                              <div
                                className={cn(
                                  "absolute -left-2.25 top-1.5 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                                  idx === 0
                                    ? "bg-green-500 ring-2 ring-green-100"
                                    : "bg-slate-300",
                                )}></div>

                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                  <p
                                    className={cn(
                                      "text-sm font-semibold",
                                      idx === 0
                                        ? "text-slate-900"
                                        : "text-slate-500",
                                    )}>
                                    {getStatusLabel(hist.status)}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium text-slate-700">
                                      {hist.city}
                                    </span>
                                  </div>

                                  {hist.note && (
                                    <p className="text-xs italic text-slate-500 mt-1 bg-slate-50 p-1 rounded inline-block">
                                      "{hist.note}"
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 font-mono mt-1 sm:mt-0">
                                  {format(new Date(hist.date), "dd MMM HH:mm", {
                                    locale: idLocale,
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground pl-4">
                            History loading...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* === DIALOG CREATE SHIPMENT === */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Pengiriman Baru ({type})</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <div className="space-y-2">
                <Label className="text-blue-800 font-bold">
                  Langkah Pengiriman (Step)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                    className="pl-14 bg-white border-blue-200 focus-visible:ring-blue-500 font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">
                    Step
                  </span>
                </div>
                <p className="text-[10px] text-blue-600">
                  1 (Awal), 2 (Transit), dst.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Ekspedisi / Vendor</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Pilih Kurir/Vendor..." />
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
            </div>

            {/* ROUTE & RESI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kota Asal (Origin)</Label>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Contoh: Shenzhen"
                />
              </div>
              <div className="space-y-2">
                <Label>Kota Tujuan (Dest)</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Contoh: Jakarta"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  No. Resi{" "}
                  <span className="text-muted-foreground text-xs">
                    (Opsional)
                  </span>
                </Label>
                <Input
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Misal: JNT12345"
                />
              </div>
            </div>

            {/* METHOD & DATE */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Tanggal Berangkat</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "dd MMM yyyy", { locale: idLocale })
                      ) : (
                        <span>Pilih</span>
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
              <div className="space-y-2">
                <Label>Perkiraan Tiba</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {arrivalDate ? (
                        format(arrivalDate, "dd MMM yyyy", { locale: idLocale })
                      ) : (
                        <span className="text-muted-foreground">Opsional</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={arrivalDate}
                      onSelect={setArrivalDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />
            {renderNotesSelector()}
            <Separator />

            {/* 4. Items Table */}
            <div>
              <Label className="mb-2 block font-semibold  items-center gap-2">
                Pilih Barang yang Dikirim
                <span className="text-xs font-normal text-muted-foreground">
                  (Validasi kuantitas Step dilakukan otomatis oleh sistem)
                </span>
              </Label>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Maks Qty / Order</TableHead>
                      <TableHead>Qty Dikirim</TableHead>
                      <TableHead>Karton</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => {
                      const remaining = getRemainingQty(
                        p.productId,
                        p.quantity,
                        step,
                      );
                      const isSelected = selectedItems.find(
                        (i) => i.id === p.id,
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
                          <TableCell className="font-medium text-xs">
                            {p.productName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{remaining}</Badge>
                          </TableCell>
                          <TableCell>
                            {isSelected ? (
                              <Input
                                type="number"
                                className="h-7 w-20 text-xs"
                                value={isSelected.qty}
                                max={remaining}
                                min={1}
                                onChange={(e) =>
                                  handleQtyChange(
                                    p.id,
                                    Number(e.target.value),
                                    remaining,
                                  )
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {isSelected ? (
                              <Input
                                type="number"
                                className="h-7 w-20 text-xs"
                                value={isSelected.totalCarton}
                                min={0}
                                placeholder="0"
                                onChange={(e) =>
                                  handleCartonChange(
                                    p.id,
                                    Number(e.target.value),
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
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Memproses..." : "Buat Pengiriman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === DIALOG UPDATE STATUS (TRACKING) === */}
      <Dialog
        open={!!updateStatusId}
        onOpenChange={(open) => {
          if (!open) setUpdateStatusId(null);
        }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Tracking Status</DialogTitle>
            <CardDescription>Perbarui posisi terkini paket.</CardDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 1. Status Selection */}
            <div className="space-y-2">
              <Label>Status Baru</Label>
              <Select value={statusVal} onValueChange={setStatusVal}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahapan..." />
                </SelectTrigger>
                <SelectContent>
                  {(type === "INBOUND"
                    ? SHIPMENT_STATUSES.INBOUND
                    : SHIPMENT_STATUSES.OUTBOUND
                  ).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Date & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Kejadian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {statusDate ? (
                        format(statusDate, "dd/MM/yyyy")
                      ) : (
                        <span>Pilih</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={statusDate}
                      onSelect={setStatusDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Lokasi (Kota/Gudang)</Label>
                <Input
                  placeholder="Contoh: Shenzhen, Tj. Priok"
                  value={statusCity}
                  onChange={(e) => setStatusCity(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                No. Resi
                <span className="text-muted-foreground text-xs">
                  (Opsional - isi jika baru tersedia)
                </span>
              </Label>
              <Input
                placeholder="Contoh: JNE123456789"
                value={statusTrackingNo}
                onChange={(e) => setStatusTrackingNo(e.target.value)}
              />
            </div>

            {/* 3. Manual Note */}
            <div className="space-y-2">
              <Label>Catatan Singkat (Opsional)</Label>
              <Input
                placeholder="Contoh: Barang tertahan pemeriksaan fisik"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            {/* 4. Template Notes */}
            <Separator />
            {renderNotesSelector()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusId(null)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700">
              {isUpdating ? "Menyimpan..." : "Simpan Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
