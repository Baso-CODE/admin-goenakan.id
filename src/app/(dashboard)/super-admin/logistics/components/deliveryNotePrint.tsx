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

export default function DeliveryNotePrint() {
  const { shipmentId } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // FETCH DATA SHIPMENT
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/logistics/shipments/${shipmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data surat jalan");
        const result = await res.json();
        setData(result.data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    if (shipmentId) fetchData();
  }, [shipmentId]);

  // === FUNCTION DOWNLOAD PDF ===
  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    try {
      setIsDownloading(true);
      toast.info("Sedang membuat PDF...");

      // 1. Generate Canvas dari DOM
      const canvas = await html2canvas(element, {
        scale: 2, // Tingkatkan scale agar teks tajam (High Resolution)
        useCORS: true, // Agar gambar external (logo/ttd) termuat
        backgroundColor: "#ffffff", // Pastikan background putih
      });

      // 2. Konversi Canvas ke Image Data
      const imgData = canvas.toDataURL("image/png");

      // 3. Setup PDF (A4 Portrait)
      const pdf = new jsPDF("p", "mm", "a4");

      // Ukuran A4 dalam mm
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Hitung dimensi gambar agar pas di lebar A4
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // 4. Masukkan Gambar ke PDF
      // Jika konten lebih panjang dari 1 halaman A4, logic-nya bisa ditambah (multi-page).
      // Untuk surat jalan standar biasanya cukup 1 halaman.
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

      // 5. Download File
      const fileName = `Surat_Jalan_${data?.deliveryNoteNumber || "Draft"}.pdf`;
      pdf.save(fileName.replace(/\//g, "-")); // Ganti slash dengan dash agar valid filename

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

  // --- PREPARE DATA VARIABLES ---
  const {
    deliveryNoteNumber,
    departureDate,
    trackingNumber,
    vendor,
    order,
    items,
    remarks,
    origin,
    destination,
  } = data;

  let receiverName = "-";
  let receiverAddress = destination || order.shippingAddress;
  let receiverPhone = "-";

  if (order.client?.b2b) {
    receiverName = order.client.b2b.companyName;
    receiverPhone = order.client.b2b.phone;
  } else if (order.client?.b2c) {
    receiverName = order.client.b2c.name;
    receiverPhone = order.client.b2c.phone;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* TOMBOL DOWNLOAD PDF (Fixed Position) */}
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

      {/* === KERTAS A4 (Target Reference) === */}
      {/* Container overflow-auto ini HANYA untuk preview di layar, 
          saat html2canvas bekerja dia akan merender full height */}
      <div className="flex justify-center overflow-auto px-4 pb-10 w-full">
        <div
          id="invoice-content"
          ref={invoiceRef}
          className="bg-white text-[#1e293b] font-sans text-[13px] leading-relaxed relative box-border shadow-xl"
          style={{
            width: "210mm", // Lebar A4 Pas
            minHeight: "297mm", // Tinggi A4 Minimal
            padding: "40mm 20mm", // Padding Kertas (Atas/Bawah 40mm, Kiri/Kanan 20mm agar rapi saat diprint)
            display: "flex",
            flexDirection: "column",
          }}>
          <div className="flex-1">
            {/* 1. HEADER IMAGE */}
            <div className="w-full mb-6 border-b-2 border-gray-800 pb-4">
              <img
                src="/images/invoice.png"
                alt="Header"
                className="w-full h-auto object-contain max-h-30"
                crossOrigin="anonymous" // Penting agar tidak CORS error saat generate canvas
              />
            </div>

            {/* 2. JUDUL & INFO UTAMA */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-extrabold uppercase tracking-widest mb-4 text-gray-900">
                  SURAT JALAN
                </h1>
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="font-semibold w-32 py-0.5">
                        No. Surat Jalan
                      </td>
                      <td className="font-bold uppercase py-0.5">
                        : {deliveryNoteNumber || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">Tanggal Kirim</td>
                      <td className="py-0.5">
                        :{" "}
                        {format(new Date(departureDate), "dd MMMM yyyy", {
                          locale: idLocale,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">No. PO (Ref)</td>
                      <td className="py-0.5">: {order.poNumber}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">Ekspedisi</td>
                      <td className="py-0.5 uppercase">
                        : {vendor?.companyName || "Internal Armada"}
                      </td>
                    </tr>
                    {trackingNumber && (
                      <tr>
                        <td className="font-semibold py-0.5">No. Resi</td>
                        <td className="py-0.5 uppercase">: {trackingNumber}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="w-[45%] border border-gray-300 p-4 rounded-sm bg-gray-50/50">
                <div className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2 border-b border-gray-200 pb-1">
                  Kepada Yth / Ship To:
                </div>
                <div className="font-bold text-base uppercase mb-1">
                  {receiverName}
                </div>
                <div className="text-xs text-gray-600 mb-2 whitespace-pre-line leading-relaxed">
                  {receiverAddress}
                </div>
                <div className="text-xs font-medium">Telp: {receiverPhone}</div>
              </div>
            </div>

            {/* 3. PRODUCT TABLE */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-[#94a3b8]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-center font-bold text-xs uppercase text-gray-700">
                    <th className="border border-[#94a3b8] py-2 w-12">No</th>
                    <th className="border border-[#94a3b8] py-2 w-32">
                      Kode Barang (SKU)
                    </th>
                    <th className="border border-[#94a3b8] py-2">
                      Nama Barang / Deskripsi
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-24">Qty</th>
                    <th className="border border-[#94a3b8] py-2 w-24">
                      Satuan
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-40">
                      Ceklis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    const product = item.orderProduct.product;
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="border border-[#94a3b8] py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-3 font-mono text-xs">
                          {product.sku || "-"}
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-3">
                          <div className="font-bold text-sm">
                            {product.name}
                          </div>
                          {item.orderProduct.customization && (
                            <div className="text-[10px] text-gray-500 mt-1 italic">
                              Spec: {item.orderProduct.customization}
                            </div>
                          )}
                        </td>
                        <td className="border border-[#94a3b8] py-2 text-center font-bold text-sm">
                          {item.quantity}
                        </td>
                        <td className="border border-[#94a3b8] py-2 text-center text-xs uppercase">
                          Pcs
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-2"></td>
                      </tr>
                    );
                  })}

                  {items.length < 5 &&
                    Array.from({ length: 5 - items.length }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-8">
                        <td className="border border-[#94a3b8]"></td>
                        <td className="border border-[#94a3b8]"></td>
                        <td className="border border-[#94a3b8]"></td>
                        <td className="border border-[#94a3b8]"></td>
                        <td className="border border-[#94a3b8]"></td>
                        <td className="border border-[#94a3b8]"></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 4. REMARKS */}
            <div className="mb-10">
              <div className="font-bold text-xs uppercase mb-1">
                Catatan (Remarks):
              </div>
              <div className="border border-gray-300 p-3 min-h-15 rounded-sm text-xs text-gray-600 bg-gray-50/30 whitespace-pre-wrap">
                {remarks || "Barang diterima dalam kondisi baik."}
              </div>
            </div>
          </div>

          {/* 5. FOOTER */}
          <div className="mt-auto break-inside-avoid">
            <div className="flex justify-between text-center px-4">
              <div className="flex flex-col items-center">
                <div className="mb-16 text-sm font-semibold">
                  Diterima Oleh,
                  <div className="text-[10px] font-normal text-gray-500">
                    (Tanda Tangan & Stempel)
                  </div>
                </div>
                <div className="border-b border-black w-40 mb-1"></div>
                <div className="text-xs">Nama Terang & Tanggal</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-16 text-sm font-semibold">
                  Pengirim / Driver,
                </div>
                <div className="border-b border-black w-40 mb-1"></div>
                <div className="text-xs">
                  ( ........................................ )
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 text-sm font-bold">Hormat Kami,</div>
                <div className="relative h-20 w-32 flex items-center justify-center -mb2.5">
                  {order.sales?.signatureUrl ? (
                    <img
                      src={order.sales.signatureUrl}
                      alt="Signature"
                      className="h-full w-auto object-contain opacity-80"
                      crossOrigin="anonymous" // Penting!
                    />
                  ) : (
                    <div className="h-16 w-full"></div>
                  )}
                </div>
                <div className="font-bold underline text-sm mt-1">
                  Goenakan Indonesia
                </div>
                <div className="text-[10px] font-bold text-[#475569]">
                  Logistic Dept.
                </div>
              </div>
            </div>

            <div className="mt-8 text-[10px] text-center text-gray-400 italic">
              * Surat Jalan ini merupakan bukti sah penerimaan barang. Harap
              disimpan sebagai arsip.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
