"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ProductForm, { ProductFormValues } from "../components/FormProduct";

// Tipe data files dari ProductForm
type FileUploads = {
  images?: FileList;
  videos?: FileList;
};

export default function AddProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddProduct = async (
    data: ProductFormValues,
    files: FileUploads
  ) => {
    setIsSubmitting(true);
    const formData = new FormData();

    // 1. Tambahkan Files (Images)
    if (files.images) {
      // Loop FileList untuk 'images'
      for (let i = 0; i < files.images.length; i++) {
        formData.append("images", files.images[i]);
      }
    }

    // 2. Tambahkan Files (Videos)
    if (files.videos) {
      // Loop FileList untuk 'videos'
      for (let i = 0; i < files.videos.length; i++) {
        formData.append("videos", files.videos[i]);
      }
    }

    formData.append("data", JSON.stringify(data));

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch("http://localhost:8000/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create product");
      }

      toast.success("Product created successfully!");
      router.push("/super-admin/products"); // Ganti ke halaman list produk
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
      <ProductForm onSubmit={handleAddProduct} isSubmitting={isSubmitting} />
    </div>
  );
}
