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

// === TYPES UPDATE ===
type InvoiceDetail = {
  id: number;
  invoiceNumber: string | null;
  orderId: string;
  category: "DP" | "FULL_PAYMENT" | "INSTALLMENT" | "REMAINING_BALANCE";
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
  } | null;
  totalPreviousPaid?: number;

  order: {
    poNumber: string;
    totalAmount?: number;
    invoices?: {
      id: number;
      invoiceNumber: string | null;
      category: string;
      status: string;
      totalAmount: number;
      paidAt: string | null;
    }[];
    sales: {
      name: string;
      phone: string;
      signatureUrl: string | null;
      bankAccounts: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
      }[];
    };
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
    quantity: number;
    price: number;
    remarks?: string;
    customization?: any;
    product: { name: string; sku: string };
    variant?: { variantName: string; sku: string };
  }[];
  notes: {
    id: string;
    content: string;
    category: { name: string };
  }[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace("Rp", "Rp");
};

const renderCustomization = (customization: any) => {
  return null;
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
  // const [isDownloading, setIsDownloading] = useState(false);
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
    onAfterPrint: () => toast.success("PDF siap disimpan"),
  });

  const loadData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    try {
      setLoading(true);
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

  // const handleDownloadPDF = async () => {
  //   const element = invoiceRef.current;
  //   if (!element) return;

  //   setIsDownloading(true);
  //   try {
  //     const images = element.querySelectorAll("img");
  //     const promises = Array.from(images).map((img) => {
  //       if (img.complete) return Promise.resolve();
  //       return new Promise((resolve) => {
  //         img.onload = resolve;
  //         img.onerror = resolve;
  //       });
  //     });
  //     await Promise.all(promises);

  //     const canvas = await html2canvas(element, {
  //       scale: 2,
  //       useCORS: true,
  //       logging: true,
  //       backgroundColor: "#ffffff",
  //       onclone: (clonedDoc) => {
  //         const clonedElement = clonedDoc.getElementById("invoice-content");
  //         if (clonedElement) {
  //           clonedElement.style.boxShadow = "none";
  //         }
  //       },
  //     });

  //     const imgData = canvas.toDataURL("image/jpeg", 1.0);
  //     const pdf = new jsPDF("p", "mm", "a4");
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = pdf.internal.pageSize.getHeight();

  //     pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  //     const fileName = `Invoice-${invoice?.invoiceNumber || invoice?.id}.pdf`;
  //     pdf.save(fileName);
  //     toast.success("Berhasil download PDF");
  //   } catch (error) {
  //     console.error("Failed to download PDF", error);
  //     toast.error("Gagal mendownload PDF");
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // };

  const handleMarkAsPaid = async () => {
    if (!invoice || status !== "authenticated") return;
    setIsPaying(true);

    try {
      const res = await fetchApi(`/invoices/${invoice.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          method: paymentMethod,
          paymentDate: new Date(paymentDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal memproses pembayaran");
      }

      toast.success("Invoice berhasil ditandai LUNAS");
      setIsPayDialogOpen(false);
      loadData();
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

  const salesData = invoice.order.sales;

  const calculatedOrderTotal = invoice.items.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0,
  );
  const orderTotal = invoice.order?.totalAmount ?? calculatedOrderTotal;

  const previousInvoices =
    invoice.order?.invoices
      ?.filter((inv) => inv.id < invoice.id && inv.status !== "CANCELLED")
      .sort((a, b) => a.id - b.id) || [];

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
                  Lihat Order #{invoice.order.poNumber}
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

            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
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
          className="w-[210mm] min-h-[297mm] h-auto bg-[#ffffff] text-[#1e293b] p-10 flex flex-col font-sans text-[13px] leading-relaxed relative box-border transform scale-90 md:scale-100 origin-top shadow-lg print:shadow-none print:scale-100 print:p-0"
          style={{
            padding: "40px",
          }}>
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

            {/* 2. CONTACT INFO & INVOICE META */}
            <div className="mb-8 w-full">
              <table className=" w-full">
                <tbody>
                  <tr>
                    <td className="w-25 font-medium pr-2 text-left">Phone</td>
                    <td className="text-left">
                      : {salesData.phone} ({salesData.name.split(" ")[0]})
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium pr-2 text-left">E-mail</td>
                    <td className="text-left">: goenakan.id@gmail.com</td>
                  </tr>
                  <tr>
                    <td className="h-2"></td>
                  </tr>

                  <tr>
                    <td className="font-medium pr-2 text-left">Invoice Date</td>
                    <td className="text-left">
                      :{" "}
                      {format(createdDate, "dd MMMM yyyy", {
                        locale: idLocale,
                      })}
                    </td>
                  </tr>

                  {invoice.dueDate && (
                    <tr>
                      <td className="font-medium pr-2 text-left text-red-600">
                        Due Date
                      </td>
                      <td className="text-left text-red-600 font-medium">
                        :{" "}
                        {format(new Date(invoice.dueDate), "dd MMMM yyyy", {
                          locale: idLocale,
                        })}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-medium pr-2 text-left">Invoice No.</td>
                    <td className="text-left uppercase font-bold">
                      : {displayInvoiceNo}
                    </td>
                  </tr>

                  {previousInvoices.length > 0 && (
                    <tr>
                      <td className="font-medium pr-2 text-left text-slate-700 align-top">
                        Prev. Invoice
                      </td>
                      <td className="text-left uppercase text-slate-700 font-medium">
                        <div className="flex">
                          <span className="whitespace-pre mr-1">: </span>
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
                    <td className="font-medium pr-2 text-left">Currency</td>
                    <td className="text-left">: IDR</td>
                  </tr>
                  {invoice.status === "PAID" && invoice.method && (
                    <tr>
                      <td className="font-medium pr-2 text-left text-green-600">
                        Paid Via
                      </td>
                      <td className="text-left text-green-600 font-bold uppercase">
                        : {invoice.method.replace("_", " ")}
                      </td>
                    </tr>
                  )}
                  {invoice.status === "PAID" && invoice.paidAt && (
                    <tr>
                      <td className="font-medium pr-2 text-left text-green-600">
                        Date Paid
                      </td>
                      <td className="text-left text-green-600 font-bold uppercase">
                        :{" "}
                        {format(new Date(invoice.paidAt), "dd MMMM yyyy", {
                          locale: idLocale,
                        })}
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
                      : {clientName}
                    </td>
                  </tr>
                  {isB2B && (
                    <>
                      <tr>
                        <td className="font-medium align-top py-0.5">
                          Department
                        </td>
                        <td className="align-top py-0.5">
                          : {departmentName || "-"}{" "}
                          {picName
                            ? `(UP: ${picPrefix ? picPrefix + " " : ""}${picName})`
                            : ""}
                        </td>
                      </tr>

                      <tr>
                        <td className="font-medium align-top py-0.5">Phone</td>
                        <td className="align-top py-0.5">
                          : {picPhone || "-"}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className="font-medium align-top py-0.5">PO No.</td>
                    <td className="align-top py-0.5">
                      : {invoice?.order?.poNumber || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium align-top py-0.5">Address</td>
                    <td className="align-top py-0.5">: {clientAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. PRODUCT TABLE */}
            <div className="mb-6 page-break-inside-auto">
              <table className="w-full border-collapse border border-[#94a3b8]">
                <thead className="print:table-header-group">
                  <tr className="bg-[#f3f4f6] text-center font-bold">
                    <th className="border border-[#94a3b8] py-2 w-8">No</th>
                    <th className="border border-[#94a3b8] py-2">
                      Product Description
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-12">Qty</th>
                    <th className="border border-[#94a3b8] py-2 w-32">
                      Unit Price
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-36">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="text-center align-top h-15 break-inside-avoid page-break-inside-avoid">
                      <td className="border border-[#94a3b8] py-2">
                        {index + 1}
                      </td>
                      <td className="border border-[#94a3b8] py-2 px-3 text-left">
                        <div className="font-bold mb-1">
                          {item.product.name}
                        </div>
                        <div className="text-[#475569] text-[11px] space-y-1">
                          {item.product.sku && (
                            <div>SKU: {item.product.sku}</div>
                          )}
                          {item.variant && (
                            <div>Variant: {item.variant.variantName}</div>
                          )}
                          {item.customization &&
                            renderCustomization(item.customization)}
                          {item.remarks && (
                            <div className="italic text-gray-500">
                              Note: {item.remarks}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-[#94a3b8] py-2">
                        {item.quantity}
                      </td>
                      <td className="border border-[#94a3b8] py-2 text-right px-2">
                        {formatCurrency(Number(item.price))}
                      </td>
                      <td className="border border-[#94a3b8] py-2 text-right px-2 font-medium">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </td>
                    </tr>
                  ))}

                  {/* Jika lebih dari 1 produk, tambahkan Amount Due (Total Order) di bawah tabel item */}
                  {invoice.items.length > 1 && (
                    <tr className="text-center bg-[#f9fafb]">
                      <td
                        colSpan={4}
                        className="border border-[#94a3b8] py-2 text-right px-3 font-bold text-gray-700">
                        Total Amount Due
                      </td>
                      <td className="border border-[#94a3b8] py-2 text-right px-2 font-bold text-gray-900">
                        {formatCurrency(calculatedOrderTotal)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. PAYMENT SUMMARY */}
            <div className="mb-6 p-4 border border-[#94a3b8] bg-[#f8fafc] rounded-sm text-[12px] break-inside-avoid page-break-inside-avoid">
              <div className="font-bold mb-3 uppercase border-b pb-1.5 border-[#cbd5e1] text-[#1e293b]">
                Payment Summary
              </div>
              <div className="flex flex-col gap-2 text-gray-800">
                <div className="flex items-start">
                  <span className="w-4 mr-2">-</span>
                  <div className="flex-1">
                    <span className="font-semibold">
                      Total Purchase Order Value:{" "}
                    </span>
                    <span>{formatCurrency(orderTotal)}</span>
                  </div>
                </div>

                {/* RENDER DYNAMIC PAYMENT SUMMARY BASED ON CATEGORY */}
                {(() => {
                  const allOrderInvoices = (invoice.order?.invoices || [])
                    .filter((inv) => inv.status !== "CANCELLED")
                    .sort((a, b) => a.id - b.id);
                  const currentIndex = allOrderInvoices.findIndex(
                    (inv) => inv.id === invoice.id,
                  );
                  const history =
                    currentIndex !== -1
                      ? allOrderInvoices.slice(0, currentIndex)
                      : previousInvoices;
                  const sumHistory = history.reduce(
                    (acc, inv) => acc + Number(inv.totalAmount),
                    0,
                  );
                  const remainingAfterThis =
                    orderTotal - sumHistory - invoice.totalAmount;
                  const isFinal = remainingAfterThis <= 0;

                  // === SCENARIO: DP ===
                  if (invoice.category === "DP") {
                    return (
                      <>
                        <div className="flex items-start">
                          <span className="w-4 mr-2">-</span>
                          <div className="flex-1">
                            <span className="font-semibold">
                              Down Payment:{" "}
                            </span>
                            <span className="font-bold">
                              {formatCurrency(invoice.totalAmount)}
                            </span>
                            <span className="italic text-gray-600">
                              {" "}
                              (Due: Immediately)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="w-4 mr-2">-</span>
                          <div className="flex-1">
                            <span className="font-semibold">
                              Remaining Balance:{" "}
                            </span>
                            <span>
                              {formatCurrency(
                                remainingAfterThis > 0 ? remainingAfterThis : 0,
                              )}
                            </span>
                            <span className="italic text-gray-600">
                              {" "}
                              (Due: Upon delivery or completion)
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  }

                  // === SCENARIO: BP (REMAINING_BALANCE / FULL_PAYMENT) ===
                  if (
                    invoice.category === "REMAINING_BALANCE" ||
                    invoice.category === "FULL_PAYMENT"
                  ) {
                    return (
                      <>
                        {history.map((prev, i) => (
                          <div key={prev.id} className="flex items-start">
                            <span className="w-4 mr-2">-</span>
                            <div className="flex-1">
                              <span className="font-semibold">
                                {prev.category === "DP"
                                  ? "Down Payment"
                                  : "Previous Payment"}
                                :{" "}
                              </span>
                              <span>{formatCurrency(prev.totalAmount)}</span>
                              <span className="italic text-gray-600">
                                {prev.paidAt
                                  ? ` (Paid on ${format(new Date(prev.paidAt), "dd MMM yyyy", { locale: idLocale })})`
                                  : " (Unpaid)"}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-start">
                          <span className="w-4 mr-2">-</span>
                          <div className="flex-1">
                            <span className="font-semibold">
                              Balance Payment:{" "}
                            </span>
                            <span className="font-bold">
                              {formatCurrency(invoice.totalAmount)}
                            </span>
                            <span className="italic text-gray-600">
                              {" "}
                              (Due: Immediately)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="w-4 mr-2">-</span>
                          <div className="flex-1">
                            <span className="font-semibold">
                              Remaining Balance:{" "}
                            </span>
                            <span>Rp 0,-</span>
                            <span className="italic text-gray-600">
                              {" "}
                              (Fully Paid upon this settlement)
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  }

                  // === SCENARIO: INSTALLMENT (CICILAN) ===
                  if (invoice.category === "INSTALLMENT") {
                    return (
                      <>
                        {history.map((prev, i) => {
                          const isFirst = i === 0;
                          const label = isFirst
                            ? "1st Installment (Down Payment)"
                            : `${getOrdinal(i + 1)} Installment`;
                          return (
                            <div key={prev.id} className="flex items-start">
                              <span className="w-4 mr-2">-</span>
                              <div className="flex-1">
                                <span className="font-semibold">{label}: </span>
                                <span>{formatCurrency(prev.totalAmount)}</span>
                                <span className="italic text-gray-600">
                                  {prev.paidAt
                                    ? ` (Paid on ${format(new Date(prev.paidAt), "dd MMM yyyy", { locale: idLocale })})`
                                    : " (Unpaid)"}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Current Installment */}
                        <div className="flex items-start">
                          <span className="w-4 mr-2">-</span>
                          <div className="flex-1">
                            <span className="font-semibold">
                              {isFinal
                                ? "Final Installment (Balance Payment)"
                                : `${getOrdinal(history.length + 1)} Installment`}
                              :{" "}
                            </span>
                            <span className="font-bold">
                              {formatCurrency(invoice.totalAmount)}
                            </span>
                            <span className="italic text-gray-600">
                              (Due: Immediately)
                            </span>
                          </div>
                        </div>

                        {/* Remaining Balance */}
                        <div className="flex items-start">
                          <span className="w-4 mr-2">-</span>
                          <div className="flex-1">
                            <span className="font-semibold">
                              Remaining Balance:{" "}
                            </span>
                            <span>
                              {isFinal
                                ? "Rp 0,-"
                                : formatCurrency(remainingAfterThis)}
                            </span>
                            <span className="italic text-gray-600">
                              {isFinal
                                ? " (Fully Paid upon this settlement)"
                                : " (Due: As per Agreement)"}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

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
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
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
              disabled={isPaying}
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
