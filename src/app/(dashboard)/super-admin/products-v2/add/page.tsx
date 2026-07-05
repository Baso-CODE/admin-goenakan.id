"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ProductFormValues } from "../components/product.schema";
import ProductFormV2 from "../components/productFormV2";

type FileUploads = {
  images: File[] | null;
  videos: File[] | null;
  variantImages: File[][];
};

export default function AddProductPage() {
  const { fetchApi, status } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddProduct = async (
    data: ProductFormValues,
    files: FileUploads,
  ) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (files.images) {
        files.images.forEach((file) => formData.append("images", file));
      }

      if (files.videos) {
        files.videos.forEach((file) => formData.append("videos", file));
      }

      if (files.variantImages && files.variantImages.length > 0) {
        files.variantImages.forEach((group) => {
          group.forEach((file) => {
            formData.append("variantImages", file);
          });
        });
      }

      const productDataJson = JSON.stringify(data);
      formData.append("data", productDataJson);

      const res = await fetchApi("/products", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to create product");
      }

      toast.success("Product created successfully!");
      router.push("/super-admin/products-v2");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="w-full max-w-full space-y-6">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Tambah Produk Baru (V2)
      </h2>

      <ProductFormV2 onSubmit={handleAddProduct} isSubmitting={isSubmitting} />
    </div>
  );
}
