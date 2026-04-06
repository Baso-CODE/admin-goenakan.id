"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Box,
  CalendarIcon,
  ChevronDown,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/helper/apiurl";
import { cn } from "@/lib/utils";
import {
  QuotationNotesSection,
  getNotesStore,
  resetNotesStore,
} from "./helper/quotationNotesSection";
import { ClientData, NoteCategory, ProductData } from "./quotationForm";

type SalesData = { id: string; name: string };

const QUOTATION_STATUSES = ["DRAFT", "SENT", "FOLLOW_UP"] as const;

const quotationSchema = z.object({
  date: z.date(),
  salesId: z.string().optional(),
  validUntil: z.date().optional(),
  status: z.enum(QUOTATION_STATUSES).default("DRAFT"),
  isManualClient: z.boolean().default(false),
  clientId: z.string().optional(),
  picId: z.string().optional(),
  manualClientName: z.string().optional(),
  manualClientCompany: z.string().optional(),
  manualClientEmail: z.string().email().optional().or(z.literal("")),
  manualClientPhone: z.string().optional(),
  manualClientAddress: z.string().optional(),
  notes: z
    .array(
      z.object({
        categoryId: z.string(),
        contents: z.array(z.string()).min(1),
      }),
    )
    .optional(),
  items: z
    .array(
      z.object({
        isManualProduct: z.boolean().default(false),
        productId: z.string().optional(),
        productName: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        quantity: z.coerce.number().min(1, "Min 1"),
        unitPrice: z.coerce.number().min(0),
        discount: z.coerce.number().min(0).default(0),
        remarks: z.string().optional(),
      }),
    )
    .min(1, "Add at least one item"),
});

export type AddQuotationFormValues = z.infer<typeof quotationSchema>;

// ============================================================
// SUB-COMPONENT: ItemRow
// ============================================================
function ItemRow({
  index,
  products,
  form,
  onRemove,
  canRemove,
  onImageChange,
  imageFile,
}: {
  index: number;
  products: ProductData[];
  form: any;
  onRemove: () => void;
  canRemove: boolean;
  onImageChange: (index: number, file: File | null) => void;
  imageFile: File | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManualProduct = form.watch(`items.${index}.isManualProduct`);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* ROW UTAMA */}
      <div className="grid grid-cols-12 gap-2 items-center p-3">
        {/* Toggle Manual/DB */}
        <div className="col-span-1 flex flex-col items-center gap-1">
          <Switch
            checked={!!isManualProduct}
            onCheckedChange={(v) =>
              form.setValue(`items.${index}.isManualProduct`, v)
            }
            className="scale-75"
          />
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            {isManualProduct ? "Man" : "DB"}
          </span>
        </div>

        {/* Nama Produk */}
        <div className="col-span-4">
          {isManualProduct ? (
            <Input
              placeholder="Nama barang/jasa..."
              {...form.register(`items.${index}.productName`)}
            />
          ) : (
            <Select
              onValueChange={(v) => {
                const p = products.find((x: any) => x.id === v);
                if (p) {
                  form.setValue(`items.${index}.productId`, p.id);
                  form.setValue(`items.${index}.productName`, p.name);
                  form.setValue(`items.${index}.unitPrice`, p.basePrice);
                  if (p.description) {
                    form.setValue(`items.${index}.description`, p.description);
                    setExpanded(true);
                  }
                }
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Produk..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Qty */}
        <div className="col-span-2">
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              className="pr-10"
              {...form.register(`items.${index}.quantity`)}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground pointer-events-none">
              Qty
            </span>
          </div>
        </div>

        {/* Harga */}
        <div className="col-span-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground pointer-events-none">
              Rp
            </span>
            <Input
              type="number"
              placeholder="0"
              className="pl-7"
              {...form.register(`items.${index}.unitPrice`)}
            />
          </div>
        </div>

        {/* Diskon */}
        <div className="col-span-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground pointer-events-none">
              Disc
            </span>
            <Input
              type="number"
              placeholder="0"
              className="pl-9"
              {...form.register(`items.${index}.discount`)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((v) => !v)}>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRemove}
            disabled={!canRemove}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* EXPANDED SECTION */}
      {expanded && (
        <div className="border-t bg-gray-50/50 px-4 pb-4 pt-3 rounded-b-lg space-y-4">
          {/* Product Specification */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Product Specification
            </label>
            <Textarea
              placeholder={
                "Contoh:\nFabric: 100D Anti color moving fabric\nPrint: Full digital print\nShaft: 14mm black fiberglass shaft\nRibs: 4.0 and 5.0mm black fiberglass ribs\nHandle: Wooden handle, auto open manual close\nTips: Black plastic tips\nTop: Black plastic frosted top"
              }
              className="text-xs min-h-25 resize-none bg-white font-mono"
              {...form.register(`items.${index}.description`)}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Remarks / Catatan Item
            </label>
            <Input
              placeholder="Contoh: Warna sesuai request client, konfirmasi ulang sebelum produksi..."
              className="text-xs bg-white"
              {...form.register(`items.${index}.remarks`)}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Referensi Gambar (Opsional)
            </label>
            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-colors bg-white cursor-pointer">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs">
                  Klik untuk upload gambar referensi
                </span>
                <span className="text-[10px] text-slate-300">
                  PNG, JPG, WEBP hingga 5MB
                </span>
              </button>
            ) : (
              <div className="relative w-fit">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="h-28 w-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    onImageChange(index, null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageChange(index, file);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: OrderSummary
// ============================================================
function OrderSummary({ form, isLoading }: { form: any; isLoading: boolean }) {
  const items = form.watch("items");
  const subTotal = items.reduce(
    (acc: number, item: any) =>
      acc + Number(item.quantity) * Number(item.unitPrice),
    0,
  );
  const discount = items.reduce(
    (acc: number, item: any) => acc + Number(item.discount),
    0,
  );
  const grandTotal = subTotal - discount;

  return (
    <Card className="bg-slate-50 border-blue-100 h-fit">
      <CardHeader>
        <CardTitle className="text-base">Ringkasan Biaya</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(subTotal)}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total Penawaran</span>
          <span className="text-blue-600">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(grandTotal)}
          </span>
        </div>
        <Button
          type="submit"
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
          ) : (
            "Simpan & Generate Penawaran"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN FORM
// ============================================================
export default function QuotationAddForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  console.log("ini adalah respon dari data product", products);

  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [itemImages, setItemImages] = useState<Record<number, File | null>>({});

  const form = useForm<AddQuotationFormValues>({
    resolver: zodResolver(quotationSchema) as Resolver<AddQuotationFormValues>,
    defaultValues: {
      date: new Date(),
      status: "DRAFT",
      salesId: "",
      picId: "",
      clientId: "",
      isManualClient: false,
      manualClientName: "",
      manualClientCompany: "",
      manualClientEmail: "",
      manualClientPhone: "",
      manualClientAddress: "",
      items: [
        {
          isManualProduct: false,
          productName: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          remarks: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const isManualClient = form.watch("isManualClient");

  useEffect(() => {
    resetNotesStore();
  }, []);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${token}` };

        const [resC, resP, resN, resS] = await Promise.all([
          fetch(`${apiUrl}/clients/order`, { headers }),
          fetch(`${apiUrl}/products/order`, { headers }),
          fetch(`${apiUrl}/quotation-notes-categories`, { headers }),
          fetch(`${apiUrl}/sales?isActive=true`, { headers }),
        ]);

        setClients(await resC.json());
        setProducts(await resP.json());
        setNoteCategories(await resN.json());
        const salesResult = await resS.json();
        setSalesList(salesResult.data || salesResult);
      } catch (e) {
        toast.error("Gagal memuat master data");
      } finally {
        setLoadingMaster(false);
      }
    };
    fetchMaster();
  }, []);

  const handleImageChange = (index: number, file: File | null) => {
    setItemImages((prev) => ({ ...prev, [index]: file }));
  };

  const handleFinalSubmit = (data: AddQuotationFormValues) => {
    const notes = getNotesStore();

    // Semua data JSON dibungkus dalam satu field "data" — pola sama seperti sales
    const jsonPayload = {
      date: data.date,
      validUntil: data.validUntil || undefined,
      status: data.status,
      salesId: data.salesId || undefined,
      clientId: data.clientId || undefined,
      picId: data.picId || undefined,
      manualClientName: data.manualClientName || undefined,
      manualClientCompany: data.manualClientCompany || undefined,
      manualClientEmail: data.manualClientEmail || undefined,
      manualClientPhone: data.manualClientPhone || undefined,
      manualClientAddress: data.manualClientAddress || undefined,
      items: data.items,
      notes: notes.length > 0 ? notes : undefined,
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(jsonPayload));

    // Append image per item dengan fieldname "items[N][image]"
    Object.entries(itemImages).forEach(([idx, file]) => {
      if (file) formData.append(`items[${idx}][image]`, file);
    });

    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFinalSubmit)}
        className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QUOTATION INFO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Detail Penawaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUOTATION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Transaksi</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start font-normal">
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pilih Tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC Sales</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={loadingMaster}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue
                            placeholder={
                              loadingMaster
                                ? "Memuat data sales..."
                                : "Pilih PIC Sales"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salesList.map((sales) => (
                          <SelectItem key={sales.id} value={sales.id}>
                            {sales.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Berlaku Hingga</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start font-normal",
                            !field.value && "text-muted-foreground",
                          )}>
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pilih Tanggal (Opsional)</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {field.value && (
                      <button
                        type="button"
                        onClick={() => field.onChange(undefined)}
                        className="text-[11px] text-red-400 hover:text-red-600 text-left">
                        Hapus tanggal
                      </button>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* CLIENT INFO */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                Informasi Client
              </CardTitle>
              <FormField
                control={form.control}
                name="isManualClient"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-sm font-normal text-muted-foreground">
                      Input Manual?
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(val) => {
                          field.onChange(val);
                          setSelectedClient(null);
                          form.setValue("clientId", "");
                          form.setValue("picId", "");
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isManualClient ? (
                  <div className="col-span-2 space-y-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pilih Client</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              const client = clients.find((c) => c.id === val);
                              if (client) {
                                setSelectedClient(client);
                                form.setValue("picId", "");
                              }
                            }}
                            value={field.value ?? ""}
                            disabled={loadingMaster}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue
                                  placeholder={
                                    loadingMaster
                                      ? "Memuat data client..."
                                      : "Cari Client di Database..."
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} ({c.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedClient && (
                      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Detail Client
                              </p>
                              <h3 className="text-lg font-bold text-blue-600">
                                {selectedClient.name}
                              </h3>
                              <div className="flex gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]">
                                  {selectedClient.custCode}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "text-[10px]",
                                    selectedClient.type === "B2B"
                                      ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                                      : "bg-green-100 text-green-700 hover:bg-green-100",
                                  )}>
                                  {selectedClient.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-600">
                              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                              <span>{selectedClient.address}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                              <span>{selectedClient.phone || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {selectedClient.type === "B2B" &&
                          selectedClient.pics &&
                          selectedClient.pics.length > 0 && (
                            <div className="border-t border-slate-200 bg-white px-4 py-3">
                              <FormField
                                control={form.control}
                                name="picId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Person in Charge (PIC)
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value ?? ""}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white mt-1.5">
                                          <SelectValue placeholder="Pilih PIC Client..." />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {selectedClient.pics.map((pic) => (
                                          <SelectItem
                                            key={pic.id}
                                            value={pic.id}>
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                                                {pic.name.charAt(0)}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                  {pic.name}
                                                </span>
                                                {(pic.position ||
                                                  pic.phone ||
                                                  pic.email) && (
                                                  <span className="text-[10px] text-muted-foreground">
                                                    {pic.position
                                                      ? pic.position
                                                      : pic.phone || pic.email}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch("picId") &&
                                (() => {
                                  const pic = selectedClient.pics.find(
                                    (p) => p.id === form.watch("picId"),
                                  );
                                  if (!pic) return null;
                                  return (
                                    <div className="mt-2 flex items-center gap-3 p-2 rounded-md bg-blue-50 border border-blue-100">
                                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                                        {pic.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                          {pic.name}
                                        </p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                          {pic.position && (
                                            <span className="text-[11px] text-slate-500">
                                              {pic.position}
                                            </span>
                                          )}
                                          {pic.phone && (
                                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                              <Phone className="w-3 h-3" />
                                              {pic.phone}
                                            </span>
                                          )}
                                          {pic.email && (
                                            <span className="text-[11px] text-slate-500 truncate">
                                              {pic.email}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="manualClientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Client / PIC *</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manualClientCompany"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Perusahaan</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: PT. Maju Jaya"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manualClientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="mail@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manualClientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="+62 812..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manualClientAddress"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Alamat Lengkap</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Jalan, No Rumah, Kelurahan, Kecamatan, Kota..."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ITEMS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-4 h-4" /> Produk & Jasa
            </CardTitle>
            {/* Legend */}
            <div className="hidden md:flex items-center gap-4 text-[11px] text-muted-foreground mr-auto ml-4">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">Qty</span> =
                Jumlah
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">Rp</span> = Harga
                Satuan
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-600">Disc</span> =
                Diskon (Rp)
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                append({
                  isManualProduct: true,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  discount: 0,
                  remarks: "",
                })
              }>
              <Plus className="w-4 h-4 mr-1" /> Tambah Baris
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {fields.map((field, index) => (
              <ItemRow
                key={field.id}
                index={index}
                products={products}
                form={form}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
                onImageChange={handleImageChange}
                imageFile={itemImages[index] ?? null}
              />
            ))}
          </CardContent>
        </Card>

        {/* FOOTER: NOTES & SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <QuotationNotesSection noteCategories={noteCategories} />
          </div>
          <OrderSummary form={form} isLoading={isLoading} />
        </div>
      </form>
    </Form>
  );
}
