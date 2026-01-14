import { Metadata } from "next";
import EditDepartment from "../../components/editDeparment";

export const metadata: Metadata = {
  title: "Edit Department",
  description:
    "Perbarui informasi nama dan deskripsi departemen yang sudah ada.",
};
export default function EditDepartmentPage() {
  return <EditDepartment />;
}
