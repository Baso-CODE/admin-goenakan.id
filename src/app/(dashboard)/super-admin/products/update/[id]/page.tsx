"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProductForm, { ProductFormValues } from "../../components/FormProduct";
import { EditAttributesDialog } from "../../components/EditAttributesDialog";
import { EditPriceTiersDialog } from "../../components/EditPriceTiersDialog";

// Tipe data files dari ProductForm
type FileUploads = {
  images?: FileList;
  videos?: FileList;
};

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  // Tipe data lengkap dari server
  const [productData, setProductData] = useState<any | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Ambil data produk tunggal
        const res = await fetch(`http://localhost:8000/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch product data");
        const data = await res.json();

        // Set data untuk initialData form
        setProductData(data);
      } catch (err) {
        console.error("❌ Error fetching product data:", err);
        toast.error("Failed to load product data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpdateProduct = async (
    data: ProductFormValues,
    files: FileUploads
  ) => {
    setIsSubmitting(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // === 1️⃣ Update core product data ===
      const { attributes, priceTiers, ...coreData } = data;
      const coreRes = await fetch(`http://localhost:8000/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coreData),
      });
      if (!coreRes.ok) throw new Error("Failed to update core product data");

      // === 2️⃣ Update attributes (jika ada perubahan) ===
      if (attributes && attributes.length > 0) {
        const attrRes = await fetch(
          `http://localhost:8000/products/${id}/attributes`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ attributes }),
          }
        );
        if (!attrRes.ok) throw new Error("Failed to update attributes");
      }

      // === 3️⃣ Update price tiers (jika ada perubahan) ===
      if (priceTiers && priceTiers.length > 0) {
        const priceRes = await fetch(
          `http://localhost:8000/products/${id}/price-tiers`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ priceTiers }),
          }
        );
        if (!priceRes.ok) throw new Error("Failed to update price tiers");
      }

      // === 4️⃣ Upload new images ===
      if (files.images && files.images.length > 0) {
        for (let i = 0; i < files.images.length; i++) {
          const formData = new FormData();
          formData.append("image", files.images[i]);

          const imgRes = await fetch(
            `http://localhost:8000/products/${id}/image`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
          );
          if (!imgRes.ok) throw new Error("Failed to upload image");
        }
      }

      // === 5️⃣ Upload new videos ===
      if (files.videos && files.videos.length > 0) {
        for (let i = 0; i < files.videos.length; i++) {
          const formData = new FormData();
          formData.append("video", files.videos[i]);

          const vidRes = await fetch(
            `http://localhost:8000/products/${id}/video`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
          );
          if (!vidRes.ok) throw new Error("Failed to upload video");
        }
      }

      toast.success("Product updated successfully!");
      router.push("/super-admin/products");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Produk
      </h2>
      <ProductForm
        initialData={productData}
        onSubmit={handleUpdateProduct}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onMediaDeleted={(mediaId, type) => {
          setProductData((prev: any) => ({
            ...prev,
            [type === "image" ? "images" : "videos"]: prev?.[
              type === "image" ? "images" : "videos"
            ]?.filter((m: any) => m.id !== mediaId),
          }));
        }}
      />
      {productData && (
        <div className="flex gap-2">
          <EditAttributesDialog
            productId={id as string}
            attributes={productData.attributes || []}
            onUpdated={(newAttrs) =>
              setProductData((prev: any) => ({ ...prev, attributes: newAttrs }))
            }
          />
          <EditPriceTiersDialog
            productId={id as string}
            priceTiers={productData.priceTiers || []}
            onUpdated={(newTiers) =>
              setProductData((prev: any) => ({ ...prev, priceTiers: newTiers }))
            }
          />
        </div>
      )}
    </div>
  );
}
