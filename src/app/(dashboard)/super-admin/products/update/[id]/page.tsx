"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EditPriceTiersDialog } from "../../components/EditPriceTiersDialog";
import FormProductCore, {
  ProductCoreFormValues,
} from "../../components/update/CoreSection";
import FormUpdateAttributes from "../../components/update/AttributesSection";
import FormUpdateVariants, {
  VariantFormValues,
} from "../../components/update/VariantsSection";
import FormUpdateVariantImages from "../../components/update/VariantImagesSection";

type FileUploads = {
  images?: FileList;
  videos?: FileList;
};

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [productData, setProductData] = useState<any | undefined>();
  console.log("ini adalah product data", productData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`http://localhost:8000/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch product data");

        const data = await res.json();
        console.log("ini adalah data ", data);

        setProductData(data);
      } catch (err) {
        console.error("Error fetching product data:", err);
        toast.error("Failed to load product data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateProduct = async (
    coreValues: ProductCoreFormValues
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 1. Update core product
      const coreRes = await fetch(`http://localhost:8000/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coreValues),
      });

      if (!coreRes.ok) throw new Error("Failed to update core product data");

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

  const handleUpdateAttributes = async (payload: any) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(
        `http://localhost:8000/products/${id}/update-attributes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to update attributes");

      toast.success("Attributes updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update attributes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVariants = async (values: VariantFormValues) => {
    setIsSubmitting(true);

    try {
      // 1. Dapatkan Token Otentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Persiapan Data untuk FormData
      const formData = new FormData();
      const filesToUpload: File[] = [];
      const dtoVariants: any[] = [];

      values.variants.forEach((v) => {
        if (v._isDeleted) {
          dtoVariants.push({
            variantId: v.id,
            _isDeleted: true,
          });
          return;
        }

        const variantImages: any[] = [];

        // Proses Gambar dalam Varian
        v.images?.forEach((img) => {
          if (img._isDeleted) return; // Lewati gambar yang ditandai dihapus

          if (img.file && img.file instanceof File) {
            // Jika ini adalah file baru:

            // 1. Tambahkan File ke array global filesToUpload
            filesToUpload.push(img.file);

            // 2. Tambahkan metadata gambar ke DTO dengan 'fileIndex' global
            variantImages.push({
              id: img.id, // null/undefined jika baru
              altText: img.altText,
              isFeatured: img.isFeatured,
              // fileIndex = index file ini di dalam array filesToUpload
              fileIndex: filesToUpload.length - 1,
            });
          } else {
            // Jika ini adalah gambar lama (dari DB), tambahkan metadata tanpa fileIndex
            variantImages.push({
              id: img.id,
              altText: img.altText,
              isFeatured: img.isFeatured,
            });
          }
        });

        // Tambahkan Data Varian ke DTO
        dtoVariants.push({
          variantId: v.id,
          variantName: v.variantName,
          sku: v.sku,
          price: v.price,

          stock: 0,
          attributeValueIds: [],
          images: variantImages,
        });
      });

      const dto = { productId: id, variants: dtoVariants };
      formData.append("data", JSON.stringify(dto));

      filesToUpload.forEach((file) => {
        formData.append("variantImages", file);
      });

      // 5. Kirim Request PUT
      const res = await fetch(`http://localhost:8000/products/${id}/variants`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // 6. Penanganan Respons
      if (!res.ok) {
        const errorData = await res.json();
        // Lemparkan pesan error yang lebih spesifik dari backend
        throw new Error(errorData.message || "Failed to update variants");
      }

      const updated = await res.json();

      toast.success("Variants updated successfully");

      // Perbarui data produk di state
      setProductData((prev: any) => ({
        ...prev,
        variants: updated.variants, // Pastikan backend mengembalikan data varian terbaru
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update variants"
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

      <FormProductCore
        initialData={productData}
        onSubmit={handleUpdateProduct}
        isSubmitting={isSubmitting}
      />

      <FormUpdateAttributes
        initialData={productData}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdateAttributes}
      />

      <FormUpdateVariants
        initialData={productData}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdateVariants}
      />

      {/* ----------- EXTRA DIALOGS ----------- */}
      {/* {productData && (
        <div className="flex gap-2 pt-3">
          <EditPriceTiersDialog
            productId={id as string}
            priceTiers={productData.priceTiers || []}
            onUpdated={(newTiers) =>
              setProductData((prev: any) => ({
                ...prev,
                priceTiers: newTiers,
              }))
            }
          />
        </div>
      )} */}
    </div>
  );
}
