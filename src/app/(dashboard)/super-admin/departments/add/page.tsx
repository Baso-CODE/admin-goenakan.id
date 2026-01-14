import { Metadata } from "next";
import AddDepartment from "../components/addDepartment";

export const metadata: Metadata = {
  title: "Add New Department",
  description:
    "Tambahkan divisi atau departemen baru ke dalam struktur organisasi perusahaan.",
};
export default function AdddDepartmentPage() {
  return <AddDepartment />;
}
