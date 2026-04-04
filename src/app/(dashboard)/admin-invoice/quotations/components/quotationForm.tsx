"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Box,
  CalendarIcon,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  UserCheck, // 🔥
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

export type PICData = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
};
export type ClientData = {
  id: string;
  name: string;
  type: "B2B" | "B2C" | string;
  custCode: string;
  phone: string;
  address: string;
  originalAddress?: string;
  purchaseChannelId: string;
  pics: PICData[];
};
export type ProductData = {
  id: string;
  name: string;
  basePrice: number;
  isCustom: boolean;
  description?: string;
  productVariants: { id: string; variantName: string; price: number }[];
  priceTiers: { minQuantity: number; price: number }[];
};
export type NoteCategory = {
  id: string;
  name: string;
  isPublic: boolean;
  templates: { title: string; content: string }[];
};

// ============================================================
// MODULE-LEVEL NOTES STORE
// ============================================================
let _editNotesStore: { categoryId: string; contents: string[] }[] = [];
export function getEditNotesStore() {
  return _editNotesStore;
}
export function resetEditNotesStore(
  initial: { categoryId: string; contents: string[] }[] = [],
) {
  _editNotesStore = [...initial];
}

// ============================================================
// NOTES SECTION COMPONENT
// ============================================================
function NotesSection({
  noteCategories,
  initialNotes,
}: {
  noteCategories: NoteCategory[];
  initialNotes: { categoryId: string; contents: string[] }[];
}) {
  const [selectedNotes, setSelectedNotes] =
    useState<{ categoryId: string; contents: string[] }[]>(initialNotes);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  function toggleCat(catId: string) {
    setOpenCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }

  function handleToggle(categoryId: string, content: string) {
    const next = selectedNotes.map((n) => ({
      ...n,
      contents: [...n.contents],
    }));
    const idx = next.findIndex((n) => n.categoryId === categoryId);
    let result: { categoryId: string; contents: string[] }[];
    if (idx === -1) {
      result = [...next, { categoryId, contents: [content] }];
    } else {
      const cat = next[idx];
      const ci = cat.contents.indexOf(content);
      if (ci === -1) cat.contents.push(content);
      else cat.contents.splice(ci, 1);
      result =
        cat.contents.length === 0 ? next.filter((_, i) => i !== idx) : next;
    }
    _editNotesStore = result;
    setSelectedNotes(result);
  }

  function isChecked(catId: string, content: string) {
    return (
      selectedNotes
        .find((n) => n.categoryId === catId)
        ?.contents.includes(content) || false
    );
  }
  function getCount(catId: string) {
    return (
      selectedNotes.find((n) => n.categoryId === catId)?.contents.length || 0
    );
  }

  function renderGroup(
    isPublic: boolean,
    title: string,
    icon: React.ReactNode,
  ) {
    const filtered = noteCategories.filter((c) => c.isPublic === isPublic);
    if (filtered.length === 0) return null;
    return (
      <Card className={!isPublic ? "bg-slate-50 border-slate-200" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-1">
              {filtered.map((cat) => {
                const isOpen = !!openCats[cat.id];
                const count = getCount(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="border rounded-md overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
                      onClick={() => toggleCat(cat.id)}>
                      <div className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5">
                            {count}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t bg-white px-2 py-2 space-y-1">
                        {cat.templates.map((tpl, i) => {
                          const checked = isChecked(cat.id, tpl.content);
                          return (
                            <div
                              key={`${cat.id}-${i}`}
                              className="flex items-start space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
                              onClick={() => handleToggle(cat.id, tpl.content)}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                              />
                              <div className="grid gap-0.5 leading-none pointer-events-none">
                                <span className="text-sm font-medium">
                                  {tpl.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {tpl.content}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup(
        true,
        "Notes to Client (Public)",
        <FileText className="w-5 h-5 text-blue-600" />,
      )}
      {renderGroup(
        false,
        "Internal Notes (Private)",
        <Lock className="w-5 h-5 text-amber-600" />,
      )}
    </div>
  );
}

// ============================================================
// 🔥 ITEM ROW — tambah label Qty/Rp/Disc + Remarks
// ============================================================
function ItemRow({
  index,
  products,
  form,
  onRemove,
  canRemove,
}: {
  index: number;
  products: ProductData[];
  form: any;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isManualProduct = form.watch(`items.${index}.isManualProduct`);

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="grid grid-cols-12 gap-2 items-center p-3">
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

        {/* 🔥 Qty dengan label */}
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

        {/* 🔥 Harga dengan label */}
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

        {/* 🔥 Diskon dengan label */}
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

      {expanded && (
        <div className="border-t bg-gray-50/50 px-4 pb-4 pt-3 rounded-b-lg space-y-4">
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

          {/* 🔥 Remarks */}
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
        </div>
      )}
    </div>
  );
}

// === CONSTANTS & SCHEMA ===
const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "FOLLOW_UP",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

const quotationSchema = z.object({
  date: z.date(),
  validUntil: z.date().optional(),
  status: z.enum(QUOTATION_STATUSES).default("DRAFT"),
  isManualClient: z.boolean().default(false),
  clientId: z.string().optional(),
  // 🔥 Tambah picId
  picId: z.string().optional(),
  manualClientName: z.string().optional(),
  manualClientCompany: z.string().optional(),
  manualClientEmail: z.string().email().optional().or(z.literal("")),
  manualClientPhone: z.string().optional(),
  manualClientAddress: z.string().optional(),
  items: z
    .array(
      z.object({
        isManualProduct: z.boolean().default(false),
        productId: z.string().optional(),
        productName: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        quantity: z.coerce.number().min(1, "Qty min 1"),
        unitPrice: z.coerce.number().min(0, "Price min 0"),
        discount: z.coerce.number().min(0).default(0),
        // 🔥 Tambah remarks
        remarks: z.string().optional(),
      }),
    )
    .min(1, "Add at least one item"),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  initialData?: any;
  onSubmit: (data: QuotationFormValues & { notes: any[] }) => void;
  isLoading?: boolean;
}

// ============================================================
// MAIN FORM
// ============================================================
export default function QuotationForm({
  initialData,
  onSubmit,
  isLoading,
}: QuotationFormProps) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const initialNotes = useMemo<
    { categoryId: string; contents: string[] }[]
  >(() => {
    if (!initialData?.notes || !Array.isArray(initialData.notes)) return [];
    const grouped: Record<string, string[]> = {};
    initialData.notes.forEach((n: any) => {
      if (n.content) {
        if (!grouped[n.categoryId]) grouped[n.categoryId] = [];
        grouped[n.categoryId].push(n.content);
      } else if (n.contents) {
        grouped[n.categoryId] = n.contents;
      }
    });
    const result = Object.entries(grouped).map(([categoryId, contents]) => ({
      categoryId,
      contents,
    }));
    resetEditNotesStore(result);
    return result;
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const [resClients, resProducts, resNotes] = await Promise.all([
          fetch(`${apiUrl}/clients/order`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/products/order`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/quotation-notes-categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const clientData = await resClients.json();
        const productData = await resProducts.json();
        const notesData = await resNotes.json();
        setClients(
          Array.isArray(clientData) ? clientData : clientData.data || [],
        );
        setProducts(
          Array.isArray(productData) ? productData : productData.data || [],
        );
        setNoteCategories(Array.isArray(notesData) ? notesData : []);
      } catch (error) {
        toast.error("Gagal memuat data Master");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const defaultValues = useMemo(() => {
    if (!initialData)
      return {
        date: new Date(),
        status: "DRAFT" as const,
        isManualClient: false,
        // 🔥 Tambah picId default
        picId: "",
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
      };
    return {
      ...initialData,
      date: initialData.date ? new Date(initialData.date) : new Date(),
      validUntil: initialData.validUntil
        ? new Date(initialData.validUntil)
        : undefined,
      // 🔥 Pastikan picId ter-populate dari initialData
      picId: initialData.picId || "",
    };
  }, [initialData]);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema) as Resolver<QuotationFormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      form.reset(defaultValues);
      // 🔥 Set selectedClient dari initialData saat edit
      if (initialData.clientId && clients.length > 0) {
        const client = clients.find((c) => c.id === initialData.clientId);
        if (client) setSelectedClient(client);
      }
    }
  }, [initialData, defaultValues, form, clients]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = useWatch({ control: form.control, name: "items" });
  const isManualClient = useWatch({
    control: form.control,
    name: "isManualClient",
  });

  const { subTotal, totalDiscount, grandTotal } = useMemo(() => {
    let sub = 0,
      disc = 0;
    items.forEach((item) => {
      sub += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      disc += Number(item.discount) || 0;
    });
    return { subTotal: sub, totalDiscount: disc, grandTotal: sub - disc };
  }, [items]);

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      // 🔥 Reset picId saat ganti client
      form.setValue("picId", "");
    }
  };

  const handleSubmit = (data: QuotationFormValues) => {
    if (!data.isManualClient && !data.clientId) {
      form.setError("clientId", { message: "Please select a client" });
      return;
    }
    if (data.isManualClient && !data.manualClientName) {
      form.setError("manualClientName", { message: "Client Name is required" });
      return;
    }
    onSubmit({ ...data, notes: getEditNotesStore() });
  };

  const notesSectionKey = initialData?.id ?? "new";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* QUOTATION DETAILS & CLIENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />{" "}
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUOTATION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <span
                              className={cn(
                                "font-medium",
                                status === "DRAFT" && "text-slate-500",
                                status === "SENT" && "text-blue-600",
                                status === "ACCEPTED" && "text-green-600",
                                status === "REJECTED" && "text-red-600",
                              )}>
                              {status.replace("_", " ")}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Quotation Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date (Optional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {/* 🔥 Tombol hapus tanggal */}
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

          {/* 🔥 CLIENT CARD — lengkap dengan PIC selector */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" /> Client
                Information
              </CardTitle>
              <FormField
                control={form.control}
                name="isManualClient"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-sm font-normal text-muted-foreground">
                      Manual Input?
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(val) => {
                          field.onChange(val);
                          // 🔥 Reset client & pic saat toggle
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
                          <FormLabel>Select Client</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              handleClientSelect(val);
                            }}
                            value={field.value ?? ""}
                            disabled={loadingData}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue
                                  placeholder={
                                    loadingData
                                      ? "Loading clients..."
                                      : "Select a client..."
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
                                Client Detail
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

                        {/* 🔥 PIC Selector — hanya untuk B2B dengan pics */}
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

                              {/* 🔥 Preview PIC yang dipilih */}
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
                          <FormLabel>Client Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="PT. ..." {...field} />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+62..." {...field} />
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
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Full address..."
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

        {/* 🔥 ITEMS — tambah legend Qty/Rp/Disc di header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-4 h-4" /> Items & Products
            </CardTitle>
            {/* 🔥 Legend */}
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
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  isManualProduct: true,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  discount: 0,
                  // 🔥 Tambah remarks default
                  remarks: "",
                })
              }>
              <Plus className="h-4 w-4 mr-2" /> Add Item
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
              />
            ))}
          </CardContent>
        </Card>

        {/* NOTES & SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NotesSection
            key={notesSectionKey}
            noteCategories={noteCategories}
            initialNotes={initialNotes}
          />

          <Card className="bg-slate-50 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(subTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Total Discount</span>
                <span>
                  -{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(totalDiscount)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(grandTotal)}
                </span>
              </div>
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Quotation"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
