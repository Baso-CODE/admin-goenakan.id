"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Box,
  CalendarIcon,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { NoteItem } from "./noteItem";

// === TYPES FOR API DATA ===
export type PICData = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
};

// 2. Update ClientData Utama
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

// Tipe Data untuk Kategori Note
export type NoteCategory = {
  id: string;
  name: string;
  isPublic: boolean;
  templates: { title: string; content: string }[];
};

// === CONSTANTS ===
const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "FOLLOW_UP",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

// === SCHEMA ===
const quotationSchema = z.object({
  date: z.date(),
  validUntil: z.date().optional(),
  status: z.enum(QUOTATION_STATUSES).default("DRAFT"),

  // Logic Hybrid Client
  isManualClient: z.boolean().default(false),
  clientId: z.string().optional(),
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

  // Items
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
      }),
    )
    .min(1, "Add at least one item"),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  initialData?: any;
  onSubmit: (data: QuotationFormValues) => void;
  isLoading?: boolean;
}

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

  // === FETCH DATA ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Fetch Clients, Products, dan Note Categories sekaligus
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

        if (!resClients.ok || !resProducts.ok)
          throw new Error("Failed to load master data");

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
        console.error("Error loading data:", error);
        toast.error("Gagal memuat data Master");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const defaultValues = useMemo(() => {
    if (!initialData) {
      return {
        date: new Date(),
        status: "DRAFT",
        isManualClient: false,
        items: [
          {
            isManualProduct: false,
            productName: "",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
          },
        ],
        notes: [],
      };
    }

    // Transform Flat Notes to Grouped Notes
    const groupedNotes: Record<string, string[]> = {};
    if (initialData.notes && Array.isArray(initialData.notes)) {
      initialData.notes.forEach((n: any) => {
        if (!groupedNotes[n.categoryId]) {
          groupedNotes[n.categoryId] = [];
        }
        groupedNotes[n.categoryId].push(n.content);
      });
    }

    const formattedNotes = Object.entries(groupedNotes).map(
      ([categoryId, contents]) => ({
        categoryId,
        contents,
      }),
    );

    return {
      ...initialData,
      date: initialData.date ? new Date(initialData.date) : new Date(),
      validUntil: initialData.validUntil
        ? new Date(initialData.validUntil)
        : undefined,
      notes: formattedNotes,
    };
  }, [initialData]);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema) as Resolver<QuotationFormValues>,
    defaultValues: defaultValues,
  });

  // Re-sync jika initialData berubah (Edit Mode)
  useEffect(() => {
    if (initialData) {
      form.reset(defaultValues);
    }
  }, [initialData, defaultValues, form]);

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
    let sub = 0;
    let disc = 0;
    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemDisc = Number(item.discount) || 0;
      sub += qty * price;
      disc += itemDisc;
    });
    return { subTotal: sub, totalDiscount: disc, grandTotal: sub - disc };
  }, [items]);

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.unitPrice`, Number(product.basePrice));
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) setSelectedClient(client);
  };

  const handleToggleNote = useCallback(
    (categoryId: string, content: string) => {
      const prevNotes = form.getValues("notes") || [];
      const categoryIndex = prevNotes.findIndex(
        (n) => n.categoryId === categoryId,
      );
      let newNotes = [...prevNotes];

      if (categoryIndex === -1) {
        newNotes.push({ categoryId, contents: [content] });
      } else {
        const contents = [...newNotes[categoryIndex].contents];
        if (contents.includes(content)) {
          const filtered = contents.filter((c) => c !== content);
          if (filtered.length === 0) newNotes.splice(categoryIndex, 1);
          else
            newNotes[categoryIndex] = {
              ...newNotes[categoryIndex],
              contents: filtered,
            };
        } else {
          newNotes[categoryIndex] = {
            ...newNotes[categoryIndex],
            contents: [...contents, content],
          };
        }
      }
      form.setValue("notes", newNotes, { shouldDirty: true });
    },
    [form],
  );

  // === ISOLATED WATCHERS (PENCEGAH LOOP) ===
  const NoteBadgeWatcher = ({
    control,
    categoryId,
  }: {
    control: any;
    categoryId: string;
  }) => {
    const notes = useWatch({ control, name: "notes" }) || [];
    const count =
      notes.find((n: any) => n.categoryId === categoryId)?.contents.length || 0;
    return count > 0 ? (
      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
        {count}
      </Badge>
    ) : null;
  };

  const NoteItemWatcher = ({ control, categoryId, content, children }: any) => {
    const notes = useWatch({ control, name: "notes" }) || [];
    const isSelected =
      notes
        .find((n: any) => n.categoryId === categoryId)
        ?.contents.includes(content) || false;
    return children(isSelected);
  };

  const renderNoteSelector = (isPublic: boolean, title: string, icon: any) => {
    const filteredCategories = noteCategories.filter(
      (c) => c.isPublic === isPublic,
    );
    return (
      <Card className={!isPublic ? "bg-slate-50 border-slate-200" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-4">
            <Accordion type="multiple" className="w-full">
              {filteredCategories.map((cat) => (
                <AccordionItem
                  key={cat.id}
                  value={cat.id}
                  className="border-b-0 mb-1">
                  <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline rounded-md border border-transparent data-[state=open]:bg-white">
                    <div className="flex items-center gap-2">
                      <span>{cat.name}</span>
                      <NoteBadgeWatcher
                        control={form.control}
                        categoryId={cat.id}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 px-3 pb-2 bg-white/50">
                    <div className="grid gap-2">
                      {cat.templates?.map((tpl, tplIdx) => (
                        <NoteItemWatcher
                          key={`${cat.id}-${tplIdx}`}
                          control={form.control}
                          categoryId={cat.id}
                          content={tpl.content}>
                          {(isSelected: boolean) => (
                            <NoteItem
                              title={tpl.title}
                              content={tpl.content}
                              isSelected={isSelected}
                              onToggle={() =>
                                handleToggleNote(cat.id, tpl.content)
                              }
                            />
                          )}
                        </NoteItemWatcher>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    );
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
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* ... (HEADER & CLIENT SECTION TETAP SAMA SEPERTI SEBELUMNYA) ... */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}>
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
                            variant={"outline"}
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
                          disabled={(date) => date < new Date("1900-01-01")}
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
                            variant={"outline"}
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                Client Information
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
                        onCheckedChange={field.onChange}
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
                            defaultValue={field.value}
                            value={field.value}
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

                    {/* === TAMPILAN DETAIL CLIENT DARI DATABASE === */}
                    {selectedClient && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 animate-in fade-in slide-in-from-top-1">
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
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700",
                                )}>
                                {selectedClient.type}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{selectedClient.address}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{selectedClient.phone || "-"}</span>
                          </div>

                          {/* Tampilkan PIC jika B2B */}
                          {selectedClient.type === "B2B" &&
                            selectedClient.pics &&
                            selectedClient.pics.length > 0 && (
                              <div className="p-2 rounded bg-white border border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                  Person in Charge (PIC)
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                    {selectedClient.pics[0].name.charAt(0)}
                                  </div>
                                  <div className="text-xs">
                                    <p className="font-semibold">
                                      {selectedClient.pics[0].name}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {selectedClient.pics[0].phone ||
                                        selectedClient.pics[0].email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* INPUT MANUAL TETAP SAMA */}
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

        {/* ... (ITEMS SECTION TETAP SAMA) ... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-muted-foreground" />
              Items & Products
            </CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  isManualProduct: false,
                  productName: "",
                  quantity: 1,
                  unitPrice: 0,
                  discount: 0,
                })
              }>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {fields.map((field, index) => {
                const isManual = form.getValues(
                  `items.${index}.isManualProduct`,
                );
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-3 items-start border p-3 rounded-lg bg-slate-50/50">
                    <div className="col-span-12 md:col-span-1 flex items-center justify-center pt-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.isManualProduct`}
                        render={({ field }) => (
                          <div className="flex flex-col items-center gap-1">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="scale-75"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {field.value ? "Manual" : "DB"}
                            </span>
                          </div>
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      {isManual ? (
                        <FormField
                          control={form.control}
                          name={`items.${index}.productName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Product Name
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Item name" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Select Product
                              </FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  handleProductSelect(index, val);
                                }}
                                defaultValue={field.value}
                                value={field.value}
                                disabled={loadingData}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Qty</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Price (Rp)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Disc (Rp)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-center justify-center pt-8">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* === SUMMARY & NOTES (UPDATED WITH MULTI-SELECT) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BAGIAN NOTES BARU */}
          <div className="space-y-6">
            {/* 1. PUBLIC NOTES (Muncul di PDF) */}
            {renderNoteSelector(
              true,
              "Notes to Client (Public)",
              <FileText className="w-5 h-5 text-blue-600" />,
            )}

            {/* 2. INTERNAL NOTES (Hanya Tim) */}
            {renderNoteSelector(
              false,
              "Internal Notes (Private)",
              <Lock className="w-5 h-5 text-amber-600" />,
            )}
          </div>

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
