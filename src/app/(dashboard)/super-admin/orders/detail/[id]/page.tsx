"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Edit,
  Mail,
  MapPin,
  Phone,
  Printer,
  Store,
  Truck,
  User,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithToken } from "../../order-service";

// --- Types (Sesuaikan dengan return API Service Anda) ---
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
    productName: string;
    sku: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customization: string;
    remarks: string;
  }[];

  vendors: {
    id: string;
    companyName: string;
    picName: string;
    picPhone: string;
    role: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadOrder = async () => {
      try {
        setLoading(true);
        // Ganti URL sesuai endpoint controller Anda
        const data = await fetchWithToken(`http://localhost:8000/orders/${id}`);
        console.log("Data Order dari Backend:", data);
        console.log("Data Products:", data.products);
        setOrder(data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat detail order");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  if (loading) {
    return <DetailPageSkeleton />;
  }

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
    <div className="space-y-6  mx-auto pb-10">
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
                }
              >
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
            onClick={() => router.push(`/super-admin/orders/edit/${order.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Order
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN (Products & Shipping) --- */}
        <div className="lg:col-span-2 space-y-6">
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

                          {/* Customization & Remarks */}
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

        {/* --- RIGHT COLUMN (Customer, Sales, Vendor) --- */}
        {/* --- RIGHT COLUMN (Sidebar) --- */}
        <div className="space-y-6">
          {/* 1. Customer Info Card */}
          {/* 1. Customer Info Card */}
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b ">
              <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <User className="h-4 w-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Nama & Tipe */}
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
                    className="px-2.5 py-0.5 text-xs font-medium border-primary/20 text-primary bg-primary/5"
                  >
                    {order.clientInfo.type}
                  </Badge>
                  {/* Purchase Channel Badge */}
                  <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                    Via: {order.purchaseChannelName}
                  </span>
                </div>
              </div>

              {/* Detail Kontak & PIC */}
              <div className="space-y-3 pt-2">
                {/* Tampilkan PIC jika ada (dan berbeda dengan nama client/B2B) */}
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
                      {/* Tampilkan No HP PIC jika ada, fallback ke No HP Perusahaan */}
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
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  {order.sales.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Info */}
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
                <Store className="h-4 w-4 text-primary" />{" "}
                {/* Ikon Store lebih cocok utk vendor */}
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
                          className="text-[10px] h-5 px-1.5 font-normal bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
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
                        <div className="h-3 w-px bg-gray-300"></div>{" "}
                        {/* Separator */}
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
    </div>
  );
}

// --- Skeleton Loading Component ---
function DetailPageSkeleton() {
  return (
    <div className="space-y-6  mx-auto">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[120px] w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[100px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
