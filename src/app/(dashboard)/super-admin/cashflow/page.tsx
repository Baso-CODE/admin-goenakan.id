import { Metadata } from "next";
import CashflowClient from "./components/cashflowClient";

export const metadata: Metadata = {
  title: "Cashflow Management",
  description:
    "Monitor arus kas, pendapatan, pengeluaran, dan profit/loss per transaksi secara detail.",
};

export default function CashflowPage() {
  return <CashflowClient />;
}
