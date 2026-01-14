import { Metadata } from "next";
import EditCashflowClient from "../../components/editCashflowClient";

export const metadata: Metadata = {
  title: "Update Transaction Cost",
  description:
    "Formulir untuk input rincian biaya operasional, upload bukti bayar, dan kalkulasi profit/loss transaksi.",
};
export default function EditCashflowPage() {
  return <EditCashflowClient />;
}
