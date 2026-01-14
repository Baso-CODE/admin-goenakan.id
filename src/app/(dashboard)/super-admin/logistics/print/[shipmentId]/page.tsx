import { Metadata } from "next";
import DeliveryNotePrint from "../../components/deliveryNotePrint";
export const metadata: Metadata = {
  title: "Print Delivery Note",
  description:
    "Tampilan cetak dokumen surat jalan resmi untuk keperluan pengiriman barang.",
};
export default function DeliveryNotePrintPage() {
  return <DeliveryNotePrint />;
}
