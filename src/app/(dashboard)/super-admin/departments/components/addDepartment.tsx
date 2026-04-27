"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DepartmentForm, {
  DepartmentFormValues,
} from "../components/formDepartment";

export default function AddDepartment() {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddDepartment = async (data: DepartmentFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat departemen");
      }

      toast.success("Department created successfully!");

      // Navigasi ke halaman list
      router.push("/super-admin/departments");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create department:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create department",
      );
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Department
      </h2>

      <DepartmentForm onSubmit={handleAddDepartment} />
    </div>
  );
}
