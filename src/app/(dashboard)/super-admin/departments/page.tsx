import { Metadata } from "next";
import DepartmentTable from "./components/departmentsTable";

export const metadata: Metadata = {
  title: "Department Management",
  description:
    "Kelola struktur organisasi, daftar departemen, dan pembagian divisi kerja.",
};
export default function DeparmentsPage() {
  return <DepartmentTable />;
}
