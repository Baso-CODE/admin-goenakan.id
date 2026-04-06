"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchWithToken } from "@/app/(dashboard)/super-admin/orders/order-service";
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
import { apiUrl } from "@/helper/apiurl";
import { renderCustomization } from "@/helper/renderCustomizationProduct";
import { toast } from "sonner";

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
  order: {
    poNumber: string;
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
  // [UPDATE] Notes Field
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

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const invoiceRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithToken(`${apiUrl}/invoices/${id}`);
      setInvoice(res);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    setIsDownloading(true);
    try {
      const images = element.querySelectorAll("img");
      const promises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(promises);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("invoice-content");
          if (clonedElement) {
            clonedElement.style.boxShadow = "none";
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      const fileName = `Invoice-${invoice?.invoiceNumber || invoice?.id}.pdf`;
      pdf.save(fileName);
      toast.success("Berhasil download PDF");
    } catch (error) {
      console.error("Failed to download PDF", error);
      toast.error("Gagal mendownload PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    setIsPaying(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/invoices/${invoice.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: paymentMethod,
          paymentDate: new Date(paymentDate).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Gagal memproses pembayaran");

      toast.success("Invoice berhasil ditandai LUNAS");
      setIsPayDialogOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat update pembayaran");
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
  const paymentBillingDate = invoice.paymentDate
    ? new Date(invoice.paymentDate)
    : createdDate;
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
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
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
          className="w-[210mm] h-[297mm] bg-[#ffffff] text-[#1e293b] p-10 flex flex-col font-sans text-[13px] leading-relaxed relative box-border transform scale-90 md:scale-100 origin-top"
          style={{
            width: "210mm",
            minHeight: "297mm", // Gunakan minHeight agar bisa memanjang jika konten banyak (opsional, untuk print html2canvas lebih aman fix height)
            height: "auto", // Auto agar fleksibel saat preview, tapi saat print PDF nanti diatur
            padding: "40px",
            display: "flex",
            flexDirection: "column",
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
            <div className="mb-8">
              <table className="">
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
            <div className="mb-4">
              <table className="w-full border-collapse border border-[#94a3b8]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-center font-bold">
                    <th className="border border-[#94a3b8] py-2 w-10">No</th>
                    <th className="border border-[#94a3b8] py-2">
                      Product Description
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-20">Qty</th>
                    <th className="border border-[#94a3b8] py-2 w-32.5">
                      Unit Price
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-32.5">
                      Total
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-32.5">
                      Total Billed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const isFirst = index === 0;
                    const rowCount = invoice.items.length;
                    return (
                      <tr key={item.id} className="text-center align-top h-15">
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
                        {isFirst && (
                          <td
                            className="border border-[#94a3b8] py-3 px-3 align-top bg-[#f9fafb]"
                            rowSpan={rowCount}>
                            <div className="flex flex-col items-end">
                              {/* Nominal Total */}
                              <span className="font-bold text-[14px] text-gray-900">
                                {formatCurrency(Number(invoice.totalAmount))}
                              </span>

                              {/* Garis Pemisah Tipis */}
                              <div className="w-full border-t border-dashed border-[#cbd5e1] my-2"></div>

                              {/* Badge Kategori */}
                              <div className="text-[9px] font-bold text-[#475569] uppercase bg-white border border-[#cbd5e1] px-2 py-1 rounded shadow-sm mb-2.5">
                                {invoice.category.replace("_", " ")}
                              </div>

                              {/* Tanggal Tagihan (Bill Date) */}
                              <div className="text-right text-[10px] leading-tight">
                                <span className="text-gray-400 font-normal">
                                  Bill Date:
                                </span>
                                <br />
                                <span className="font-semibold text-gray-700">
                                  {format(paymentBillingDate, "dd MMM yyyy", {
                                    locale: idLocale,
                                  })}
                                </span>
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. [NEW] INVOICE NOTES SECTION */}
            {invoice.notes && invoice.notes.length > 0 && (
              <div className="mb-8 mt-6">
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
          <div className="mt-auto  break-inside-avoid">
            <div className="flex justify-end items-end">
              {/* <div className="text-[12px] leading-tight">
                <div className="font-bold mb-2 underline">Bank Account:</div>
                <div className="space-y-1">
                  {salesData.bankAccounts &&
                  salesData.bankAccounts.length > 0 ? (
                    salesData.bankAccounts.map((bank, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="w-24 font-semibold">
                          {bank.bankName}
                        </span>
                        <span>
                          : {bank.accountNumber} a/n {bank.accountHolderName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="italic text-gray-500">
                      No bank account details available.
                    </div>
                  )}
                </div>
              </div> */}

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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-green-600 text-green-600 text-6xl font-black p-4 rotate-[-15deg] opacity-30 select-none pointer-events-none rounded-lg">
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
