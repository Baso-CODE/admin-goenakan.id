"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ProductFormV2, { ProductFormValues } from "../components/FormProductV2";

type FileUploads = {
  images: File[] | null;
  videos: File[] | null;
  variantImages: File[][];
};

export default function AddProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddProduct = async (
    data: ProductFormValues,
    files: FileUploads
  ) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // 1️⃣ Append images
      if (files.images) {
        files.images.forEach((file) => formData.append("images", file));
      }

      // 2️⃣ Append videos
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

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to create product");
      }

      toast.success("Product created successfully!");
      router.push("/super-admin/products");
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
        Tambah Produk Baru
      </h2>

      <ProductFormV2 onSubmit={handleAddProduct} isSubmitting={isSubmitting} />
    </div>
  );
}
