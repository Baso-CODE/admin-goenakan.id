import { Metadata } from "next";
import ClientManagementTable from "./components/clientManagementTableClient";

export const metadata: Metadata = {
  title: "Client Management",
  description:
    "Kelola database klien, informasi kontak perusahaan, dan riwayat kerjasama partner.",
};
export default function ClientManagementPage() {
  return <ClientManagementTable />;
}
