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
    invoiceNumbers,
    previousDO,
    isFirstShipment,
    shipmentSequence,
    totalShipments,
  } = data;

  // Setup Variabel Penerima & PIC
  let receiverCompany = "-";
  let receiverAddress = destination || order?.shippingAddress || "-";
  let picName = "-";
  let picDept = "-";
  let picPhone = "-";

  // Setup Variabel Sales (Untuk kontak info di DN)
  const salesName = order?.sales?.name || "Goenakan Admin";
  const salesPhone = order?.sales?.phone || "+62 823-8790-2238";

  // Ekstrak data dari struktur relasi backend
  if (order?.client?.b2b) {
    receiverCompany = order.client.b2b.companyName;
    if (order.client.b2b.fullAddress) {
      receiverAddress = order.client.b2b.fullAddress;
    }
    if (order.pic) {
      picName = `${order.pic.prefix ? order.pic.prefix + " " : ""}${order.pic.name}`;
      picPhone = order.pic.phone || order.client.b2b.phone || "-";
      picDept = order.client.b2b.department?.name || "-";
    } else {
      picPhone = order.client.b2b.phone || "-";
      picDept = order.client.b2b.department?.name || "-";
    }
  } else if (order?.client?.b2c) {
    receiverCompany = order.client.b2c.name;
    if (order.client.b2c.fullAddress) {
      receiverAddress = order.client.b2c.fullAddress;
    }
    picName = "Personal";
    picPhone = order.client.b2c.phone || "-";
  }

  // Cek jika ada invoice di order, kalau tidak ada kita kasih "-"
  const invoiceNumber = order?.invoices?.[0]?.invoiceNumber || "-";

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
            padding: "15mm 15mm",
            display: "flex",
            flexDirection: "column",
          }}>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-8 text-[12px] text-gray-900">
              <div className="w-full mb-6 border-b-2 border-gray-800 pb-4">
                <img
                  src="/images/surat-jalan-header.png"
                  alt="Kop Surat"
                  className="w-full h-auto object-contain max-h-30"
                  crossOrigin="anonymous"
                />
              </div>
            </div>

            {/* Badge Partial Shipment */}
            {totalShipments > 1 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-300 text-orange-700 text-[11px] font-semibold px-3 py-1 rounded-full">
                  ⚠ Pengiriman Partial — Surat Jalan ke-{shipmentSequence} dari{" "}
                  {totalShipments}
                </span>
                {isFirstShipment && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] px-2 py-1 rounded-full">
                    Pengiriman Pertama
                  </span>
                )}
                {!isFirstShipment && shipmentSequence === totalShipments && (
                  <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-600 text-[10px] px-2 py-1 rounded-full">
                    Pengiriman Terakhir
                  </span>
                )}
              </div>
            )}

            <div className="mb-6 flex flex-col items-start">
              <div className="flex flex-col items-start w-[50%] mb-4">
                <table className="text-[12px] text-left w-full">
                  <tbody>
                    <tr>
                      <td className="py-0.5 pr-4 align-top w-28 whitespace-nowrap">
                        Phone
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        : {salesPhone} ({salesName})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        E-mail
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        : goenakan.id@gmail.com
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        DN Date
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        :{" "}
                        {departureDate
                          ? format(new Date(departureDate), "dd MMMM yyyy", {
                              locale: idLocale,
                            })
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        DN No.
                      </td>
                      <td className="py-0.5 align-top font-bold">
                        : {deliveryNoteNumber || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        Invoice No.
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        :{" "}
                        {invoiceNumbers && invoiceNumbers.length > 0
                          ? invoiceNumbers.join(", ")
                          : "-"}
                      </td>
                    </tr>
                    {/* ✅ Previous DO — whitespace-nowrap agar label tidak turun */}
                    {previousDO && (
                      <tr>
                        <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                          Previous DO No.
                        </td>
                        <td className="py-0.5 align-top font-medium">
                          : {previousDO.deliveryNoteNumber || "-"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="w-full mt-2">
                <h2 className="text-[15px] font-bold text-gray-900 mb-2">
                  Customer
                </h2>
                <table className="text-[12px] w-full text-gray-900">
                  <tbody>
                    <tr>
                      <td className="py-0.5 w-28 align-top whitespace-nowrap">
                        Name
                      </td>
                      <td className="py-0.5 align-top font-bold uppercase">
                        : {receiverCompany}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top whitespace-nowrap">
                        Department
                      </td>
                      <td className="py-0.5 align-top">
                        : {picDept !== "-" ? picDept : ""}{" "}
                        {picName !== "Personal" ? `(UP: ${picName})` : ""}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-0.5 align-top whitespace-nowrap">
                        Phone
                      </td>
                      <td className="py-0.5 align-top">
                        : {picPhone !== "-" ? picPhone : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top whitespace-nowrap">
                        PO No.
                      </td>
                      <td className="py-0.5 align-top">
                        : {order?.poNumber || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top whitespace-nowrap">
                        Address
                      </td>
                      <td className="py-0.5 align-top pr-10">
                        : {receiverAddress}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. PRODUCT TABLE */}
            {/* ========================================================= */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-[#94a3b8]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-center font-bold text-[11px] uppercase text-gray-700">
                    <th className="border border-[#94a3b8] py-2 w-10">No</th>
                    <th className="border border-[#94a3b8] py-2 w-32">
                      Product Details
                    </th>
                    <th className="border border-[#94a3b8] py-2">
                      Nama Barang / Deskripsi
                    </th>
                    <th className="border border-[#94a3b8] py-2 w-28">
                      Order Qty (pcs)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item: any, index: number) => {
                    const product = item.orderProduct.product;
                    return (
                      <tr key={item.id} className="align-top text-[12px]">
                        <td className="border border-[#94a3b8] py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-3 font-mono text-center">
                          {product.sku || "-"}
                        </td>
                        <td className="border border-[#94a3b8] py-2 px-3">
                          <div className="font-bold text-gray-800">
                            {product.name}
                          </div>
                          {item.orderProduct.customization && (
                            <div className="text-[10px] text-gray-500 mt-0.5 italic leading-tight">
                              Spec: {item.orderProduct.customization}
                            </div>
                          )}
                        </td>
                        <td className="border border-[#94a3b8] py-2 text-center">
                          <span className="font-bold">{item.quantity}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. REMARKS */}
            <div className="mb-10">
              <div className="font-bold text-[12px] uppercase mb-1 text-gray-700">
                Catatan (Remarks):
              </div>
              <div className="border border-gray-300 p-3 min-h-15 rounded-sm text-[11px] text-gray-600 bg-gray-50/30 whitespace-pre-wrap">
                {/* LOGIKA MENAMPILKAN NOTES */}
                {data?.notes && data.notes.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {data.notes.map((note: any) => (
                      <li key={note.id}>
                        <span className="font-bold">
                          [{note.category?.name}]
                        </span>{" "}
                        {note.content}
                      </li>
                    ))}
                  </ul>
                ) : remarks ? (
                  <p>{remarks}</p>
                ) : (
                  <p>Barang diterima dalam kondisi baik dan sesuai pesanan.</p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. FOOTER */}
          {/* ========================================================= */}
          <div className="mt-auto break-inside-avoid pt-4">
            <div className="flex justify-between text-center px-4">
              <div className="flex flex-col items-center">
                <div className="mb-16 text-[12px] font-semibold">
                  Penerima (PIC),
                  <div className="text-[9px] font-normal text-gray-500 mt-0.5">
                    (Tanda Tangan & Stempel)
                  </div>
                </div>
                <div className="border-b border-black w-40 mb-1"></div>
                <div className="text-[12px] font-semibold">{picName}</div>
                <div className="text-[9px] text-gray-500">
                  {picDept !== "-" ? picDept : "Tgl: ....................."}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-16 text-[12px] font-semibold">
                  Pengirim / Driver,
                </div>
                <div className="border-b border-black w-40 mb-1"></div>
                <div className="text-[11px] text-gray-500">
                  (Nama Terang & Tanda Tangan)
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="mb-4 text-[12px] font-bold">Hormat Kami,</div>
                <div className="relative h-20 w-32 flex items-center justify-center -mb-2">
                  {/* {order.sales?.signatureUrl ? (
                    <img
                      src={order.sales.signatureUrl}
                      alt="Signature"
                      className="h-full w-auto object-contain opacity-80"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-16 w-full"></div>
                  )} */}
                </div>
                <div className="font-bold underline text-[12px] mt-1">
                  Goenakan Indonesia
                </div>
                <div className="text-[9px] font-bold text-[#475569]">
                  Logistic Dept.
                </div>
              </div>
            </div>

            <div className="mt-10 text-[9px] text-center text-gray-400 italic border-t border-gray-200 pt-3">
              * Surat Jalan ini merupakan bukti sah pengiriman dan penerimaan
              barang. Harap disimpan dengan baik.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
