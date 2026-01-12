"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  Store,
  Truck,
  User,
  UserCircle,
  Wallet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Pastikan install: npx shadcn-ui@latest add dialog
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

// Service
import { Checkbox } from "@/components/ui/checkbox";
import { fetchWithToken } from "../../order-service"; // Sesuaikan path

// --- Types ---
// Update Type OrderDetail agar include Invoices
interface OrderDetail {
  id: string;
  poNumber: string;
  dateOrder: string;
  salesCategory: "SALES" | "SAMPLE";
  shippingAddress: string;
  totalAmount: number;
  createdAt: string;
  purchaseChannelName: string;
  clientInfo: {
    name: string;
    phone: string;
    email: string;
    type: string;
    picName: string;
    picPhone: string;
  };
  sales: {
    name: string;
    phone: string;
  };
  products: {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customization: string;
    remarks: string;
    billedQuantity?: number;
    remainingQuantity?: number;
  }[];
  vendors: {
    id: string;
    companyName: string;
    picName: string;
    picPhone: string;
    role: string;
  }[];
  invoices: {
    id: number;
    invoiceNumber: string | null;
    createdAt: string;
    dueDate: string | null;
    totalAmount: number;
    status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";
    category: "DP" | "FULL_PAYMENT" | "INSTALLMENT" | "REMAINING_BALANCE";
  }[];
}
// --- Helper: Format Currency ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  console.log("Order Detail", order);

  const [loading, setLoading] = useState(true);

  // === INVOICE DIALOG STATES ===
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceCategory, setInvoiceCategory] = useState<string>("");
  const [dpType, setDpType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [invoiceDPPercent, setInvoiceDPPercent] = useState<number>(0);
  const [invoiceDPAmount, setInvoiceDPAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // === SPLIT INVOICE STATES (NEW) ===
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; quantity: number; maxQty: number; price: number }[]
  >([]);

  // === NOTES STATES ===
  const [noteCategories, setNoteCategories] = useState<any[]>([]);
  console.log("note categories", noteCategories);

  const [selectedNoteTemplate, setSelectedNoteTemplate] = useState<string>("");
  const [invoiceNotes, setInvoiceNotes] = useState<
    { categoryId: string; content: string }[]
  >([]);

  // === FETCH ORDER ===
  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Pastikan endpoint backend meng-include 'invoices'
      const data = await fetchWithToken(`http://localhost:8000/orders/${id}`);
      setOrder(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat detail order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  // === FETCH NOTES MASTER DATA ===
  useEffect(() => {
    const fetchNoteCategories = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(
          "http://localhost:8000/invoice-notes/categories/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setNoteCategories(data || []);
      } catch (e) {
        console.error("Failed to load note categories");
      }
    };
    fetchNoteCategories();
  }, []);

  // === FINANCIAL CALCULATIONS ===
  // Hitung data keuangan untuk Summary Card
  const totalOrderAmount = order ? Number(order.totalAmount) : 0;

  // Total yang sudah ditagihkan (Semua invoice kecuali Cancelled)
  const totalInvoiced =
    order?.invoices
      .filter((inv) => inv.status !== "CANCELLED")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0;

  // Total yang sudah DIBAYAR (Status PAID)
  const totalPaid =
    order?.invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0;

  // Sisa Tagihan (Berapa lagi yang belum dibuatkan invoice)
  // Logic: Total Order - Total Invoice yang aktif
  const remainingToInvoice = totalOrderAmount - totalInvoiced;

  // Persentase Pembayaran (Paid / Total Order)
  const paymentProgress =
    totalOrderAmount > 0 ? Math.round((totalPaid / totalOrderAmount) * 100) : 0;

  const isFirstInvoice = order ? order.invoices.length === 0 : true;

  // === HANDLER SPLIT ITEM SELECTION ===
  // const toggleItemSelection = (
  //   checked: boolean,
  //   product: OrderDetail["products"][0]
  // ) => {
  //   if (checked) {
  //     // Add item with default max quantity
  //     setSelectedItems((prev) => [
  //       ...prev,
  //       {
  //         // Disini kita perlu ID Product Asli (Master) bukan ID OrderProduct
  //         // Pastikan backend kirim 'productId' di object products
  //         productId: product.productId || product.id, // Fallback logic
  //         quantity: product.quantity,
  //         maxQty: product.quantity,
  //         price: product.unitPrice,
  //       },
  //     ]);
  //   } else {
  //     // Remove item
  //     setSelectedItems((prev) =>
  //       prev.filter(
  //         (item) => item.productId !== (product.productId || product.id)
  //       )
  //     );
  //   }
  // };

  const updateItemQty = (productId: string, newQty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Hitung total dari item yang dipilih (untuk Split Mode)
  const splitTotalAmount = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleCreateInvoice = async () => {
    if (!order) return;
    setIsCreatingInvoice(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      let finalDpPercentage: number | undefined = undefined;
      let finalCustomAmount: number | undefined = undefined;
      let payloadSelectedItems: any[] | undefined = undefined;

      // Logic Split Invoice
      if (isSplitMode) {
        if (selectedItems.length === 0) {
          throw new Error("Pilih minimal 1 produk untuk Split Invoice.");
        }
        // Kirim array item yang dipilih
        payloadSelectedItems = selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
        // Category biasanya Full Payment per item (atau custom)
        // Disini kita set FULL_PAYMENT context item tersebut, atau INSTALLMENT jika parsial?
        // Sederhananya, jika split, backend akan hitung harga item * qty.
      } else {
        // Logic Standard (DP / Full Global)
        if (invoiceCategory === "DP") {
          if (dpType === "PERCENTAGE") {
            finalDpPercentage = invoiceDPPercent;
          } else {
            if (totalOrderAmount > 0) {
              finalDpPercentage = (invoiceDPAmount / totalOrderAmount) * 100;
            }
          }
        } else if (invoiceCategory === "INSTALLMENT") {
          finalCustomAmount = customAmount;
        }
      }

      const payload = {
        orderId: order.id,
        category: isSplitMode ? "FULL_PAYMENT" : invoiceCategory,
        dpPercentage: finalDpPercentage,
        customAmount: finalCustomAmount,
        selectedItems: payloadSelectedItems,
        notes: invoiceNotes.filter((n) => n.content.trim() !== ""),
      };

      const res = await fetch("http://localhost:8000/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membuat invoice");
      }

      toast.success("Invoice berhasil dibuat!");
      setInvoiceDialogOpen(false);

      // Reset
      setInvoiceCategory("");
      setIsSplitMode(false);
      setSelectedItems([]);
      loadOrder();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleNoteChange = (categoryId: string, content: string) => {
    setInvoiceNotes((prev) => {
      const existing = prev.find((n) => n.categoryId === categoryId);
      if (existing) {
        // Jika konten kosong, hapus dari state (opsional, tergantung UX)
        if (!content.trim())
          return prev.filter((n) => n.categoryId !== categoryId);
        // Update konten
        return prev.map((n) =>
          n.categoryId === categoryId ? { ...n, content } : n
        );
      }
      // Tambah baru
      return [...prev, { categoryId, content }];
    });
  };
  if (loading) return <DetailPageSkeleton />;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-semibold text-gray-600">
          Order tidak ditemukan
        </h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto pb-20">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Order #{order.poNumber}
              </h1>
              <Badge
                variant={
                  order.salesCategory === "SAMPLE" ? "secondary" : "default"
                }>
                {order.salesCategory}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(order.dateOrder), "dd MMMM yyyy", {
                locale: idLocale,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button
            onClick={() => router.push(`/super-admin/orders/edit/${order.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Order
          </Button>
        </div>
      </div>

      <Separator />

      {/* --- [NEW] FINANCIAL SUMMARY CARD --- */}
      <Card className="bg-lineart-to-br from-white to-gray-50 border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Wallet className="h-5 w-5 text-blue-600" />
              Financial Summary
            </CardTitle>
            {/* Tombol Generate Invoice: Muncul jika masih ada sisa tagihan */}
            {remainingToInvoice > 0 && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setInvoiceCategory("");
                  setIsSplitMode(false); // Reset mode
                  setSelectedItems([]);
                  setInvoiceDialogOpen(true);
                }}>
                <FileText className="mr-2 h-4 w-4" /> Generate Invoice
              </Button>
            )}
            {remainingToInvoice <= 0 && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
                <CheckCircle className="mr-1 h-3 w-3" /> Fully Invoiced
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Order
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalOrderAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Ditagihkan
              </p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(totalInvoiced)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Sudah Dibayar
              </p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Sisa Tagihan
              </p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(remainingToInvoice)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Payment Progress</span>
              <span>{paymentProgress}% Paid</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* --- [NEW] INVOICE HISTORY TABLE --- */}
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-gray-500" />
                Invoice History
              </CardTitle>
              <CardDescription>
                Riwayat tagihan yang telah dibuat untuk order ini
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.invoices && order.invoices.length > 0 ? (
                    order.invoices.map((inv, idx) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-xs">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {inv.category.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(inv.createdAt), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(inv.totalAmount))}
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Render Badge Status */}
                          <Badge
                            className="text-[10px]"
                            variant={
                              inv.status === "PAID"
                                ? "default"
                                : inv.status === "UNPAID"
                                ? "secondary"
                                : "destructive"
                            }>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin-invoice/invoices/${inv.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs">
                              Detail
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground text-sm">
                        Belum ada invoice yang dibuat.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Product List Card */}
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardHeader className="bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-gray-500" />
                Items Ordered
              </CardTitle>
              <CardDescription>
                Daftar produk dan detail customization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Product Details</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.products.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900">
                            {item.productName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            SKU: {item.sku}{" "}
                            {item.variantName !== "-" &&
                              `• ${item.variantName}`}
                          </span>
                          {(item.customization !== "-" ||
                            item.remarks !== "-") && (
                            <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 border space-y-1">
                              {item.customization !== "-" && (
                                <p>
                                  <span className="font-semibold">Custom:</span>{" "}
                                  {item.customization}
                                </p>
                              )}
                              {item.remarks !== "-" && (
                                <p>
                                  <span className="font-semibold">Note:</span>{" "}
                                  {item.remarks}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Grand Total Footer */}
              <div className="p-6 bg-gray-50 flex justify-end">
                <div className="w-full md:w-1/2 space-y-2">
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-lg font-bold text-gray-900">
                      Grand Total
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                <Truck className="h-4 w-4 text-blue-600" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-start bg-blue-50 p-4 rounded-md text-blue-900">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm mb-1">Delivery Address</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {order.shippingAddress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN (Sidebar) --- */}
        <div className="space-y-6">
          {/* 1. Customer Info Card */}
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b ">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <User className="h-4 w-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {order.clientInfo.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Client Name
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className="px-2.5 py-0.5 text-xs font-medium border-primary/20 text-primary bg-primary/5">
                    {order.clientInfo.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                    Via: {order.purchaseChannelName}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {order.clientInfo.type === "B2B" &&
                  order.clientInfo.picName !== "-" && (
                    <div className="flex items-center gap-3 p-2.5 rounded-md bg-orange-50 border border-orange-100">
                      <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shadow-sm shrink-0">
                        <User className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-orange-600/80 font-medium">
                          PIC / UP
                        </p>
                        <p className="text-sm font-bold text-orange-900 truncate">
                          {order.clientInfo.picName}
                        </p>
                      </div>
                    </div>
                  )}
                <div className="flex items-center gap-3 p-2.5 rounded-md bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shadow-sm shrink-0">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground font-medium">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.clientInfo.type === "B2B" &&
                      order.clientInfo.picPhone !== "-"
                        ? order.clientInfo.picPhone
                        : order.clientInfo.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-md bg-gray-50 border border-gray-100 hover:bg-gray-100/80 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shadow-sm shrink-0">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground font-medium">
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.clientInfo.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Sales Rep Card */}
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b ">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <UserCircle className="h-4 w-4 text-primary" />
                Sales Representative
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  {order.sales.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 truncate">
                    {order.sales.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{order.sales.phone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Vendors Card */}
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b ">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <Store className="h-4 w-4 text-primary" />
                Vendors Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {order.vendors.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {order.vendors.map((vendor, idx) => (
                    <div key={idx} className="py-4 first:pt-5 last:pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {vendor.companyName}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 font-normal bg-gray-100 text-gray-600 hover:bg-gray-200">
                          {vendor.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-gray-50 p-2 rounded border border-gray-100/50">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {vendor.picName}
                          </span>
                        </div>
                        <div className="h-3 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{vendor.picPhone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                    <Store className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No vendors assigned.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- [NEW] SMART INVOICE DIALOG --- */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Pilih metode penagihan untuk pesanan ini.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* 1. Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
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
                onClick={() => {
                  setIsSplitMode(true);
                  setInvoiceCategory("FULL_PAYMENT"); // Default categori item split
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  isSplitMode
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                Split Items (Partial)
              </button>
            </div>

            {/* --- MODE 1: STANDARD (Dropdown Category) --- */}
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
                            Pelunasan (Sisa:{" "}
                            {formatCurrency(remainingToInvoice)})
                          </SelectItem>
                          <SelectItem value="INSTALLMENT">
                            Cicilan Berikutnya (Manual)
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* DP Logic */}
                {invoiceCategory === "DP" && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
                    <div className="flex items-center gap-4">
                      <Label className="text-xs">Tipe DP:</Label>
                      <div className="flex bg-white rounded border p-1">
                        <button
                          onClick={() => setDpType("PERCENTAGE")}
                          className={`text-xs px-2 py-1 rounded ${
                            dpType === "PERCENTAGE"
                              ? "bg-primary text-white"
                              : "text-gray-500"
                          }`}>
                          %
                        </button>
                        <button
                          onClick={() => setDpType("FIXED")}
                          className={`text-xs px-2 py-1 rounded ${
                            dpType === "FIXED"
                              ? "bg-primary text-white"
                              : "text-gray-500"
                          }`}>
                          Rp
                        </button>
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
                            (totalOrderAmount * invoiceDPPercent) / 100
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

                {/* Installment Logic */}
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

            {/* --- MODE 2: SPLIT ITEMS (Checkbox List) --- */}
            {isSplitMode && (
              <div className="space-y-4 animate-in fade-in">
                <div className="border rounded-md max-h-75 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0">
                      <TableRow>
                        <TableHead className="w-12.5"></TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="w-25">Bill Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* FILTER: Hanya tampilkan produk yang belum lunas */}
                      {order.products
                        .filter(
                          (item) =>
                            (item.remainingQuantity || item.quantity) > 0
                        )
                        .map((item) => {
                          // Hitung Max Qty yang bisa dipilih (Sisa tagihan)
                          // Fallback ke item.quantity jika backend belum update field baru
                          const maxQty =
                            item.remainingQuantity !== undefined
                              ? item.remainingQuantity
                              : item.quantity;

                          const isSelected = selectedItems.some(
                            (sel) =>
                              sel.productId === (item.productId || item.id)
                          );
                          const selectedData = selectedItems.find(
                            (sel) =>
                              sel.productId === (item.productId || item.id)
                          );

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Add logic khusus: set default qty = maxQty (sisa)
                                      setSelectedItems((prev) => [
                                        ...prev,
                                        {
                                          productId: item.productId || item.id,
                                          quantity: maxQty, // Default langsung sisa
                                          maxQty: maxQty,
                                          price: item.unitPrice,
                                        },
                                      ]);
                                    } else {
                                      // Remove logic (sama seperti sebelumnya)
                                      setSelectedItems((prev) =>
                                        prev.filter(
                                          (i) =>
                                            i.productId !==
                                            (item.productId || item.id)
                                        )
                                      );
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-sm">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                  <span>Total: {item.quantity}</span>
                                  {item.billedQuantity &&
                                    item.billedQuantity > 0 && (
                                      <span className="text-green-600">
                                        (Paid: {item.billedQuantity})
                                      </span>
                                    )}
                                  <span className="text-orange-600 font-medium">
                                    Sisa: {maxQty}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {isSelected ? (
                                  <Input
                                    type="number"
                                    min={1}
                                    max={maxQty} // Batasi input user max sesuai sisa
                                    className="h-8 w-20 text-center"
                                    value={selectedData?.quantity}
                                    onChange={(e) => {
                                      let val = Number(e.target.value);
                                      if (val > maxQty) val = maxQty; // Prevent over-bill
                                      if (val < 1) val = 1;

                                      updateItemQty(
                                        item.productId || item.id,
                                        val
                                      );
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                      {/* Empty State jika semua sudah lunas */}
                      {order.products.every(
                        (p) => (p.remainingQuantity || 0) <= 0
                      ) && (
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

                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md border border-blue-100">
                  <span className="text-sm font-medium text-blue-900">
                    Total Tagihan Split:
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatCurrency(splitTotalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* --- SECTION: INVOICE NOTES --- */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold">
                Catatan Invoice (Opsional)
              </Label>
              <div className="grid gap-4 max-h-75 overflow-y-auto pr-2">
                {noteCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="space-y-2 bg-gray-50 p-3 rounded-md border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-700">
                        {cat.name}
                      </Label>
                      {/* Dropdown Template Helper */}
                      <Select
                        onValueChange={(val) => {
                          const selectedTemplate = cat.templates?.find(
                            (t: any) => t.id === val
                          );
                          if (selectedTemplate) {
                            handleNoteChange(cat.id, selectedTemplate.content);
                          }
                        }}>
                        <SelectTrigger className="h-7 text-xs w-45 bg-white">
                          <SelectValue placeholder="Pilih Template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cat.templates && cat.templates.length > 0 ? (
                            cat.templates.map((t: any) => (
                              <SelectItem
                                key={t.id}
                                value={t.id}
                                className="text-xs">
                                {t.title}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-xs text-muted-foreground">
                              No templates
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Text Area untuk Edit Manual */}
                    <textarea
                      className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-20"
                      placeholder={`Tulis catatan untuk ${cat.name}...`}
                      value={
                        invoiceNotes.find((n) => n.categoryId === cat.id)
                          ?.content || ""
                      }
                      onChange={(e) => handleNoteChange(cat.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvoiceDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={
                isCreatingInvoice ||
                (!isSplitMode && !invoiceCategory) ||
                (isSplitMode && selectedItems.length === 0)
              }>
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
    </div>
  );
}

// --- Skeleton Loading Component ---
function DetailPageSkeleton() {
  return (
    <div className="space-y-6 mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-32 w-full rounded-xl" />{" "}
      {/* Financial Card Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-50 w-full rounded-xl" />
          <Skeleton className="h-100 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-50 w-full rounded-xl" />
          <Skeleton className="h-25 w-full rounded-xl" />
          <Skeleton className="h-37.5 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
