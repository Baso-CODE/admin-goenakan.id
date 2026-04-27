"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ProductCategoryForm from "../components/formCategoryProduct";

const AddCategoryProduct = () => {
  const { fetchApi, status } = useApi();

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategoryProduct = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/product-categories", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create category");
      }

      toast.success("Product Category created successfully!");
      router.push("/super-admin/product-categories");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Create Category Error:", err);
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Category Product
      </h2>
      <ProductCategoryForm
        onSubmit={handleAddCategoryProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AddCategoryProduct;
