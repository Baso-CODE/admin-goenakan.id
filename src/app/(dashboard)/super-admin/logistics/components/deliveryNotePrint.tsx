"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FileDown, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function DeliveryNotePrint() {
  const { fetchApi, status } = useApi();
  const { shipmentId } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // FETCH DATA SHIPMENT
  useEffect(() => {
    const fetchData = async () => {
      if (!shipmentId || status !== "authenticated") return;

      try {
        setLoading(true);

        const res = await fetchApi(`/logistics/shipments/${shipmentId}`);

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

    fetchData();
  }, [shipmentId, status, fetchApi]);

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
    destination,
    invoiceNumbers,
    previousDO,
    shipmentSequence,
    type,
    notes,
  } = data;

  // Setup Variabel Penerima & PIC
  let receiverCompany = "-";
  let receiverAddress = destination || order?.shippingAddress || "-";
  let picName = "-";
  let picDept = "-";
  let picPhone = "-";

  // Setup Variabel Sales
  const salesName = order?.sales?.name || "Goenakan Admin";
  const salesPhone = order?.sales?.phone || "+62 823-8790-2238";

  // Ekstrak data client
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

  // ==========================================
  // LOGIKA SHIPMENT SUMMARY (SESUAI GAMBAR)
  // ==========================================
  const isMultipleSkus = items?.length > 1;
  const totalOutstanding =
    items?.reduce((sum: number, i: any) => sum + (i.inProcessPcs || 0), 0) || 0;

  // Tentukan State Pengiriman
  const isDirectFull = shipmentSequence === 1 && totalOutstanding === 0;
  const isPartialFirst = shipmentSequence === 1 && totalOutstanding > 0;
  const isPartialMid = shipmentSequence > 1 && totalOutstanding > 0;
  const isPartialFinal = shipmentSequence > 1 && totalOutstanding === 0;
  const isPartialFlow = !isDirectFull;

  // Helper Formatter
  const formatValue = (key: string) => {
    if (!isMultipleSkus)
      return `${(items?.[0]?.[key] || 0).toLocaleString()} pcs`;
    return items
      ?.map(
        (i: any) =>
          `${i.orderProduct?.product?.name || "Produk"} (${(i[key] || 0).toLocaleString()} pcs)`,
      )
      .join("; ");
  };

  // String Builder
  const totalPoString = formatValue("orderedPcs");
  const currentShipmentString = formatValue("sendPcs");
  const outstandingString = formatValue("inProcessPcs");

  let prevShippedString = formatValue("deliveredPcs");
  if (!isMultipleSkus && isPartialFinal) {
    prevShippedString += " (Total of previous shipments)";
  }

  // Teks Label "Current Shipment"
  let currentShipmentLabel = "Current Shipment";
  if (isPartialFirst) currentShipmentLabel = "Current Shipment (Shipment #1)";
  else if (isPartialMid)
    currentShipmentLabel = `Current Shipment (Shipment #${shipmentSequence})`;
  else if (isPartialFinal)
    currentShipmentLabel = "Current Shipment (Fulfillment)";

  // Teks "Status"
  let statusString = "Full Delivery (Order Completed)";
  if (isPartialFirst)
    statusString = "Partial Delivery (Next shipment to be advised)";
  else if (isPartialMid)
    statusString = "Partial Delivery (Pending Fulfillment)";
  else if (isPartialFinal)
    statusString = "Fulfillment Completed (Order Fully Delivered)";

  // Teks "Note" Logika
  const hasManualNotes = notes && notes.length > 0;
  const showAutoNotes = isMultipleSkus && isPartialFlow;
  const showNotesSection = showAutoNotes || hasManualNotes;

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

            <div className="mb-6 flex flex-col items-start">
              <div className="flex flex-col items-start w-full mb-4">
                <table className="text-[12px] text-left w-full border-collapse">
                  <tbody>
                    {/* Baris Phone */}
                    <tr>
                      <td className="py-0.5 pr-4 align-top w-28 whitespace-nowrap">
                        Phone
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        <div className="flex">
                          <span className="w-3 shrink-0">:</span>
                          <div className="flex-1">
                            {salesPhone} ({salesName})
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Baris E-mail */}
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        E-mail
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        <div className="flex">
                          <span className="w-3 shrink-0">:</span>
                          <div className="flex-1">goenakan.id@gmail.com</div>
                        </div>
                      </td>
                    </tr>

                    {/* Baris DN Date */}
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        DN Date
                      </td>
                      <td className="py-0.5 align-top font-medium">
                        <div className="flex">
                          <span className="w-3 shrink-0">:</span>
                          <div className="flex-1">
                            {departureDate
                              ? format(
                                  new Date(departureDate),
                                  "dd MMMM yyyy",
                                  {
                                    locale: idLocale,
                                  },
                                )
                              : "-"}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Baris DN No. */}
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        DN No.
                      </td>
                      <td className="py-0.5 align-top font-bold text-gray-900">
                        <div className="flex">
                          <span className="w-3 shrink-0">:</span>
                          <div className="flex-1 uppercase">
                            {deliveryNoteNumber || "-"}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Baris ETA */}
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap text-[10px]">
                        ETA
                      </td>
                      <td className="py-0.5 align-top font-bold text-[10px]">
                        <div className="flex">
                          <span className="w-3 shrink-0">:</span>
                          <div className="flex-1">
                            {departureDate
                              ? format(new Date(departureDate), "MMM dd, yyyy")
                              : "-"}{" "}
                            (Estimated)
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Baris Invoice No. */}
                    <tr>
                      <td className="py-0.5 pr-4 align-top whitespace-nowrap">
                        Invoice No.
                      </td>
                      <td className="py-0.5 align-top font-medium wrap-break-word">
                        <div className="flex">
                          <span className="w-3 shrink-0">:</span>
                          <div className="flex-1">
                            {invoiceNumbers && invoiceNumbers.length > 0
                              ? invoiceNumbers.join(" | ")
                              : "-"}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Baris Previous DN No. (Opsional) */}
                    {previousDO && type === "OUTBOUND" && (
                      <tr>
                        <td className="py-0.5 pr-4 align-top whitespace-nowrap text-slate-600">
                          Previous DN No.
                        </td>
                        <td className="py-0.5 align-top font-medium text-slate-600">
                          <div className="flex">
                            <span className="w-3 shrink-0">:</span>
                            <div className="flex-1 uppercase">
                              {previousDO.deliveryNoteNumber || "-"}
                            </div>
                          </div>
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
            {/* 3. PRODUCT TABLE (KOLOM SUDAH DI-UPDATE) */}
            {/* ========================================================= */}
            <div className="mb-6 overflow-x-hidden">
              <table className="w-full border-collapse border border-[#e2e8f0] text-[10px]">
                <thead>
                  <tr className="bg-[#e5e5e5] text-center font-bold text-gray-800 leading-tight">
                    <th className="border border-[#d4d4d8] py-2 w-8">No.</th>
                    <th className="border border-[#d4d4d8] py-2">
                      Product /
                      <br />
                      Description
                    </th>
                    <th className="border border-[#d4d4d8] py-2 w-16">
                      Order Qty
                      <br />
                      (pcs)
                    </th>
                    <th className="border border-[#d4d4d8] py-2 w-16">
                      Shipped Qty
                      <br />
                      (pcs)
                    </th>
                    <th className="border border-[#d4d4d8] py-2 w-20">
                      Outstanding
                      <br />
                      Qty (pcs)
                    </th>
                    <th className="border border-[#d4d4d8] py-2 w-16">
                      Packaging
                      <br />
                      (Ctn)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((item: any, index: number) => {
                    const product = item.orderProduct.product;

                    // Mengambil nilai mapping backend baru
                    const orderedPcs = item.orderedPcs || 0;
                    const sendPcs = item.sendPcs || 0;
                    const outstandingPcs = item.inProcessPcs || 0;
                    const totalCarton = item.totalCarton || "-";

                    return (
                      <tr key={item.id} className="align-middle">
                        <td className="border border-[#d4d4d8] py-2 text-center text-gray-700 bg-gray-50/50">
                          {index + 1}
                        </td>
                        <td className="border border-[#d4d4d8] py-2 px-3 bg-gray-50/50">
                          <div className="font-bold text-gray-900">
                            {product.name}
                          </div>
                          {item.orderProduct.variant?.variantName && (
                            <div className="text-[10px] text-gray-700 font-semibold mt-0.5">
                              Variant: {item.orderProduct.variant.variantName}
                            </div>
                          )}
                          {/* {product.description && (
                            <div className="text-[9px] text-gray-600 mt-0.5">
                              {product.description}
                            </div>
                          )} */}
                          {item.orderProduct.customization && (
                            <div className="text-[9px] text-gray-500 mt-0.5 italic">
                              Spec: {item.orderProduct.customization}
                            </div>
                          )}
                        </td>
                        <td className="border border-[#d4d4d8] py-2 text-center text-gray-800 bg-gray-50/50">
                          {orderedPcs}
                        </td>
                        <td className="border border-[#d4d4d8] py-2 text-center text-gray-800 bg-gray-50/50">
                          {sendPcs}
                        </td>
                        <td className="border border-[#d4d4d8] py-2 text-center text-gray-800 bg-gray-50/50">
                          {outstandingPcs}
                        </td>
                        <td className="border border-[#d4d4d8] py-2 text-center text-gray-800 bg-gray-50/50">
                          {totalCarton}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ========================================================= */}
            {/* 4. SHIPMENT SUMMARY (LOGIKA MENGIKUTI GAMBAR) */}
            {/* ========================================================= */}
            <div className="mb-10">
              <div className="font-bold text-[12px] mb-1 text-gray-900">
                Shipment Summary:
              </div>
              <ul className="list-disc pl-5 text-[11px] text-gray-800 space-y-0.5">
                <li>Total Purchase Order Quantity: {totalPoString}</li>

                {/* Tampilkan Previously Shipped jika ini parsial urutan ke-2 ke atas */}
                {shipmentSequence > 1 && (
                  <li>Previously Shipped: {prevShippedString}</li>
                )}

                <li>
                  {currentShipmentLabel}: {currentShipmentString}
                </li>

                <li>Outstanding Quantity: {outstandingString}</li>

                <li>Status: {statusString}</li>

                {/* AREA NOTES DINAMIS */}
                {showNotesSection && (
                  <li>
                    Note:
                    <ul className="list-none pl-2 mt-0.5 space-y-0.5 text-gray-600">
                      {/* Tampilkan rincian sisa produk jika SKU lebih dari 1 dan parsial */}
                      {showAutoNotes &&
                        items?.map((item: any) => {
                          const isFullyDelivered = item.inProcessPcs === 0;
                          return (
                            <li key={item.id}>
                              - {item.orderProduct?.product?.name}:{" "}
                              {isFullyDelivered
                                ? "Fully Delivered."
                                : `${item.inProcessPcs} pcs remaining (to be shipped in next batch).`}
                            </li>
                          );
                        })}

                      {/* Info komplit PO jika ini adalah pengiriman parsial terakhir */}
                      {showAutoNotes && isPartialFinal && (
                        <li>
                          - All items in PO [{order?.poNumber || "-"}] have been
                          delivered.
                        </li>
                      )}

                      {/* Notes manual dari backend */}
                      {hasManualNotes &&
                        notes?.map((note: any) => (
                          <li key={note.id}>
                            - [{note.category?.name}] {note.content}
                          </li>
                        ))}
                    </ul>
                  </li>
                )}
              </ul>
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
                <div className="relative h-20 w-32 flex items-center justify-center -mb-2"></div>
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
