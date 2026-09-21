"use client";

import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { FileDown, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";

export default function PurchaseOrderPrint() {
  const { fetchApi, status } = useApi();
  const params = useParams();
  const poId = params?.poId; // Sesuaikan dengan nama parameter di foldermu

  const poRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !poId) return;

    try {
      setLoading(true);
      // Gunakan endpoint getPurchaseOrderById yang sudah ada
      const res = await fetchApi(`/purchase-orders/${poId}`);

      if (!res.ok) throw new Error("Gagal mengambil data Purchase Order");

      const result = await res.json();
      setData(result.data || result);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [poId, status, fetchApi]);

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
    const element = poRef.current;
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
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

      const fileName = `PO_${data?.poNumber || "Draft"}.pdf`;
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
  // PREPARE VARIABLES DARI DATA PO
  // =========================================================
  const vendorName = data.vendor?.companyName || "-";
  const vendorPic = data.vendor?.picName || "-";

  // 1. Merangkai Alamat Lengkap Vendor
  const v = data.vendor || {};
  const addressLine1 = v.address || "";
  const addressLine2 = [v.subDistrict, v.district].filter(Boolean).join(", ");
  const addressLine3 = [v.city, v.province, v.country]
    .filter(Boolean)
    .join(", ");
  const postalCode = v.postalCode ? ` - ${v.postalCode}` : "";
  const fullAddress3 = `${addressLine3}${postalCode}`;

  const vendorContacts = v.contacts
    ? [...v.contacts].sort((a: any, b: any) =>
        b.isPrimary === a.isPrimary ? 0 : b.isPrimary ? 1 : -1,
      )
    : [];

  const grandTotal = Number(data.totalAmount) || 0;

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10">
      {/* Tombol Download melayang di pojok kanan atas */}
      <div className="fixed top-5 right-5 z-50">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="shadow-lg gap-2 bg-slate-800 hover:bg-slate-700 text-white">
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
          id="po-content"
          ref={poRef}
          className="bg-white text-black font-sans box-border shadow-xl relative"
          style={{
            width: "210mm",
            minHeight: "297mm", // Ukuran A4
            padding: "10mm 10mm",
            display: "flex",
            flexDirection: "column",
          }}>
          <div className="flex-1 text-[11px]">
            {/* 1. HEADER */}
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-extrabold tracking-wide">
                PURCHASE ORDER
              </h1>
              <img
                src="/images/logo-gd.png"
                alt="Company Logo"
                className="h-14 object-contain"
                crossOrigin="anonymous"
              />
            </div>

            {/* 2. KOTAK INFO PERUSAHAAN (Kiri Atas) */}
            <div className="w-1/2 border border-black p-2 mb-4 text-start font-medium leading-relaxed">
              <div className="font-bold text-[12px] mb-1">
                Goenakan Indonesia
              </div>
              <div>Jl. Darmo Baru Barat I No. 35</div>
              <div>Sonokwijenan, Sukomanunggal</div>
              <div>Surabaya, Jawa Timur, Indonesia - 60189</div>
              <div className="mt-1">PHONE : +62 823-8790-2238</div>
              <div>EMAIL : goenakan.id@gmail.com</div>
            </div>

            {/* 3. GRID 3 KOLOM INFO PO */}
            <div className="grid grid-cols-3 border-t border-l border-r border-black mb-4">
              <div className="border-r border-black p-2 flex flex-col gap-1">
                <div className="flex">
                  <span className="w-14 font-bold">VENDOR:</span>{" "}
                  <span className="font-bold uppercase">{vendorName}</span>
                </div>
                <div className="uppercase">UP: {vendorPic}</div>

                {/* Menampilkan Alamat Vendor Terangkai */}
                <div className="uppercase mt-1 leading-snug">
                  {addressLine1 && <div>{addressLine1}</div>}
                  {addressLine2 && <div>{addressLine2}</div>}
                  {fullAddress3 && <div>{fullAddress3}</div>}
                  {!addressLine1 && !addressLine2 && !fullAddress3 && (
                    <div>-</div>
                  )}
                </div>

                {/*  UPDATE: Menampilkan Kontak Secara Dinamis */}
                <div className="mt-1">
                  {vendorContacts.length > 0 ? (
                    vendorContacts.map((contact: any, idx: number) => (
                      <div key={idx} className="uppercase flex gap-1">
                        {/* Menampilkan Nama Platform, contoh: INSTAGRAM : */}
                        <span className="w-16">
                          {contact.platform?.name || "CONTACT"}
                        </span>
                        <span>: {contact.contactId}</span>
                      </div>
                    ))
                  ) : (
                    <div>CONTACT : -</div>
                  )}
                </div>
              </div>

              {/* Kolom 2: PO Detail */}
              <div className="border-r border-black p-2 flex flex-col gap-1">
                <div className="flex">
                  <span className="w-24">PO No.</span>{" "}
                  <span>: {data.poNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-24">Order Date</span>{" "}
                  <span>: {format(new Date(data.poDate), "dd-MMM-yyyy")}</span>
                </div>
                <div className="flex">
                  <span className="w-24">Department</span>{" "}
                  <span>: {data.expenseCategory || "-"}</span>
                </div>
                <div className="flex">
                  <span className="w-24">Ordered by</span>{" "}
                  <span>: {data.createdBy?.name || "-"}</span>
                </div>
              </div>

              {/* Kolom 3: Terms & Total */}
              <div className="p-2 flex flex-col gap-1">
                <div className="flex">
                  <span className="w-20">TOP</span>{" "}
                  <span>: {data.paymentTerms?.replace("_", " ")}</span>
                </div>
                <div className="flex">
                  <span className="w-20">Total Value</span>{" "}
                  <span>: {formatDynamicCurrency(grandTotal)}</span>
                </div>
                <div className="flex">
                  <span className="w-20">DP</span> <span>: -</span>
                </div>
                <div className="flex">
                  <span className="w-20">References</span>{" "}
                  <span>: {data.purchaseType}</span>
                </div>
              </div>
            </div>

            {/* 4. TABEL ITEM */}
            <table className="w-full border-collapse border border-black mb-0">
              <thead>
                <tr className="bg-gray-100 font-bold text-center border-b border-black">
                  <th className="border-r border-black py-1 px-2 w-8">No.</th>
                  <th className="border-r border-black py-1 px-2">
                    DESCRIPTION
                  </th>
                  <th className="border-r border-black py-1 px-2 w-16">QTY</th>
                  <th className="border-r border-black py-1 px-2 w-16">UNIT</th>
                  <th className="border-r border-black py-1 px-2 w-28">
                    UNIT PRICE
                  </th>
                  <th className="border-r border-black py-1 px-2 w-16">DISC</th>
                  <th className="py-1 px-2 w-32">TOTAL PRICE</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item: any, index: number) => {
                  const itemQty = Number(item.quantityPurchase) || 0;
                  const itemPrice = Number(item.unitPrice) || 0;
                  const itemTotal = itemQty * itemPrice;

                  return (
                    <tr
                      key={item.id || index}
                      className="align-top border-b border-black">
                      <td className="border-r border-black py-1 px-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border-r border-black py-1 px-2">
                        <div className="font-semibold">{item.itemName}</div>

                        {item.variant?.variantName && (
                          <div className="text-[10px] text-gray-700 font-semibold mt-0.5">
                            Varian: {item.variant.variantName}
                          </div>
                        )}

                        {item.selectedAttributes &&
                          Object.keys(item.selectedAttributes).length > 0 && (
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {Object.entries(item.selectedAttributes)
                                .map(([key, val]) => `${key}: ${val}`)
                                .join(", ")}
                            </div>
                          )}

                        {item.remarks && (
                          <div className="text-[10px] text-gray-500 italic mt-0.5">
                            Note: {item.remarks}
                          </div>
                        )}
                      </td>
                      <td className="border-r border-black py-1 px-2 text-center">
                        {itemQty}
                      </td>
                      <td className="border-r border-black py-1 px-2 text-center capitalize">
                        {item.uom || "Pcs"}
                      </td>
                      <td className="border-r border-black py-1 px-2 text-right">
                        {formatDynamicCurrency(itemPrice)}
                      </td>
                      <td className="border-r border-black py-1 px-2 text-right">
                        0
                      </td>
                      <td className="py-1 px-2 text-right font-medium">
                        {formatDynamicCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 5. SUMMARY (Bawah Tabel) */}
            <div className="flex border-l border-r border-b border-black mb-6">
              <div className="w-1/2 border-r border-black p-2 flex flex-col">
                <span className="font-bold mb-1">Notes:</span>
                <span className="whitespace-pre-line">{data.notes || "-"}</span>
              </div>
              <div className="w-1/2 p-2">
                <table className="w-full text-right">
                  <tbody>
                    <tr>
                      <td className="text-left w-24">Total</td>
                      <td className="w-12 text-center">
                        {data.currencyCode || "IDR"}
                      </td>
                      <td>{formatDynamicCurrency(grandTotal)}</td>
                    </tr>
                    <tr>
                      <td className="text-left">Discount</td>
                      <td className="text-center">
                        {data.currencyCode || "IDR"}
                      </td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td className="text-left">VAT</td>
                      <td className="text-center">
                        {data.currencyCode || "IDR"}
                      </td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td className="text-left font-bold pt-2">Grand Total</td>
                      <td className="text-center font-bold pt-2">
                        {data.currencyCode || "IDR"}
                      </td>
                      <td className="font-bold pt-2">
                        {formatDynamicCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. FOOTER (Syarat & Tanda Tangan) */}
            <div className="flex gap-4">
              {/* Syarat & Ketentuan */}
              <div className="w-[60%] pl-4 pr-2">
                <ol className="list-decimal text-[10px] space-y-1.5 text-justify">
                  <li>
                    In the event that delivery can not take place on or before
                    the above mentioned due date, we shall be informed at least
                    one month before.
                  </li>
                  <li>
                    Purchase Order Number shall be noted in any Delivery Note,
                    Invoice and Receipt.
                  </li>
                  <li>
                    Purchase Order and Original Delivery Note, Receiving Report
                    shall be attached together with Invoice & Receipt.
                  </li>
                  <li>
                    Invoice document shall be submitted according to the payment
                    terms stated above and shall be paid as agreement after
                    receipt of the Invoice and delivery report.
                  </li>
                  <li>
                    Items not in compliance with the specification ordered /
                    broken / defect will be rejected.
                  </li>
                  <li>
                    We are not responsible for any rejected items which are not
                    taken back after 1 (one) month.
                  </li>
                  <li>
                    It is mandatory for each supplier/vendor/partner to sign an
                    integrity pact document.
                  </li>
                </ol>
              </div>

              {/* Kolom Tanda Tangan */}
              <div className="w-[40%] border border-black flex flex-col">
                <div className="text-center py-1 border-b border-black font-medium">
                  Acknowledged & Approved by
                </div>

                <div className="flex-1 flex justify-between gap-3 px-2 pt-20 pb-2 text-center">
                  {/* Tanda Tangan 1: Menggunakan w-1/2 agar lebarnya pas 50% dari ruang yang tersisa */}
                  <div className="flex flex-col items-center w-1/2">
                    <div className="border-b border-black w-full mb-1 font-bold">
                      Manager 1
                    </div>
                    <div className="text-[9px] leading-tight">
                      Procurement Manager
                    </div>
                  </div>

                  {/* Tanda Tangan 2: Menggunakan w-1/2 */}
                  <div className="flex flex-col items-center w-1/2">
                    <div className="border-b border-black w-full mb-1 font-bold">
                      Manager 2
                    </div>
                    <div className="text-[9px] leading-tight">
                      Group Procurement Manager
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
