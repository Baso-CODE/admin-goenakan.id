"use client";
import React from "react";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ProductCategoryForm, {
  ProductCategoryFormValues,
} from "../components/formCategoryProduct";

const AddCategoryProduct = () => {
  const router = useRouter();

  const handleAddCategoryProduct = async (data: ProductCategoryFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:8000/product-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Product Category created successfully!");
      router.push("/super-admin/product-categories");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error || "Failed to create category");
    }
  };
  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Category Product
      </h2>
      <ProductCategoryForm onSubmit={handleAddCategoryProduct} />
    </div>
  );
};

export default AddCategoryProduct;
