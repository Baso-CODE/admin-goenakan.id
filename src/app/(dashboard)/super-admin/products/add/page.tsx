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

      // Extract size default mockup images (which have URLs instead of local files)
      const sizeDefaultSides = (data.mockupSides || []).filter((m: any) => m.imageId && m.imageId.startsWith("size-default-"));
      
      // Stage 1: Add default size mockup images to imagesMetadata so the server creates ProductImage rows for them
      const extraImagesMetadata = sizeDefaultSides.map((side: any) => ({
        url: side.url,
        isFeatured: false,
        altText: side.name || "Default Size Mockup"
      }));

      const cleanImagesMetadata = [
        ...extraImagesMetadata,
        ...(data.imagesMetadata || [])
      ];

      const { mockupSides, ...cleanData } = data as any;
      cleanData.imagesMetadata = cleanImagesMetadata;
      const productDataJson = JSON.stringify(cleanData);
      formData.append("data", productDataJson);

      const res = await fetchApi("/products", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to create product");
      }

      // If there are mockup sides defined locally, update them sequentially
      if (mockupSides && mockupSides.length > 0 && result.images && result.images.length > 0) {
        for (const side of mockupSides) {
          if (!side.imageId) continue;

          let createdImage = null;
          if (side.imageId.startsWith("size-default-")) {
            const defaultIndex = sizeDefaultSides.findIndex((m: any) => m.id === side.id);
            if (defaultIndex !== -1) {
              createdImage = result.images[defaultIndex];
            }
          } else if (side.imageId.startsWith("index-")) {
            const fileIndex = parseInt(side.imageId.replace("index-", ""));
            // The file images are placed after the size-default images in the DB insert
            createdImage = result.images[sizeDefaultSides.length + fileIndex];
          }

          if (!createdImage) continue;

          // 1. Update image mockup metadata
          await fetchApi(`/products/image/${createdImage.id}/seo`, {
            method: "PATCH",
            body: JSON.stringify({
              mockupSideName: side.name,
              attributeValueId: side.attributeValueId,
              printPositionValueId: side.printPositionValueId,
              printSideValueId: side.printSideValueId,
              altText: "Mockup Image",
            }),
          });

          // 2. Update mockup areas
          if (side.mockupAreas && side.mockupAreas.length > 0) {
            await fetchApi(`/products/image/${createdImage.id}/mockups`, {
              method: "PUT",
              body: JSON.stringify({ mockupAreas: side.mockupAreas }),
            });
          }

          // 3. Upload color mask if present
          if (side.colorMaskFile) {
            const maskFormData = new FormData();
            maskFormData.append("colorMask", side.colorMaskFile);
            await fetchApi(`/products/image/${createdImage.id}/color-mask`, {
              method: "POST",
              body: maskFormData,
            });
          }
        }
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
        Tambah Produk Baru (V2)
      </h2>

      <ProductFormV2 onSubmit={handleAddProduct} isSubmitting={isSubmitting} />
    </div>
  );
}
