import { Metadata } from "next";
import ClientEditForm from "../../components/clientEdit";

export const metadata: Metadata = {
  title: "Edit Client Profile",
  description:
    "Perbarui informasi perusahaan, kontak penanggung jawab, dan detail alamat klien.",
};
export default function ClientEditPage() {
  return <ClientEditForm />;
}
