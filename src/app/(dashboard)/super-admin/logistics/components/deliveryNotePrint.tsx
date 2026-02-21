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

        // Pastikan endpoint backend ini (getShipmentById) mereturn relasi B2BPIC dan Department
        // sesuai dengan query Prisma yang Anda berikan.
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

      const fileName = `Surat_Jalan_${data?.deliveryNoteNumber || "Draft"}.pdf`;
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

  // --- PREPARE DATA VARIABLES ---
  const {
    deliveryNoteNumber,
    departureDate,
    order,
    items,
    remarks,
    destination,
  } = data;

  // Setup Variabel Penerima
  let receiverCompany = "-";
  let receiverAddress = destination || order.shippingAddress;
  let picName = "-";
  let picDept = "-";
  let picPhone = "-";

  // Ekstrak data dari struktur relasi backend
  if (order.client?.b2b) {
    receiverCompany = order.client.b2b.companyName;

    // Ambil detail PIC dari order (berdasarkan schema: Order -> clientB2BPIC -> b2b -> dept)
    if (order.pic) {
      picName = `${order.pic.prefix ? order.pic.prefix + " " : ""}${order.pic.name}`;
      picPhone = order.pic.phone || order.client.b2b.phone || "-";
      picDept = order.client.b2b.department?.name || "-";
    } else {
      // Fallback jika tidak ada PIC spesifik di order
      picPhone = order.client.b2b.phone || "-";
      picDept = order.client.b2b.department?.name || "-";
    }
  } else if (order.client?.b2c) {
    receiverCompany = order.client.b2c.name;
    picName = "Personal";
    picPhone = order.client.b2c.phone || "-";
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

      <div className="flex justify-center overflow-auto px-4 pb-10 w-full">
        <div
          id="invoice-content"
          ref={invoiceRef}
          className="bg-white text-[#1e293b] font-sans text-[13px] leading-relaxed relative box-border shadow-xl"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm 10mm",
            display: "flex",
            flexDirection: "column",
          }}>
          <div className="flex-1">
            {/* 1. HEADER IMAGE KOP SURAT */}
            <div className="w-full mb-6 border-b-2 border-gray-800 pb-4">
              <img
                src="/images/surat-jalan-header.png"
                alt="Kop Surat"
                className="w-full h-auto object-contain max-h-30"
              />
            </div>

            {/* 2. JUDUL & INFO UTAMA */}
            <div className="flex justify-between items-start mb-8 gap-4">
              {/* Kolom Kiri: Info Surat Jalan */}
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold uppercase tracking-widest mb-4 text-gray-900">
                  SURAT JALAN
                </h1>
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="font-semibold w-32 py-0.5 align-top">
                        No. Surat Jalan
                      </td>
                      <td className="font-bold uppercase py-0.5 align-top">
                        : {deliveryNoteNumber || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold w-32 py-0.5 align-top">
                        Tanggal Kirim
                      </td>
                      <td className="py-0.5 align-top">
                        :{" "}
                        {format(new Date(departureDate), "dd MMMM yyyy", {
                          locale: idLocale,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold w-32 py-0.5 align-top">
                        No. PO (Ref)
                      </td>
                      <td className="py-0.5 align-top">: {order.poNumber}</td>
                    </tr>
                    {/* Ekspedisi & Resi di-takeout sesuai request */}
                  </tbody>
                </table>
              </div>

              {/* Kolom Kanan: Info Penerima (Kepada Yth) */}
              <div className="w-[50%] border border-gray-300 p-4 rounded-sm bg-gray-50/50">
                <div className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2 border-b border-gray-200 pb-1">
                  Kepada Yth / Ship To:
                </div>

                {/* Nama Perusahaan / Instansi */}
                <div className="font-bold text-base uppercase mb-1">
                  {receiverCompany}
                </div>

                {/* Alamat Lengkap */}
                <div className="text-xs text-gray-700 mb-3 whitespace-pre-line leading-relaxed">
                  {receiverAddress}
                </div>

                {/* Detail PIC */}
                <div className="bg-white p-2 border border-gray-200 rounded text-[11px]">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="text-gray-500 w-24 pb-1">Attn (PIC)</td>
                        <td className="font-semibold pb-1">: {picName}</td>
                      </tr>
                      {picDept !== "-" && (
                        <tr>
                          <td className="text-gray-500 w-24 pb-1">
                            Departemen
                          </td>
                          <td className="pb-1">: {picDept}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-gray-500 w-24">No. HP / Telp</td>
                        <td className="font-medium">: {picPhone}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. PRODUCT TABLE */}
            {/* Kolom 'Satuan' dan 'Ceklis' dihapus sesuai request */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-[#94a3b8]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-center font-bold text-xs uppercase text-gray-700">
                    <th className="border border-[#94a3b8] py-2 w-12">No</th>
                    <th className="border border-[#94a3b8] py-2 w-40">
                      Kode Barang (SKU)
                    </th>
                    <th className="border border-[#94a3b8] py-2">
                      Nama Barang / Deskripsi
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-24">Qty</th>
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
                        <td className="border border-[#94a3b8] py-2 px-3 font-mono text-xs text-center">
                          {product.sku || "-"}
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-3">
                          <div className="font-bold text-sm text-gray-800">
                            {product.name}
                          </div>
                          {item.orderProduct.customization && (
                            <div className="text-[10px] text-gray-500 mt-1 italic leading-tight">
                              Spec: {item.orderProduct.customization}
                            </div>
                          )}
                        </td>
                        <td className="border border-[#94a3b8] py-2 text-center">
                          <span className="font-bold text-sm">
                            {item.quantity}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            Pcs
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Blok 'Empty rows filler' sudah di-takeout sesuai request */}
                </tbody>
              </table>
            </div>

            {/* 4. REMARKS */}
            <div className="mb-10">
              <div className="font-bold text-xs uppercase mb-1 text-gray-700">
                Catatan (Remarks):
              </div>
              <div className="border border-gray-300 p-3 min-h-[60px] rounded-sm text-xs text-gray-600 bg-gray-50/30 whitespace-pre-wrap">
                {remarks ||
                  "Barang diterima dalam kondisi baik dan sesuai pesanan."}
              </div>
            </div>
          </div>

          {/* 5. FOOTER (Tanda Tangan) */}
          <div className="mt-auto break-inside-avoid pt-4">
            <div className="flex justify-between text-center px-4">
              <div className="flex flex-col items-center">
                <div className="mb-16 text-sm font-semibold">
                  Penerima (PIC),
                  <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                    (Tanda Tangan & Stempel)
                  </div>
                </div>
                <div className="border-b border-black w-40 mb-1"></div>
                <div className="text-xs font-semibold">{picName}</div>
                <div className="text-[10px] text-gray-500">
                  {picDept !== "-" ? picDept : "Tgl: ....................."}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-16 text-sm font-semibold">
                  Pengirim / Driver,
                </div>
                <div className="border-b border-black w-40 mb-1"></div>
                <div className="text-xs text-gray-500">
                  (Nama Terang & Tanda Tangan)
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 text-sm font-bold">Hormat Kami,</div>
                <div className="relative h-20 w-32 flex items-center justify-center -mb-2">
                  {order.sales?.signatureUrl ? (
                    <img
                      src={order.sales.signatureUrl}
                      alt="Signature"
                      className="h-full w-auto object-contain opacity-80"
                      crossOrigin="anonymous"
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

            <div className="mt-10 text-[10px] text-center text-gray-400 italic border-t border-gray-200 pt-3">
              * Surat Jalan ini merupakan bukti sah pengiriman dan penerimaan
              barang. Harap disimpan dengan baik.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
