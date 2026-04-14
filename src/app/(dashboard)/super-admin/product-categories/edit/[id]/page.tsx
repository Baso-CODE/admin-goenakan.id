"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiUrl } from "@/helper/apiurl";
import ProductCategoryForm from "../../components/formCategoryProduct";

export default function EditProductCategories() {
  const { id } = useParams();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 1. FETCH DATA EXISTING ===
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/product-categories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch category data");

        const data = await res.json();
        setCategoryData(data);
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        toast.error("Failed to load category data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // === 2. HANDLE UPDATE (DENGAN FORMDATA) ===
  const handleUpdateCategoryProduct = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");
      const res = await fetch(`${apiUrl}/product-categories/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: "Update failed" }));
        throw new Error(errData.message || "Failed to update category");
      }

      toast.success("Product Category updated successfully!");
      router.push("/super-admin/product-categories");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Product Category
      </h2>

      <ProductCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategoryProduct}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
