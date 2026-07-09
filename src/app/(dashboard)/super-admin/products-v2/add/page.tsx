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

      // Sync and update mockup settings & sides after product creation
      if (data.productData) {
        try {
          const imageIdMap: Record<string, string> = {};
          if (files.images && result.images) {
            files.images.forEach((file, idx) => {
              const remoteImg = result.images[idx];
              if (remoteImg) {
                imageIdMap[file.name] = remoteImg.id;
              }
            });
          }

          // 1. Update Mockup Settings (isMultiFace, mockupFrontImageId, mockupBackImageId)
          if (data.productData.mockupFrontImageId || data.productData.mockupBackImageId) {
            const settingsPayload = {
              isMultiFace: data.productData.isMultiFace || false,
              mockupFrontImageId: data.productData.mockupFrontImageId ? imageIdMap[data.productData.mockupFrontImageId] : null,
              mockupBackImageId: data.productData.mockupBackImageId ? imageIdMap[data.productData.mockupBackImageId] : null,
            };
            await fetchApi(`/products/${result.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(settingsPayload),
            });
          }

          // 2. Update Image Mockup Areas and Metadata
          if (data.productData.images) {
            for (const localImg of data.productData.images) {
              const remoteId = imageIdMap[localImg.id];
              if (!remoteId) continue;

              // Update mockup areas
              if (localImg.mockupAreas && localImg.mockupAreas.length > 0) {
                await fetchApi(`/products/image/${remoteId}/mockups`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mockupAreas: localImg.mockupAreas }),
                });
              }

              // Update metadata (mockupSideName, attributeValueId, printPositionValueId)
              if (localImg.mockupSideName || localImg.attributeValueId || localImg.printPositionValueId) {
                await fetchApi(`/products/image/${remoteId}/seo`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    mockupSideName: localImg.mockupSideName || null,
                    attributeValueId: localImg.attributeValueId || null,
                    printPositionValueId: localImg.printPositionValueId || null,
                  }),
                });
              }
            }
          }
        } catch (syncErr) {
          console.error("Failed to sync mockup settings post-creation:", syncErr);
        }
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
