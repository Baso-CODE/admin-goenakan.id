"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { FileDown, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import QuotationNoteContent from "../notes/components/quotationContent/quotationNoteContent";

export default function QuotationPrint() {
  const { fetchApi, status } = useApi();
  const params = useParams();
  const quotationId = params?.quotationId;

  const invoiceRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !quotationId)
      return;

    try {
      setLoading(true);

      const res = await fetchApi(`/quotations/print/${quotationId}`);

      if (!res.ok) throw new Error("Gagal mengambil data quotation");

      const result = await res.json();
      setData(result.data || result);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [quotationId, status, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === UTILS: FORMAT CURRENCY DINAMIS ===
  const formatDynamicCurrency = (amount: string | number) => {
    const code = data?.currencyCode || "IDR";
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
    }).format(numericAmount);
  };

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element || isDownloading) return;

    try {
      setIsDownloading(true);
      toast.info("Sedang membuat PDF quotation...");

      // Pastikan gambar dan font selesai dimuat sebelum membuat PDF.
      await document.fonts.ready;

      await Promise.all(
        Array.from(element.querySelectorAll("img")).map(async (img) => {
          if (img.complete) return;

          await new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      );

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: Math.max(window.innerWidth, element.scrollWidth),
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      // Lebar gambar mengikuti kertas A4.
      const pageWidthPx = canvas.width;
      const pageHeightPx = Math.floor((canvas.width * pdfHeight) / pdfWidth);

      // Konversi posisi elemen HTML ke koordinat canvas.
      const elementRect = element.getBoundingClientRect();
      const scaleY = canvas.height / elementRect.height;

      // Titik aman untuk memisahkan halaman:
      // awal baris produk, notes, dan footer.
      const breakElements = element.querySelectorAll(
        "tbody tr[data-pdf-row], [data-pdf-section]",
      );

      const safeBreaks = Array.from(breakElements)
        .map((node) => {
          const rect = node.getBoundingClientRect();

          return Math.floor((rect.top - elementRect.top) * scaleY);
        })
        .filter((position) => position > 0 && position < canvas.height)
        .sort((a, b) => a - b);

      const pageStarts: number[] = [0];
      let currentY = 0;

      while (currentY < canvas.height) {
        const targetY = Math.min(currentY + pageHeightPx, canvas.height);

        if (targetY >= canvas.height) break;

        // Beri ruang 8 mm sebelum batas kertas.
        const safetyMarginPx = Math.floor((canvas.width * 8) / pdfWidth);

        // Usahakan pindah halaman sebelum baris produk.
        const candidates = safeBreaks.filter(
          (position) =>
            position > currentY + pageHeightPx * 0.35 &&
            position <= targetY - safetyMarginPx,
        );

        const nextY =
          candidates.length > 0 ? candidates[candidates.length - 1] : targetY;

        // Pengaman agar loop tidak berjalan tanpa akhir.
        if (nextY <= currentY) break;

        pageStarts.push(nextY);
        currentY = nextY;
      }

      for (let index = 0; index < pageStarts.length; index++) {
        const startY = pageStarts[index];

        const endY =
          index + 1 < pageStarts.length ? pageStarts[index + 1] : canvas.height;

        const sliceHeight = endY - startY;

        if (sliceHeight <= 0) continue;

        const pageCanvas = document.createElement("canvas");

        pageCanvas.width = pageWidthPx;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");

        if (!ctx) {
          throw new Error("Gagal membuat canvas halaman PDF.");
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        ctx.drawImage(
          canvas,
          0,
          startY,
          pageWidthPx,
          sliceHeight,
          0,
          0,
          pageWidthPx,
          sliceHeight,
        );

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.82);

        const imgHeight = (sliceHeight * pdfWidth) / pageWidthPx;

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          0,
          pdfWidth,
          imgHeight,
          undefined,
          "FAST",
        );

        // Bersihkan canvas sementara.
        pageCanvas.width = 0;
        pageCanvas.height = 0;
      }

      const fileName =
        `Quotation_${data?.quotationNumber || "Draft"}.pdf`.replace(
          /[\\/:"*?<>|]/g,
          "-",
        );

      pdf.save(fileName);

      toast.success(`PDF berhasil dibuat (${pdf.getNumberOfPages()} halaman).`);
    } catch (error) {
      console.error("[Quotation PDF Error]", error);
      toast.error("Gagal membuat PDF quotation.");
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
  // PREPARE VARIABLES
  // =========================================================

  const salesName =
    data.sales?.name || data.createdBy?.name || "Goenakan Admin";
  const salesPhone = data.sales?.phone || "+62 888-0370-1081";
  const salesEmail =
    data.sales?.email || data.createdBy?.email || "goenakan.id@gmail.com";
  const signatureUrl = data.sales?.signatureUrl;

  let clientCompany = data.manualClientCompany || data.manualClientName || "-";
  let clientDept = "-";
  let clientPic = data.manualClientName || "-";
  let clientAddress = data.manualClientAddress || "-";
  let clientPhone = data.manualClientPhone || "-";

  if (data.client?.b2b) {
    clientCompany = data.client.b2b.companyName;
    clientDept = data.client.b2b.department?.name || "-";
    clientAddress = data.client.b2b.fullAddress || clientAddress;
    clientPhone = data.client.b2b.phone || clientPhone;

    if (data.pic) {
      const prefix = data.pic.prefix ? `${data.pic.prefix} ` : "";
      clientPic = `${prefix}${data.pic.name}`;
      if (data.pic.phone) {
        clientPhone = data.pic.phone;
      }
    }
  } else if (data.client?.b2c) {
    clientCompany = data.client.b2c.name;
    clientPic = "Personal";
    clientAddress = data.client.b2c.fullAddress || clientAddress;
    clientPhone = data.client.b2c.phone || clientPhone;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
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
            {/* 1. KOP SURAT */}
            <div className="w-full mb-8 border-b-2 border-gray-800 pb-4">
              <img
                src="/images/quotation-header.png"
                alt="Kop Surat Quotation"
                className="w-full h-auto object-contain max-h-32"
                crossOrigin="anonymous"
              />
            </div>
            {/* 2. HEADER INFO */}
            <div className="flex justify-between items-start mb-6 text-[12px] text-gray-900">
              <div className="flex flex-col">
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
                      <td className="py-0.5 pr-4 align-top">Valid Until</td>
                      <td className="py-0.5 align-top font-medium">
                        :{" "}
                        {data.validUntil
                          ? format(new Date(data.validUntil), "dd MMMM yyyy", {
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
                        : {data.currencyCode || "IDR"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* 3. CUSTOMER INFO */}
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
                    <td className="py-0.5 align-top">Phone</td>
                    <td className="py-0.5 align-top font-medium">
                      : {clientPhone}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Address</td>
                    <td className="py-0.5 align-top pr-4">: {clientAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* 4. PRODUCT TABLE UTAMA */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-white text-center font-bold text-[11px] text-gray-900 border-b border-gray-800">
                    <th className="border-r border-gray-800 py-2 w-32">
                      Product Detail
                    </th>
                    <th className="border-r border-gray-800 py-2">
                      Product Specification
                    </th>
                    <th className="border-r border-gray-800 py-2 w-20">Qty</th>
                    <th className="py-2 w-32">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((item: any, index: number) => {
                    const imageUrl = item.imageUrl;
                    const itemQty = Number(item.quantity) || 0;
                    const itemPrice = Number(item.unitPrice) || 0;
                    const tiers = Array.isArray(item.tiers) ? item.tiers : [];
                    const hasTiers = tiers.length > 0;
                    const basePrice = item.product?.basePrice
                      ? Number(item.product.basePrice)
                      : null;

                    return (
                      <tr
                        key={item.id || index}
                        data-pdf-row
                        className="align-top text-[11px] border-b border-gray-800">
                        {/* Kolom 1: Product Detail (Hanya Gambar & Link URL) */}
                        <td className="border-r border-gray-800 p-2 text-center align-top">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className="w-24 h-24 object-contain mx-auto"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="text-gray-400 italic text-[9px] mt-8">
                              No Image
                            </div>
                          )}

                          {item.product?.slug && (
                            <a
                              href={`https://goenakan.id/en/products/${item.product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 block text-[9px] text-blue-600 hover:underline">
                              View Product Page
                            </a>
                          )}
                        </td>

                        {/* Kolom 2: Product Specification */}
                        {/*  PERBAIKAN JARAK: align-top dan class margin diperkecil */}
                        <td className="border-r border-gray-800 p-3 align-top text-gray-800">
                          <div className="font-bold text-[12px] mb-1">
                            {item.productName}
                          </div>

                          {/* Spesifikasi (Deskripsi & Customization Manual) */}
                          {/* <div className="space-y-0.5 text-[10px]">
                            {item.customization &&
                            typeof item.customization === "object" ? (
                              Object.entries(item.customization).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span>{" "}
                                    {String(value)}
                                  </div>
                                ),
                              )
                            ) : item.customization ? (
                              <div className="whitespace-pre-line">
                                {item.customization}
                              </div>
                            ) : null}

                            {item.description && (
                              <div className="whitespace-pre-line mt-1">
                                {item.description}
                              </div>
                            )}
                          </div> */}

                          {/* Attributes Available / Selected */}
                          {item.product?.availableAttributes?.map(
                            (attr: any, attrIdx: number) => {
                              return (
                                <div
                                  key={attrIdx}
                                  className="mt-1 text-[10px] text-gray-700">
                                  {attr.hasSelection
                                    ? `${attr.attributeName} : `
                                    : `Available in ${attr.attributeName} : `}

                                  {attr.values.map((v: any, vIdx: number) => (
                                    <span key={v.valueId}>
                                      {v.value}
                                      {vIdx < attr.values.length - 2 && ", "}
                                      {vIdx === attr.values.length - 2 &&
                                        " and "}
                                    </span>
                                  ))}
                                </div>
                              );
                            },
                          )}

                          {/* Remarks */}
                          {item.remarks && (
                            <div className="mt-2 text-[10px] italic text-gray-500 bg-gray-50 p-1.5 rounded">
                              <span className="font-semibold text-gray-700 not-italic">
                                Note:{" "}
                              </span>
                              {item.remarks}
                            </div>
                          )}
                        </td>

                        {/* Kolom 3: Qty */}
                        <td className="border-r border-gray-800 p-3 text-center align-top font-medium text-[11px]">
                          {basePrice !== null && item.isPriceStartFrom && (
                            <div className="text-[10px] mb-1.5 pb-1 border-b border-transparent invisible">
                              Start from:
                              <div>{formatDynamicCurrency(basePrice)}</div>
                            </div>
                          )}

                          {hasTiers ? (
                            <div className="flex flex-col">
                              {tiers.map((tier: any, index: number) => (
                                <div
                                  key={tier.id || index}
                                  className="min-h-7 flex items-center justify-center whitespace-nowrap">
                                  {tier.quantityRange ||
                                    (tier.maxQuantity != null
                                      ? `${tier.minQuantity}-${tier.maxQuantity} unit`
                                      : `${tier.minQuantity}+ unit`)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>{itemQty} unit</div>
                          )}
                        </td>

                        {/* Kolom 4: Unit Price */}
                        <td className="p-3 text-center align-top font-medium text-gray-800 text-[11px]">
                          {basePrice !== null && item.isPriceStartFrom && (
                            <div className="text-[10px] text-gray-500 mb-1.5 pb-1 border-b border-gray-300">
                              Start from:
                              <div className="font-medium text-gray-800">
                                {formatDynamicCurrency(basePrice)}
                              </div>
                            </div>
                          )}

                          {hasTiers ? (
                            <div className="flex flex-col">
                              {tiers.map((tier: any, index: number) => (
                                <div
                                  key={tier.id || index}
                                  className="min-h-7 flex items-center justify-center whitespace-nowrap">
                                  {formatDynamicCurrency(tier.unitPrice)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>{formatDynamicCurrency(itemPrice)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* 5. NOTES */}
            <div data-pdf-section className="mb-10">
              <div className="font-bold text-[13px] uppercase mb-2 text-gray-800 border-b border-gray-800 inline-block pb-0.5">
                Notes
              </div>

              <div className="text-[11px] text-gray-700 leading-relaxed">
                {data.notes?.some(
                  (note: any) => note.category?.isPublic === true,
                ) ? (
                  <div className="space-y-3">
                    {data.notes
                      .filter((note: any) => note.category?.isPublic === true)
                      .map((note: any) => (
                        <div key={note.id} className="break-inside-avoid">
                          <QuotationNoteContent content={note.content} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="italic text-gray-400">Tidak ada catatan.</p>
                )}
              </div>
            </div>
          </div>

          {/* 6. FOOTER */}
          <div data-pdf-section className="mt-auto break-inside-avoid pt-4">
            <div className="flex justify-end text-center px-4">
              <div className="flex flex-col items-center">
                <div className="mb-4 text-[12px] font-medium">
                  Best Regards,
                </div>
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
