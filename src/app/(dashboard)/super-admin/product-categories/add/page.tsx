"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ProductCategoryForm from "../components/formCategoryProduct";

const AddCategoryProduct = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategoryProduct = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/product-categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ message: "Failed to create" }));
        throw new Error(errData.message || "Failed to create category");
      }

      toast.success("Product Category created successfully!");
      router.push("/super-admin/product-categories");
      router.refresh();
    } catch (err: any) {
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
