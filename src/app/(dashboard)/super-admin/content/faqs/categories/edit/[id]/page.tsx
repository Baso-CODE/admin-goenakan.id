"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FaqCategoryForm, {
  FaqCategoryFormValues,
} from "../../component/formFaqCategories";

export default function EditFaqCategory() {
  const { id } = useParams(); // Menggunakan ID sesuai controller
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<
    FaqCategoryFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        // Mengambil data berdasarkan ID
        const res = await fetch(`${apiUrl}/content/faqs/categories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch category data");

        const data = await res.json();

        // Mapping response API ke Form Values
        setCategoryData({
          name: data.name,
          description: data.description || "",
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load category data.");
        router.push("/super-admin/faqs/categories"); // Redirect jika error/not found
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdateCategory = async (formValues: FaqCategoryFormValues) => {
    try {
      setIsSubmitting(true);

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/content/faqs/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message || errText);
        } catch {
          throw new Error(errText);
        }
      }

      toast.success("Category updated successfully!");

      router.push("/super-admin/faqs/categories");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit FAQ Category
      </h2>

      <FaqCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
