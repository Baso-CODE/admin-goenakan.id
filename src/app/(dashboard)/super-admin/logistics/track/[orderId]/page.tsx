import { Metadata } from "next";
import LogisticsTrackingDetail from "../../components/logisticTrackingDetail";
export const metadata: Metadata = {
  title: "Shipment Tracking Detail",
  description:
    "Pantau status pengiriman, lokasi terkini, dan riwayat perjalanan barang secara real-time.",
};
export default function LogisticsTrackingDetailPage() {
  return <LogisticsTrackingDetail />;
}
