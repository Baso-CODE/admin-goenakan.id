import { Metadata } from "next";
import LogisticTableAnalysist from "./components/logisticTableAnalysist";
export const metadata: Metadata = {
  title: "Logistics Operations",
  description:
    "Pusat analisis data logistik, monitoring performa vendor, dan rekapitulasi pengiriman.",
};
export default function LogisticsPage() {
  return <LogisticTableAnalysist />;
}
