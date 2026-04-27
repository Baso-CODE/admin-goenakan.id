"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DepartmentForm, { DepartmentFormValues } from "./formDepartment";

export default function EditDepartment() {
  const { fetchApi, status } = useApi();

  const { slug } = useParams();
  const router = useRouter();

  const [departmentsData, setDepartmentsData] = useState<
    DepartmentFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      // 🛑 Guard: Jangan jalan jika slug tidak ada atau sesi belum siap
      if (!slug || status !== "authenticated") return;

      try {
        setIsLoading(true);

        // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
        const res = await fetchApi(`/departments/${slug}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch department data");
        }

        const data = await res.json();

        setDepartmentsData({
          name: data.name,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error("❌ Failed to load department:", err);
        toast.error("Failed to load department data.");
        setDepartmentsData(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, status, fetchApi]); // Tambahkan dependensi auth

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdateDepartments = async (formValues: DepartmentFormValues) => {
    // 🛑 Guard: Pastikan sesi siap sebelum menembak API
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      // ✨ Gunakan fetchApi (Otomatis handle Base URL, Token, dan JSON Header)
      const res = await fetchApi(`/departments/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update department");
      }

      toast.success("Department updated successfully!");
      router.push("/super-admin/departments");
      router.refresh(); // Opsional: pastikan server-side data terbaru
    } catch (err) {
      console.error("❌ Failed to update department:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update department",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Department {slug}
      </h2>

      <DepartmentForm
        initialData={departmentsData}
        onSubmit={handleUpdateDepartments}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
