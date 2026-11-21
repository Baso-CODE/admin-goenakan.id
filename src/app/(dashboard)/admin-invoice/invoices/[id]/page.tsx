"use client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/utils/formatCurrency";

// === TYPES UPDATE ===
type InvoiceDetail = {
  id: number;
  invoiceNumber: string | null;
  orderId: string;
  category: "DP" | "FULL_PAYMENT" | "INSTALLMENT" | "REMAINING_BALANCE";
  billingMode?: "STANDARD" | "PARTIAL_QUANTITY";
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED" | "DRAFT";
  createdAt: string;
  dueDate: string | null;
  paymentDate: string | null;
  paidAt: string | null;
  totalAmount: number;
  method?: string;

  previousInvoice?: {
    id: number;
    invoiceNumber: string | null;
    totalAmount: number;
    status: string;
    category: string;
    paidAt: string | null;
    paymentDate?: string | null;
  } | null;
  totalPreviousPaid?: number;

  order: {
    orderNumber: string;
    totalAmount?: number;
    currencyCode?: string;
    salesCategory?: string;
    invoices?: {
      id: number;
      invoiceNumber: string | null;
      category: string;
      status: string;
      totalAmount: number;
      paidAt: string | null;
      paymentDate?: string | null;
      billingMode?: "STANDARD" | "PARTIAL_QUANTITY";
      items?: {
        quantity: number;
        orderProductId?: string | null;
        product?: { name: string } | null;
      }[];
    }[];
    products?: {
      id: string;
      quantity: number;
      unitPrice: number;
      product?: { name: string } | null;
    }[];
    createdBy?: {
      name: string | null;
      phone: string | null;
      image: string | null;
    } | null;
  };
  client: {
    type: "B2B" | "B2C";
    b2b?: {
      companyName: string;
      fullAddress: string;
      phone?: string | null;
      department?: {
        name: string;
      };
      pics?: {
        prefix?: string | null;
        name: string;
        phone?: string | null;
        email?: string | null;
      }[];
    };
    b2c?: {
      name: string;
      fullAddress: string;
      phone?: string | null;
    };
  };
  items: {
    id: number;
    orderProductId?: string | null;
    quantity: number;
    price: number;
    remarks?: string | null;
    selectedAttributes?: unknown;
    customization?: unknown;
    displayAttributes?: {
      name: string;
      value: string;
    }[];
    product: {
      name: string;
      sku: string;
    };
    variant?: {
      variantName: string;
      sku: string;
    } | null;
  }[];
  notes: {
    id: string;
    content: string;
    category: { name: string };
  }[];
};

const renderCustomization = (
  displayAttributes?: {
    name: string;
    value: string;
  }[],
  customization?: unknown,
) => {
  const isUUID = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );

  const formatSafeValue = (value: unknown): string => {
    if (typeof value === "string") {
      // Ambil label sebelum karakter "|" pertama.
      // Contoh: Oval|https://cloudinary... menjadi Oval
      const label = value.split("|", 1)[0].trim();

      return !label || isUUID(label) ? "" : label;
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value.map(formatSafeValue).filter(Boolean).join(", ");
    }

    if (value && typeof value === "object") {
      const object = value as Record<string, unknown>;

      return formatSafeValue(object.label ?? object.name ?? object.value);
    }

    return "";
  };

  let parsedCustomization = customization;

  if (typeof customization === "string") {
    try {
      parsedCustomization = JSON.parse(customization);
    } catch {
      parsedCustomization = null;
    }
  }

  const customEntries =
    parsedCustomization &&
    typeof parsedCustomization === "object" &&
    !Array.isArray(parsedCustomization)
      ? Object.entries(parsedCustomization as Record<string, unknown>)
          .filter(
            ([key]) =>
              !isUUID(key) &&
              !["freightMode", "resolvedAttributes"].includes(key),
          )
          .map(([key, value]) => ({
            name: key,
            value: formatSafeValue(value),
          }))
          .filter((entry) => entry.value)
      : [];

  if (!displayAttributes?.length && customEntries.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-slate-600">
      {displayAttributes?.map((attribute, index) => {
        const displayValue = formatSafeValue(attribute.value);

        if (!displayValue) return null;

        return (
          <div key={`${attribute.name}-${index}`}>
            <span className="font-semibold">{attribute.name}:</span>{" "}
            {displayValue}
          </div>
        );
      })}

      {customEntries.map((entry, index) => (
        <div key={`${entry.name}-${index}`}>
          <span className="font-semibold">{entry.name}:</span> {entry.value}
        </div>
      ))}
    </div>
  );
};

// Helper untuk format (1st, 2nd, 3rd, 4th)
const getOrdinal = (n: number) => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

export default function InvoiceDetailPage() {
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,

    documentTitle: `Invoice-${invoice?.invoiceNumber || invoice?.id}`,

    pageStyle: `
    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      #invoice-content {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        transform: none !important;
        box-shadow: none !important;
      }

      #invoice-content > .flex-1 {
        flex: none !important;
      }

      #invoice-content table {
        width: 100% !important;
        max-width: 100% !important;
      }

      #invoice-content thead {
        display: table-header-group !important;
      }

      #invoice-content .invoice-item-row {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      #invoice-content img {
        max-width: 100% !important;
      }
    }
  `,

    onAfterPrint: () => toast.success("Dialog cetak telah ditutup"),
  });

  const loadData = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi(`/invoices/${id}`);

      if (!res.ok) throw new Error("Gagal memuat data");

      const data = await res.json();
      setInvoice(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data invoice");
    } finally {
      setLoading(false);
    }
  }, [id, status, fetchApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkAsPaid = async () => {
    if (
      !invoice ||
      status !== "authenticated" ||
      !["UNPAID", "OVERDUE"].includes(invoice.status)
    )
      return;
    if (!paymentDate) {
      toast.error("Tanggal pembayaran wajib diisi");
      return;
    }
    setIsPaying(true);

    try {
      const res = await fetchApi(`/invoices/${invoice.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          method: paymentMethod,
          paymentDate: `${paymentDate}T12:00:00.000Z`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal memproses pembayaran");
      }

      toast.success("Invoice berhasil ditandai LUNAS");
      setIsPayDialogOpen(false);
      await loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat update pembayaran");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    );
  if (!invoice) return <div>Invoice not found</div>;

  const isB2B = invoice.client.type === "B2B";
  const clientName = isB2B
    ? invoice.client.b2b?.companyName
    : invoice.client.b2c?.name;
  const clientAddress = isB2B
    ? invoice.client.b2b?.fullAddress
    : invoice.client.b2c?.fullAddress;

  const picName =
    isB2B && invoice.client.b2b?.pics?.length
      ? invoice.client.b2b.pics[0].name
      : null;

  const picPrefix = invoice?.client?.b2b?.pics?.[0]?.prefix || "";
  const picPhone =
    invoice?.client?.b2b?.pics?.[0]?.phone ||
    invoice?.client?.b2b?.phone ||
    "-";
  const departmentName = isB2B ? invoice.client.b2b?.department?.name : null;

  const createdDate = new Date(invoice.createdAt);
  const displayInvoiceNo = invoice.invoiceNumber || `INV/${invoice.id}`;

  //  UPDATE: Ambil mata uang dari relasi order (default IDR jika kosong)
  const currency = invoice.order?.currencyCode || "IDR";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-600 hover:bg-green-700";
      case "UNPAID":
        return "bg-gray-500 hover:bg-gray-600";
      case "OVERDUE":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-blue-600";
    }
  };

  const salesData = {
    name: invoice.order?.createdBy?.name || "Admin / Sales",
    phone: invoice.order?.createdBy?.phone || "-",
    signatureUrl: invoice.order?.createdBy?.image || null,
  };
  const calculatedOrderTotal = invoice.items.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0,
  );
  const orderTotal = Number(invoice.order?.totalAmount ?? calculatedOrderTotal);
  const amountDue = Number(invoice.totalAmount);
  const billingMode = invoice.billingMode ?? "STANDARD";
  const previousInvoices = (invoice.order?.invoices ?? [])
    .filter(
      (inv) =>
        inv.id < invoice.id && !["CANCELLED", "DRAFT"].includes(inv.status),
    )
    .sort((a, b) => a.id - b.id);
  const priorBilled = previousInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0,
  );
  const remainingAfterThis = Math.max(0, orderTotal - priorBilled - amountDue);
  const priorPaid = previousInvoices.reduce(
    (sum, inv) => sum + (inv.status === "PAID" ? Number(inv.totalAmount) : 0),
    0,
  );
  const outstandingBefore = Math.max(0, priorBilled - priorPaid);
  const isFinalInvoice = remainingAfterThis <= 0.01;
  const datePaid = (inv: {
    paidAt?: string | null;
    paymentDate?: string | null;
  }) => inv.paidAt ?? inv.paymentDate;
  const formatPaid = (inv: {
    status: string;
    paidAt?: string | null;
    paymentDate?: string | null;
  }) => {
    const value = datePaid(inv);
    return inv.status === "PAID"
      ? value
        ? `Paid on ${format(new Date(value), "dd MMM yyyy", { locale: idLocale })}`
        : "Paid"
      : "Not yet paid";
  };
  const rowSummary = (
    label: string,
    value: number,
    qualifier?: string,
    strong = false,
  ) => (
    <div className="flex gap-2 items-start" key={label}>
      <span className="w-3 shrink-0">-</span>
      <div className="flex-1">
        <span className="font-semibold">{label}: </span>
        <span className={strong ? "font-bold" : ""}>
          {formatCurrency(value, currency)}
        </span>
        {qualifier && (
          <span className="italic text-gray-600"> ({qualifier})</span>
        )}
      </div>
    </div>
  );

  const isPartial = billingMode === "PARTIAL_QUANTITY";
  const itemCount = invoice.items.length;
  const isMultiple = itemCount > 1;
  const isDirect =
    !isPartial &&
    invoice.category === "FULL_PAYMENT" &&
    previousInvoices.length === 0;
  const showDueColumn = !isPartial && (!isDirect || isMultiple);
  const showAmountColumn = !isPartial && !isDirect && isMultiple;
  const columnCount = 5 + Number(showDueColumn) + Number(showAmountColumn);
  const invoiceProductsLabel = (
    items: { quantity: number; product?: { name: string } | null }[],
  ) =>
    items.length
      ? items
          .map(
            (item) => `${item.quantity} pcs ${item.product?.name ?? "Product"}`,
          )
          .join(", ")
      : "Items not available";
  const priorItems = previousInvoices
    .filter((prior) => prior.billingMode === "PARTIAL_QUANTITY")
    .flatMap((prior) => prior.items ?? []);
  const remainingProducts = (invoice.order?.products ?? [])
    .map((product) => {
      const billed = priorItems
        .filter((item) => item.orderProductId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const current = isPartial
        ? invoice.items
            .filter((item) => item.orderProductId === product.id)
            .reduce((sum, item) => sum + item.quantity, 0)
        : 0;
      const remaining = Math.max(0, product.quantity - billed - current);
      return { quantity: remaining, product: product.product };
    })
    .filter((item) => item.quantity > 0);
  const remainingProductLabel = remainingProducts.length
    ? invoiceProductsLabel(remainingProducts)
    : "";
  const summaryPreviousLabel = (
    prior: (typeof previousInvoices)[number],
    index: number,
  ) => {
    if (isPartial) {
      const detail = prior.items?.length
        ? ` - ${invoiceProductsLabel(prior.items)}`
        : "";
      return `Previous Payment (${getOrdinal(index + 1)} Partial Shipment${detail})`;
    }
    if (invoice.category === "REMAINING_BALANCE" && prior.category === "DP")
      return "Down Payment";
    if (
      invoice.category === "INSTALLMENT" ||
      previousInvoices.some((x) => x.category === "INSTALLMENT")
    ) {
      return index === 0
        ? "1st Installment (Down Payment)"
        : `${getOrdinal(index + 1)} Installment`;
    }
    return prior.category === "DP"
      ? "Down Payment"
      : `Previous Payment (${prior.invoiceNumber || `INV/${prior.id}`})`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-4 mb-8">
        <div className=" mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Invoice Detail
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{displayInvoiceNo}</span>
                <span>•</span>
                <Link
                  href={`/super-admin/orders/detail/${invoice.orderId}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
                  Lihat Order #{invoice.order.orderNumber}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Print / Save PDF
            </Button>

            {["UNPAID", "OVERDUE"].includes(invoice.status) && (
              <Button
                onClick={() => setIsPayDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* A4 PAPER CONTAINER */}
      <div className="flex justify-center overflow-auto px-4 pb-10">
        <div
          id="invoice-content"
          ref={invoiceRef}
          className="w-[210mm] min-h-[297mm] h-auto bg-[#ffffff] text-[#1e293b] p-10 flex flex-col font-sans text-[13px] leading-relaxed relative box-border transform scale-90 md:scale-100 origin-top shadow-lg print:shadow-none print:scale-100">
          <div className="flex-1">
            {/* 1. HEADER */}
            <div className="w-full mb-10">
              <img
                src="/images/invoice.png"
                alt="Goenakan Indonesia Header"
                className="w-full h-auto object-contain max-h-30"
                crossOrigin="anonymous"
              />
            </div>

            <div className="mb-8 w-full">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-25 font-medium pr-2 align-top text-left py-0.5">
                      Phone
                    </td>
                    <td className="align-top text-left py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1">
                          {salesData.phone} ({salesData.name.split(" ")[0]})
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium pr-2 align-top text-left py-0.5">
                      E-mail
                    </td>
                    <td className="align-top text-left py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1">goenakan.id@gmail.com</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="h-2"></td>
                  </tr>

                  <tr>
                    <td className="font-medium pr-2 align-top text-left py-0.5">
                      Invoice Date
                    </td>
                    <td className="align-top text-left py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1">
                          {format(createdDate, "dd MMMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {invoice.dueDate && (
                    <tr>
                      <td className="font-medium pr-2 align-top text-left text-red-600 py-0.5">
                        Due Date
                      </td>
                      <td className="align-top text-left text-red-600 font-medium py-0.5">
                        <div className="flex">
                          <span className="w-3 mr-1">:</span>
                          <div className="flex-1">
                            {format(new Date(invoice.dueDate), "dd MMMM yyyy", {
                              locale: idLocale,
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-medium pr-2 align-top text-left py-0.5">
                      Invoice No.
                    </td>
                    <td className="align-top text-left uppercase font-bold py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1">{displayInvoiceNo}</div>
                      </div>
                    </td>
                  </tr>

                  {previousInvoices.length > 0 && (
                    <tr>
                      <td className="font-medium pr-2 align-top text-left text-slate-700 py-0.5">
                        Prev. Invoice
                      </td>
                      <td className="align-top text-left uppercase text-slate-700 font-medium py-0.5">
                        <div className="flex">
                          <span className="w-3 mr-1">:</span>
                          <div className="flex-1 leading-relaxed">
                            {previousInvoices.map((prevInv, index) => (
                              <span key={prevInv.id} className="inline-block">
                                {prevInv.invoiceNumber || `INV/${prevInv.id}`}
                                <span className="text-[10px] ml-1 text-slate-400 normal-case">
                                  ({prevInv.category.replace("_", " ")})
                                </span>
                                {index < previousInvoices.length - 1 && (
                                  <span className="mx-2 text-slate-300 font-normal">
                                    |
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="font-medium pr-2 align-top text-left py-0.5">
                      Currency
                    </td>
                    <td className="align-top text-left py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        {/*  UPDATE: Menggunakan variabel dinamis */}
                        <div className="flex-1">{currency}</div>
                      </div>
                    </td>
                  </tr>
                  {invoice.status === "PAID" && invoice.method && (
                    <tr>
                      <td className="font-medium pr-2 align-top text-left text-green-600 py-0.5">
                        Paid Via
                      </td>
                      <td className="align-top text-left text-green-600 font-bold uppercase py-0.5">
                        <div className="flex">
                          <span className="w-3 mr-1">:</span>
                          <div className="flex-1">
                            {invoice.method.replace("_", " ")}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {invoice.status === "PAID" && invoice.paidAt && (
                    <tr>
                      <td className="font-medium pr-2 align-top text-left text-green-600 py-0.5">
                        Date Paid
                      </td>
                      <td className="align-top text-left text-green-600 font-bold uppercase py-0.5">
                        <div className="flex">
                          <span className="w-3 mr-1">:</span>
                          <div className="flex-1">
                            {format(new Date(invoice.paidAt), "dd MMMM yyyy", {
                              locale: idLocale,
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. CUSTOMER INFO */}
            <div className="mb-8">
              <div className="font-bold mb-2 text-sm uppercase tracking-wide border-b pb-1 border-[#e2e8f0]">
                Bill To (Customer)
              </div>
              <table className="w-full max-w-[85%]">
                <tbody>
                  <tr>
                    <td className="w-25 font-medium align-top py-0.5">Name</td>
                    <td className="align-top font-bold uppercase py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1">{clientName}</div>
                      </div>
                    </td>
                  </tr>
                  {isB2B && (
                    <>
                      <tr>
                        <td className="font-medium align-top py-0.5">
                          Department
                        </td>
                        <td className="align-top py-0.5">
                          <div className="flex">
                            <span className="w-3 mr-1">:</span>
                            <div className="flex-1">
                              {departmentName || "-"}
                              {picName
                                ? `(UP: ${picPrefix ? picPrefix + " " : ""}${picName})`
                                : ""}
                            </div>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="font-medium align-top py-0.5">Phone</td>
                        <td className="align-top py-0.5">
                          <div className="flex">
                            <span className="w-3 mr-1">:</span>
                            <div className="flex-1">{picPhone || "-"}</div>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className="font-medium align-top py-0.5">
                      {invoice?.order?.salesCategory === "SAMPLE"
                        ? "Sample Order No."
                        : "Sales Order No."}
                    </td>
                    <td className="align-top py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1 font-mono font-medium">
                          {invoice?.order?.orderNumber || "-"}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium align-top py-0.5">Address</td>
                    <td className="align-top py-0.5">
                      <div className="flex">
                        <span className="w-3 mr-1">:</span>
                        <div className="flex-1 text-justify pr-4">
                          {clientAddress}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. PRODUCT TABLE */}
            <div className="mb-6">
              <h3 className="mb-3 border-b border-slate-200 pb-2 text-[13px] font-bold uppercase tracking-wide">
                Product Details
              </h3>

              <table className="w-full table-fixed border-collapse text-[11px]">
                <colgroup>
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "23%" }} />
                </colgroup>

                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-300 px-2 py-3 text-center">
                      No.
                    </th>
                    <th className="border border-slate-300 px-3 py-3 text-left">
                      Product Description
                    </th>
                    <th className="border border-slate-300 px-2 py-3 text-center">
                      Qty
                    </th>
                    <th className="border border-slate-300 px-2 py-3 text-right">
                      Unit Price
                    </th>
                    <th className="border border-slate-300 px-2 py-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoice.items.map((item, index) => {
                    const lineTotal =
                      Number(item.price) * Number(item.quantity);

                    return (
                      <tr key={item.id} className="invoice-item-row align-top">
                        <td className="border border-slate-300 px-2 py-3 text-center">
                          {index + 1}
                        </td>

                        <td className="border border-slate-300 px-3 py-3">
                          <div
                            className="font-semibold leading-relaxed text-slate-900"
                            style={{ overflowWrap: "anywhere" }}>
                            {item.product.name}
                          </div>

                          {item.variant?.variantName && (
                            <div className="mt-1 text-[10px] text-slate-500">
                              Variant: {item.variant.variantName}
                            </div>
                          )}

                          {renderCustomization(
                            item.displayAttributes,
                            item.customization,
                          )}

                          {item.remarks && (
                            <p className="mt-2 whitespace-pre-wrap text-[10px] italic text-slate-500">
                              {item.remarks}
                            </p>
                          )}
                        </td>

                        <td className="border border-slate-300 px-2 py-3 text-center">
                          {Number(item.quantity).toLocaleString("id-ID")}
                        </td>

                        <td className="border border-slate-300 px-2 py-3 text-right">
                          {formatCurrency(Number(item.price), currency)}
                        </td>

                        <td className="border border-slate-300 px-2 py-3 text-right font-semibold">
                          {formatCurrency(lineTotal, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-[320px] space-y-2 text-[12px]">
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span>Total Order</span>
                    <span className="font-semibold">
                      {formatCurrency(orderTotal, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 font-bold">
                    <span>Amount Due</span>
                    <span className="text-[14px] text-blue-700">
                      {formatCurrency(amountDue, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. PAYMENT SUMMARY - Full / DP / BP / Installment / Partial */}
            {!isDirect && (
              <div className="mb-6 p-4 border border-[#94a3b8] bg-[#f8fafc] rounded-sm text-[12px] break-inside-avoid">
                <div className="font-bold mb-3 uppercase border-b pb-1.5 border-[#cbd5e1]">
                  Payment Summary
                </div>
                <div className="flex flex-col gap-2">
                  {rowSummary("Total Purchase Order Value", orderTotal)}
                  {previousInvoices.map((prior, index) => (
                    <div key={prior.id}>
                      {rowSummary(
                        summaryPreviousLabel(prior, index),
                        Number(prior.totalAmount),
                        formatPaid(prior),
                      )}
                    </div>
                  ))}
                  {isPartial
                    ? rowSummary(
                        `${isFinalInvoice ? "Final Billing (Final Shipment" : previousInvoices.length === 0 ? "Amount Due (1st Partial Shipment" : `Current Billing (${getOrdinal(previousInvoices.length + 1)} Partial Shipment`} - ${invoiceProductsLabel(invoice.items)})`,
                        amountDue,
                        invoice.status === "PAID"
                          ? formatPaid(invoice)
                          : "Due: Immediately",
                        true,
                      )
                    : invoice.category === "DP"
                      ? rowSummary(
                          "Down Payment",
                          amountDue,
                          invoice.status === "PAID"
                            ? formatPaid(invoice)
                            : "Due: Immediately",
                          true,
                        )
                      : invoice.category === "REMAINING_BALANCE"
                        ? rowSummary(
                            "Balance Payment",
                            amountDue,
                            invoice.status === "PAID"
                              ? formatPaid(invoice)
                              : "Due: Immediately",
                            true,
                          )
                        : invoice.category === "FULL_PAYMENT"
                          ? rowSummary(
                              "Full Payment",
                              amountDue,
                              invoice.status === "PAID"
                                ? formatPaid(invoice)
                                : "Due: Immediately",
                              true,
                            )
                          : rowSummary(
                              isFinalInvoice
                                ? "Final Installment (Balance Payment)"
                                : previousInvoices.length === 0
                                  ? "1st Installment (Down Payment)"
                                  : `${getOrdinal(previousInvoices.length + 1)} Installment`,
                              amountDue,
                              invoice.status === "PAID"
                                ? formatPaid(invoice)
                                : "Due: Immediately",
                              true,
                            )}
                  {rowSummary(
                    isPartial && remainingProductLabel
                      ? `Remaining Balance (${remainingProductLabel})`
                      : "Remaining Balance",
                    remainingAfterThis,
                    isFinalInvoice
                      ? "Fully invoiced upon this settlement; payment subject to confirmation"
                      : invoice.category === "DP" || isPartial
                        ? "Due: Upon delivery or completion"
                        : "Due: As per Agreement",
                  )}
                  {outstandingBefore > 0 &&
                    rowSummary("Previous Unpaid Invoices", outstandingBefore)}
                </div>
              </div>
            )}

            {/* 6. NOTES SECTION */}
            {invoice.notes && invoice.notes.length > 0 && (
              <div className="mb-8 mt-6 break-inside-avoid">
                <div className="font-bold mb-2 text-sm uppercase tracking-wide border-b pb-1 border-[#e2e8f0]">
                  Notes & Instructions
                </div>
                <div className="grid grid-cols-1 gap-3 text-[11px] text-[#475569]">
                  {invoice.notes.map((note) => (
                    <div key={note.id} className="flex flex-col gap-1">
                      <span className="font-bold text-black uppercase text-[10px]">
                        {note.category.name}:
                      </span>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN BAWAH (Bank & TTD) */}
          <div className="mt-10 break-inside-avoid">
            <div className="flex justify-end items-end">
              <div className="text-center mr-6">
                <div className="mb-4 font-bold text-sm">Best Regards,</div>
                <div className="relative h-20 w-37.5 flex items-center justify-center">
                  {salesData.signatureUrl ? (
                    <img
                      src={salesData.signatureUrl}
                      alt="Signature"
                      className="h-full w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs italic border border-dashed rounded">
                      (No Signature)
                    </div>
                  )}
                </div>
                <div className="font-bold underline text-sm mt-1">
                  {salesData.name}
                </div>
                <div className="text-[11px] font-bold text-[#475569]">
                  Goenakan Indonesia
                </div>
              </div>
            </div>
          </div>

          {/* STAMP LUNAS */}
          {invoice.status === "PAID" && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-green-600 text-green-600 text-6xl font-black p-4 rotate-[-15deg] opacity-20 select-none pointer-events-none rounded-lg z-0">
              LUNAS
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Tandai invoice ini sebagai LUNAS (PAID). Pastikan dana sudah
              masuk.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Tanggal Pembayaran</Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="method">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                  <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isPaying || !paymentDate}
              className="bg-green-600 hover:bg-green-700">
              {isPaying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Konfirmasi Lunas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
