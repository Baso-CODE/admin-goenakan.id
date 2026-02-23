"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { FileDown, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";

// Helper Format Uang (Bisa disesuaikan jika ingin multi-currency)
const formatCurrency = (amount: string | number) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numericAmount);
};

export default function QuotationPrint() {
  const { quotationId } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  console.log("ini adalah data", data);

  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // FETCH DATA QUOTATION
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Panggil endpoint API quotation (sesuaikan path API Anda jika berbeda)
        const res = await fetch(`${apiUrl}/quotations/print/${quotationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data quotation");

        const result = await res.json();
        // Tergantung response API, jika dibungkus "data", gunakan result.data
        setData(result.data || result);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    if (quotationId) fetchData();
  }, [quotationId]);

  // === FUNCTION DOWNLOAD PDF ===
  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    try {
      setIsDownloading(true);
      toast.info("Sedang membuat PDF...");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = 210;
      const pdfHeight = 297;

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

      const fileName = `Quotation_${data?.quotationNumber || "Draft"}.pdf`;
      pdf.save(fileName.replace(/\//g, "-"));

      toast.success("PDF Berhasil didownload!");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Gagal membuat PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) return <div>Data tidak ditemukan</div>;

  // =========================================================
  // PREPARE DYNAMIC VARIABLES DARI API
  // =========================================================

  // 1. Sales Data
  const salesName = data.order?.sales?.name || "Goenakan Admin";
  const salesPhone = data.order?.sales?.phone || "+62 888-0370-1081";
  const salesEmail = "goenakan.id@gmail.com"; // Email general atau opsional dari data user
  const signatureUrl = data.order?.sales?.signatureUrl;

  // 2. Client Data (Bisa dari B2B, B2C, atau Input Manual)
  let clientCompany = data.manualClientCompany || data.manualClientName || "-";
  let clientDept = "-";
  let clientPic = data.manualClientName || "-";
  let clientAddress = data.manualClientAddress || "-";

  if (data.client?.b2b) {
    clientCompany = data.client.b2b.companyName;
    clientDept = data.client.b2b.department?.name || "-";
    clientAddress = data.client.b2b.fullAddress || clientAddress;
    if (data.order?.pic) {
      clientPic = `${data.order.pic.prefix ? data.order.pic.prefix + " " : ""}${data.order.pic.name}`;
    }
  } else if (data.client?.b2c) {
    clientCompany = data.client.b2c.name;
    clientPic = "Personal";
    clientAddress = data.client.b2c.fullAddress || clientAddress;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* TOMBOL DOWNLOAD PDF */}
      <div className="fixed top-5 right-5 z-50">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="shadow-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isDownloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      {/* KERTAS A4 */}
      <div className="flex justify-center overflow-auto px-4 pb-10 w-full">
        <div
          id="invoice-content"
          ref={invoiceRef}
          className="bg-white text-[#1e293b] font-sans text-[13px] leading-relaxed relative box-border shadow-xl"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "15mm 15mm",
            display: "flex",
            flexDirection: "column",
          }}>
          <div className="flex-1">
            {/* ========================================================= */}
            {/* 1. KOP SURAT (IMAGE FULL WIDTH) */}
            {/* ========================================================= */}
            <div className="w-full mb-8 border-b-2 border-gray-800 pb-4">
              <img
                src="/images/quotation-header.png"
                alt="Kop Surat Quotation"
                className="w-full h-auto object-contain max-h-32"
                crossOrigin="anonymous"
              />
            </div>

            {/* ========================================================= */}
            {/* 2. HEADER INFO & TITLE */}
            {/* ========================================================= */}
            <div className="flex justify-between items-start mb-6 text-[12px] text-gray-900">
              <div className="flex flex-col ">
                <table className="text-[12px] text-left">
                  <tbody>
                    <tr>
                      <td className="py-0.5 pr-4 align-top w-20">Phone</td>
                      <td className="py-0.5 align-top font-medium">
                        : {salesPhone} ({salesName.split(" ")[0]})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top">E-mail</td>
                      <td className="py-0.5 align-top font-medium">
                        : {salesEmail}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top">Qtn Date</td>
                      <td className="py-0.5 align-top font-medium">
                        :{" "}
                        {data.date
                          ? format(new Date(data.date), "dd MMMM yyyy", {
                              locale: idLocale,
                            })
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top">Qtn No.</td>
                      <td className="py-0.5 align-top font-bold">
                        : {data.quotationNumber}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top">Currency</td>
                      <td className="py-0.5 align-top font-bold text-blue-600">
                        : IDR{" "}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. CUSTOMER INFO */}
            {/* ========================================================= */}
            <div className="mb-8 w-[60%] border border-gray-300 p-4 rounded-sm bg-gray-50/50">
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
                Customer
              </h2>
              <table className="text-[12px] w-full text-gray-900">
                <tbody>
                  <tr>
                    <td className="py-0.5 w-24 align-top">Name</td>
                    <td className="py-0.5 align-top font-bold uppercase">
                      : {clientCompany}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Department</td>
                    <td className="py-0.5 align-top">
                      : {clientDept !== "-" ? `${clientDept} ` : ""}
                      {clientPic !== "-" ? `(UP: ${clientPic})` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Address</td>
                    <td className="py-0.5 align-top pr-4">: {clientAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================= */}
            {/* 4. PRODUCT TABLE */}
            {/* ========================================================= */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-[#94a3b8]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-center font-bold text-[11px] uppercase text-gray-700">
                    <th className="border border-[#94a3b8] py-2 w-56">
                      Product Detail
                    </th>
                    <th className="border border-[#94a3b8] py-2">
                      Product Specification
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-20">Qty</th>
                    <th className="border border-[#94a3b8] py-2 w-32">
                      Unit Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((item: any) => {
                    const imageUrl = item.product?.images?.[0]?.url;

                    return (
                      <tr key={item.id} className="align-top text-[12px]">
                        <td className="border border-[#94a3b8] py-2 px-3">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                            {imageUrl && (
                              <div className="shrink-0">
                                <img
                                  src={imageUrl}
                                  alt={item.productName}
                                  className="w-14 h-14 object-cover rounded shadow-sm border border-gray-200"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            )}
                            <div className="font-bold text-gray-800 mt-1">
                              {item.productName}
                            </div>
                          </div>
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-3 text-gray-700">
                          {item.description || "-"}{" "}
                          {item.customization && (
                            <div className="text-[10px] italic text-gray-500 mt-1">
                              Spec: {item.customization}
                            </div>
                          )}
                          {item.product.description}
                        </td>
                        <td className="border border-[#94a3b8] py-2 text-center font-semibold">
                          {item.quantity}
                        </td>
                        <td className="border border-[#94a3b8] py-2 text-right px-4 font-mono font-medium">
                          {formatCurrency(item.unitPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ========================================================= */}
            {/* 5. NOTES & TERMS */}
            {/* ========================================================= */}
            <div className="mb-10">
              <div className="font-bold text-[13px] uppercase mb-2 text-gray-800 border-b border-gray-800 inline-block pb-0.5">
                Notes
              </div>
              <div className="text-[11px] text-gray-700 leading-relaxed">
                {data.notes && data.notes.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1.5">
                    {data.notes.map((note: any) => (
                      <li key={note.id} className="pl-1">
                        {note.content}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-gray-400">Tidak ada catatan.</p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. FOOTER (Tanda Tangan) */}
          {/* ========================================================= */}
          <div className="mt-auto break-inside-avoid pt-4">
            <div className="flex justify-end text-center px-4">
              <div className="flex flex-col items-center">
                <div className="mb-4 text-[12px] font-medium">
                  Best Regards,
                </div>

                {/* Space for Signature */}
                <div className="h-20 w-32 flex items-center justify-center -mb-2">
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="h-full w-auto object-contain opacity-80"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-16 w-full"></div>
                  )}
                </div>

                <div className="font-bold text-[12px] underline mt-1">
                  {salesName}
                </div>
                <div className="text-[10px] font-bold text-[#475569]">
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
