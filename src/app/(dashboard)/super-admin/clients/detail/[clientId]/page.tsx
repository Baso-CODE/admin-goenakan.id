import { Metadata } from "next";
import ClientDetail from "../../components/clientDetail";

export const metadata: Metadata = {
  title: "Client Profile",
  description:
    "Informasi lengkap profil klien, riwayat order, dan detail kontak perusahaan.",
};
export default function ClientDetailPage() {
  return <ClientDetail />;
}
