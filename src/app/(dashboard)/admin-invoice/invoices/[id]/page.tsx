"use client";

import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Sesuaikan path import ini
import { fetchWithToken } from "@/app/(dashboard)/super-admin/orders/order-service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// === TYPES ===
type InvoiceDetail = {
  id: string;
  category: "DP" | "FULL_PAYMENT" | "INSTALLMENT" | "REMAINING_BALANCE";
  status: string;
  createdAt: string;
  totalAmount: number;
  order: { poNumber: string };
  client: {
    type: "B2B" | "B2C";
    b2b?: {
      companyName: string;
      fullAddress: string;
      department?: { name: string };
      pics?: { name: string; phone: string }[];
    };
    b2c?: {
      name: string;
      fullAddress: string;
      phone: string;
    };
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; description?: string };
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

  // Ref untuk element yang akan di-capture jadi PDF
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchWithToken(
          `http://localhost:8000/invoices/${id}`
        );
        setInvoice(res);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data invoice");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // === HANDLER DOWNLOAD PDF ===
  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    setIsDownloading(true);
    try {
      // Tunggu gambar load
      const images = element.querySelectorAll("img");
      const promises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(promises);

      // 1. Convert HTML ke Canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff",
        // Opsi ini membantu membersihkan style aneh saat cloning
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("invoice-content");
          if (clonedElement) {
            // Paksa hapus shadow di elemen clone jika masih menempel
            clonedElement.style.boxShadow = "none";
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      // 2. Setup PDF (A4)
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 3. Masukkan Gambar ke PDF
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // 4. Download
      const fileName = `Invoice-${invoice?.order.poNumber || "doc"}.pdf`;
      pdf.save(fileName);
      toast.success("Berhasil download PDF");
    } catch (error) {
      console.error("Failed to download PDF", error);
      toast.error("Gagal mendownload PDF (Cek Console)");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    );
  if (!invoice) return <div>Invoice not found</div>;

  // --- LOGIC DATA PREPARATION ---
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

  const departmentName = isB2B ? invoice.client.b2b?.department?.name : null;

  const invoiceDate = new Date(invoice.createdAt);
  const monthRoman = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ][invoiceDate.getMonth()];
  const invoiceNo = `INV/${invoice.id
    .substring(0, 5)
    .toUpperCase()}/B0034/${monthRoman}/${invoiceDate.getFullYear()}`;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      {/* HEADER ACTIONS */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center px-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="bg-slate-900 hover:bg-slate-800 text-white">
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download PDF
        </Button>
      </div>

      {/* === KERTAS A4 (TARGET REF) === */}
      <div className="flex justify-center overflow-auto">
        <div
          id="invoice-content"
          ref={invoiceRef}
          // HAPUS shadow-xl DI SINI.
          // shadow-xl sering menggunakan variable --tw-shadow-color yang berisi "oklch"
          className="w-[210mm] h-[297mm] bg-[#ffffff] text-[#1e293b] p-10 flex flex-col font-sans text-[13px] leading-relaxed relative box-border"
          style={{
            width: "210mm",
            height: "297mm",
            minWidth: "210mm",
            minHeight: "297mm",
            // Jika ingin bayangan di layar tapi tidak error di PDF:
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}>
          {/* BAGIAN ATAS (Header & Content) */}
          <div className="flex-1">
            {/* 1. HEADER (GAMBAR) */}
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
              <table className="text-right">
                <tbody>
                  <tr>
                    <td className="w-25 font-medium pr-2 text-left">Phone</td>
                    <td className="text-left">: +62 888-0370-1081 (Nadya)</td>
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
                      : {format(invoiceDate, "dd MMMM yyyy")}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium pr-2 text-left">Invoice No.</td>
                    <td className="text-left uppercase">: {invoiceNo}</td>
                  </tr>
                  <tr>
                    <td className="font-medium pr-2 text-left">Currency</td>
                    <td className="text-left">: IDR</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. CUSTOMER DETAILS */}
            <div className="mb-8">
              <div className="font-bold mb-2 text-sm uppercase tracking-wide">
                Customer
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
                    <tr>
                      <td className="font-medium align-top py-0.5">
                        Department
                      </td>
                      <td className="align-top py-0.5">
                        : {departmentName || "-"}{" "}
                        {picName ? `(UP: Mr./Ms. ${picName})` : ""}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-medium align-top py-0.5">PO No.</td>
                    <td className="align-top py-0.5">
                      : {invoice.order.poNumber}
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
                    <th className="border border-[#94a3b8] py-2">Product</th>
                    <th className="border border-[#94a3b8] py-2 w-20">
                      Qty (pcs)
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-32.5">
                      Unit Price
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-32.5">
                      Total
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-32.5">
                      Total Order
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
                          <div className="text-[#475569] text-[11px]">
                            Capacity: 30 ml
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

                        {/* Kolom Total Order */}
                        {isFirst && (
                          <td
                            className="border border-[#94a3b8] py-2 text-right px-2 font-bold align-top pt-4 bg-[#f9fafb]"
                            rowSpan={rowCount}>
                            {formatCurrency(Number(invoice.totalAmount))}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* End Flex-1 */}

          {/* BAGIAN BAWAH */}
          <div className="mt-auto">
            <div className="flex justify-between items-end">
              {/* Bank Accounts */}
              <div className="text-[12px] leading-tight">
                <div className="font-bold mb-2 underline">Bank Account:</div>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="w-22.5 font-semibold">BTPN (Jenius)</span>
                    <span>
                      : 900-137-56-327 a/n Nadya Yuniar Desi Prameswari
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-22.5 font-semibold">BCA</span>
                    <span>: 5550243611 a/n Nadya Yuniar Desi Prameswari</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-22.5 font-semibold">Mandiri</span>
                    <span>
                      : 1400016940257 a/n Nadya Yuniar Desi Prameswari
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="text-center mr-6">
                <div className="mb-4 font-bold text-sm">Best Regards,</div>
                <div className="relative h-20 w-37.5 flex items-center justify-center">
                  <img
                    src="/images/ttd.png"
                    alt="Signature"
                    className="h-full w-auto object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="font-bold underline text-sm mt-1">
                  Nadya Y. D. Prameswari
                </div>
                <div className="text-[11px] font-bold text-[#475569]">
                  Goenakan Indonesia
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
