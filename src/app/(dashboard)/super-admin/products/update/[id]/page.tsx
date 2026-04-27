"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import FormUpdateAttributes from "../../components/update/AttributesSection";
import FormProductCore, {
  ProductCoreFormValues,
} from "../../components/update/CoreSection";
import FormUpdatePriceTiers from "../../components/update/FormUpdatePriceTier";
import FormUpdateProductMedia from "../../components/update/VariantMediaSection";
import FormUpdateVariants, {
  VariantFormValues,
} from "../../components/update/VariantsSection";

const CLOUDINARY_CLOUD_NAME = "do9sfnf5k";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

export default function EditProductPage() {
  const { fetchApi, status } = useApi(); // ✨ Ambil fetchApi dan status
  const { id } = useParams();
  const router = useRouter();

  const [productData, setProductData] = useState<any | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<any[]>([]);
  const [currentFullList, setCurrentFullList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || status === "loading") return;

      try {
        const res = await fetchApi(`/products/${id}`);

        if (!res.ok) throw new Error("Failed to fetch product data");

        const data = await res.json();

        setProductData(data);
      } catch (err) {
        console.error("Error fetching product data:", err);
        toast.error("Failed to load product data");
      }
    };

    fetchData();
  }, [id, status, fetchApi]); // Tambahkan dependensi useApi
  const handleUpdateProduct = async (
    coreValues: ProductCoreFormValues,
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      const coreRes = await fetchApi(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(coreValues),
      });

      if (!coreRes.ok) throw new Error("Failed to update core product data");

      toast.success("Product updated successfully!");
      router.push("/super-admin/products");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAttributes = async (payload: any) => {
    setIsSubmitting(true);
    try {
      // ✨ Gunakan fetchApi (Otomatis handle Base URL, Token, dan JSON Header)
      const res = await fetchApi(`/products/${id}/attributes`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

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

        v.images?.forEach((img) => {
          if (img._isDeleted) return;

          if (img.file && img.file instanceof File) {
            filesToUpload.push(img.file);

            variantImages.push({
              id: img.id, // null/undefined jika baru
              altText: img.altText,
              isFeatured: img.isFeatured,

              fileIndex: filesToUpload.length - 1,
            });
          } else {
            variantImages.push({
              id: img.id,
              altText: img.altText,
              isFeatured: img.isFeatured,
            });
          }
        });

        dtoVariants.push({
          variantId: v.id,
          variantName: v.variantName,
          description: v.description,
          sku: v.sku,
          price: v.price,
          stock: 0,

          weight: v.weight,
          width: v.width,
          height: v.height,
          length: v.length,
          // ---------------------------------
          attributeValueIds: v.attributeValueIds || [],
          images: variantImages,
        });
      });

      const dto = { productId: id, variants: dtoVariants };
      formData.append("data", JSON.stringify(dto));

      filesToUpload.forEach((file) => {
        formData.append("variantImages", file);
      });

      // 5. Kirim Request PUT menggunakan fetchApi
      const res = await fetchApi(`/products/${id}/variants`, {
        method: "PUT",
        body: formData,
      });

      // 6. Penanganan Respons
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update variants");
      }

      const updated = await res.json();

      toast.success("Variants updated successfully");

      setProductData((prev: any) => ({
        ...prev,
        variants: updated.variants,
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update variants",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMediaMetadata = async (
    mediaId: string,
    updates: { altText?: string; isFeatured?: boolean },
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/products/image/${mediaId}/seo`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update image details");
      }

      const updatedImage = await res.json();

      setProductData((prev: any) => {
        if (!prev) return prev;

        let newImages = [...prev.images];

        if (updates.isFeatured === true) {
          newImages = newImages.map((img: any) => ({
            ...img,
            isFeatured: false,
          }));
        }

        newImages = newImages.map((img: any) =>
          img.id === mediaId ? { ...img, ...updatedImage } : img,
        );

        return {
          ...prev,
          images: newImages,
        };
      });

      toast.success("Detail gambar berhasil diperbarui");
    } catch (err) {
      console.error("Error updating media:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui detail gambar",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVideoMetadata = async (
    mediaId: string,
    updates: { altText?: string; title?: string; isFeatured?: boolean },
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/products/video/${mediaId}/seo`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update video details");
      }

      const updatedVideo = await res.json();

      setProductData((prev: any) => {
        if (!prev) return prev;

        let newVideos = [...prev.videos];

        if (updates.isFeatured === true) {
          newVideos = newVideos.map((vid: any) => ({
            ...vid,
            isFeatured: false,
          }));
        }

        newVideos = newVideos.map((vid: any) =>
          vid.id === mediaId ? { ...vid, ...updatedVideo } : vid,
        );

        return {
          ...prev,
          videos: newVideos,
        };
      });

      toast.success("Detail video berhasil diperbarui");
    } catch (err) {
      console.error("Error updating video metadata:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui detail video",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImage = async (file: File): Promise<void> => {
    try {
      // ✨ Gunakan fetchApi (Otomatis handle Base URL, Token, dan deteksi FormData)
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetchApi(`/products/${id}/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add image");
      }

      const updatedProduct = await res.json();
      setProductData(updatedProduct);
      toast.success("Gambar berhasil diunggah!");
    } catch (err) {
      console.error("Error adding image:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan gambar",
      );
    }
  };

  const handleAddVideo = async (
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<void> => {
    setIsSubmitting(true);
    try {
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      cloudinaryFormData.append("resource_type", "video");

      const uploadData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", cloudinaryUrl, true);

        // Track Progress Upload
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;

            if (onProgress) {
              onProgress(percentComplete);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Gagal upload ke Cloudinary: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () =>
          reject(new Error("Network Error saat upload ke Cloudinary"));

        xhr.send(cloudinaryFormData);
      });

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const payload = {
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        title: file.name,
        altText: file.name,
        isFeatured: false,
      };

      const res = await fetchApi(`/products/${id}/video`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save video data");
      }

      // C. Update UI
      const updatedProduct = await res.json();
      setProductData(updatedProduct);
      toast.success("Video berhasil ditambahkan!");
    } catch (err) {
      console.error("Error adding video:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan video",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async (mediaId: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi(`/products/image/${mediaId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete image");
      }

      const updatedProduct = await res.json();
      // setProductData(updatedProduct);
      toast.success("Gambar berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus gambar",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (mediaId: string): Promise<void> => {
    setIsSubmitting(true);
    try {
      // ✨ Gunakan fetchApi (Otomatis menangani Base URL dan Token)
      const res = await fetchApi(`/products/video/${mediaId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete video");
      }

      const updatedProduct = await res.json();
      setProductData(updatedProduct);
      toast.success("Video berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting video:", err);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus video");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi utilitas untuk menghasilkan Cross Product dari Attribute Selections
  const generateCrossProduct = (selections: any[], fullList: any[]) => {
    if (selections.length === 0) return [];

    // 1. Filter fullList menjadi hanya atribut yang dipilih (selections)
    const activeAttributes = fullList
      .filter((attr) => selections.some((sel) => sel.attributeId === attr.id))
      .map((attr) => ({
        ...attr,
        // Filter values hanya yang dipilih
        values: attr.values.filter((val: any) =>
          selections
            .find((sel) => sel.attributeId === attr.id)
            ?.valueIds.includes(val.id),
        ),
      }))
      .filter((attr) => attr.values.length > 0);

    // Jika tidak ada nilai yang dipilih, kembalikan kosong
    if (activeAttributes.length === 0) return [];

    // 2. Lakukan Cross Product
    const combine = (arr: any[]) => {
      if (arr.length === 0) return [];
      if (arr.length === 1) return arr[0].values.map((v: any) => [v]);

      const [first, ...rest] = arr;
      const subCombinations = combine(rest);

      const combinations: any[] = [];
      for (const val of first.values) {
        for (const sub of subCombinations) {
          combinations.push([val, ...(Array.isArray(sub) ? sub : [sub])]);
        }
      }
      return combinations;
    };

    const rawCombinations = combine(activeAttributes);

    const formattedCombinations = rawCombinations.map((combination: any[]) => {
      const attributeMap: Record<string, string> = {};
      const nameParts: string[] = [];

      combination.forEach((val) => {
        attributeMap[val.attributeId] = val.id;
        nameParts.push(val.value);
      });

      return {
        attributeMap,
        variantName: nameParts.join(" • "),
      };
    });

    return formattedCombinations;
  };

  const handleGenerateVariants = () => {
    const newCombinations = generateCrossProduct(
      currentSelections,
      currentFullList,
    );

    const existingVariants = productData?.productVariants || [];

    const newVariantsState: any[] = [];
    const usedExistingVariantIds = new Set();

    const getVariantSignature = (variant: any) => {
      const attributeIds = variant.attributeValues
        .map((av: any) => av.attributeValueId)
        .sort()
        .join("|");
      return attributeIds;
    };

    for (const newComb of newCombinations) {
      const newCombAttributeIds = Object.values(newComb.attributeMap)
        .sort()
        .join("|");

      const existingMatch = existingVariants.find((v: any) => {
        if (v._isDeleted) return false;

        // Cek apakah signature atributnya cocok
        const existingSignature = getVariantSignature(v);
        return existingSignature === newCombAttributeIds;
      });

      if (existingMatch) {
        newVariantsState.push({
          ...existingMatch,
          _isDeleted: false,
        });
        usedExistingVariantIds.add(existingMatch.id);
      } else {
        // B. Variant BARU DIBUAT
        newVariantsState.push({
          id: undefined,
          variantName: newComb.variantName,
          sku: "",
          price: 0,
          images: [],
          _isDeleted: false,

          attributeValueIds: Object.values(newComb.attributeMap),
        });
      }
    }

    const variantsToKeep = existingVariants
      .filter((v: any) => !usedExistingVariantIds.has(v.id))
      .map((v: any) => ({
        ...v,
        _isDeleted: true,
      }));

    const finalVariantsState = [...variantsToKeep, ...newVariantsState];

    setProductData((prev: any) => ({
      ...prev,
      productVariants: finalVariantsState,
    }));

    toast.info(
      `Generated ${newCombinations.length} variants. Check form below.`,
    );
  };

  // HANDLER BARU: Update Price Tiers
  const handleUpdatePriceTiers = async (tiers: any[]) => {
    setIsSubmitting(true);
    try {
      // ✨ Gunakan fetchApi (Otomatis handle Base URL, Token, dan JSON Header)
      const res = await fetchApi(`/products/${id}/price-tiers`, {
        method: "PUT",
        body: JSON.stringify(tiers), // Kirim array tiers
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update price tiers");
      }

      toast.success("Price tiers updated successfully");

      // ✨ Refresh data menggunakan fetchApi
      const updatedProductRes = await fetchApi(`/products/${id}`);

      if (updatedProductRes.ok) {
        const updatedProduct = await updatedProductRes.json();
        setProductData(updatedProduct.data || updatedProduct);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update tiers",
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

      <FormUpdatePriceTiers
        initialData={productData}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdatePriceTiers}
      />

      <FormUpdateProductMedia
        productId={id as string}
        initialData={productData}
        isSubmitting={isSubmitting}
        onAddImage={handleAddImage}
        onDeleteImage={handleDeleteImage}
        onAddVideo={handleAddVideo}
        onDeleteVideo={handleDeleteVideo}
        onUpdateMediaMetadata={handleUpdateMediaMetadata}
        onUpdateVideoMetadata={handleUpdateVideoMetadata}
      />
      <FormUpdateAttributes
        initialData={productData}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdateAttributes}
        onAttributesChange={(selections, fullList) => {
          setCurrentSelections(selections);
          setCurrentFullList(fullList);
        }}
      />
      <FormUpdateVariants
        initialData={productData}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdateVariants}
        onGenerateClick={handleGenerateVariants}
      />
    </div>
  );
}
