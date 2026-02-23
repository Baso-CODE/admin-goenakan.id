"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiUrl } from "@/helper/apiurl";
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
  const { id } = useParams();
  const router = useRouter();

  const [productData, setProductData] = useState<any | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<any[]>([]);
  const [currentFullList, setCurrentFullList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch product data");

        const data = await res.json();
        console.log("ini adalah data ", data);

        setProductData(data);
      } catch (err) {
        console.error("Error fetching product data:", err);
        toast.error("Failed to load product data");
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateProduct = async (
    coreValues: ProductCoreFormValues,
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 1. Update core product
      const coreRes = await fetch(`${apiUrl}/products/${id}`, {
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
        err instanceof Error ? err.message : "Failed to update product",
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

      const res = await fetch(`${apiUrl}/products/${id}/attributes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const res = await fetch(`${apiUrl}/products/${id}/variants`, {
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
        err instanceof Error ? err.message : "Failed to update variants",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Di dalam EditProductPage.tsx

  const handleUpdateMediaMetadata = async (
    mediaId: string,
    updates: { altText?: string; isFeatured?: boolean },
  ) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/products/image/${mediaId}/seo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update image details");
      }

      // 1. Dapatkan data IMAGE yang sudah diupdate dari backend
      const updatedImage = await res.json();

      // 2. Update State secara Manual (Immutably)
      setProductData((prev: any) => {
        if (!prev) return prev;

        // Clone array images
        let newImages = [...prev.images];

        // Jika user mengubah isFeatured menjadi true, kita harus set false yang lain di state UI
        if (updates.isFeatured === true) {
          newImages = newImages.map((img) => ({
            ...img,
            isFeatured: false, // Reset semua jadi false dulu
          }));
        }

        // Update image yang spesifik dengan data baru dari backend
        newImages = newImages.map((img) =>
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
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/products/video/${mediaId}/seo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update video details");
      }

      // 1. Dapatkan data VIDEO yang sudah diupdate
      const updatedVideo = await res.json();

      // 2. Update State Manual
      setProductData((prev: any) => {
        if (!prev) return prev;

        let newVideos = [...prev.videos];

        // Reset isFeatured lain jika yang ini jadi featured
        if (updates.isFeatured === true) {
          newVideos = newVideos.map((vid) => ({
            ...vid,
            isFeatured: false,
          }));
        }

        // Update video target
        newVideos = newVideos.map((vid) =>
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
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const formData = new FormData();

      formData.append("image", file);

      const res = await fetch(`${apiUrl}/products/${id}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
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

  const handleAddVideo = async (file: File): Promise<void> => {
    setIsSubmitting(true); // Opsional: block UI saat upload
    try {
      // A. DIRECT UPLOAD KE CLOUDINARY (Frontend)
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      cloudinaryFormData.append("resource_type", "video");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: cloudinaryFormData,
        },
      );

      if (!uploadRes.ok) throw new Error("Gagal upload ke Cloudinary");
      const uploadData = await uploadRes.json();

      // B. KIRIM URL KE BACKEND UNTUK DISIMPAN
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Payload JSON (Bukan FormData lagi)
      const payload = {
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        title: file.name,
        altText: file.name,
        isFeatured: false,
      };

      const res = await fetch(`${apiUrl}/products/${id}/video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Header JSON
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
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
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/products/image/${mediaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete image");
      }

      const updatedProduct = await res.json();
      setProductData(updatedProduct); // Update state dengan data produk terbaru
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
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/products/video/${mediaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
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

    // 3. Format hasil menjadi objek yang mudah dibandingkan (contoh: 'Warna: Merah | Ukuran: XL')
    const formattedCombinations = rawCombinations.map((combination: any[]) => {
      const attributeMap: Record<string, string> = {}; // { attr_id: val_id }
      const nameParts: string[] = []; // ["Merah", "XL"]

      combination.forEach((val) => {
        attributeMap[val.attributeId] = val.id;
        nameParts.push(val.value); // Asumsi 'value' adalah nama atribut
      });

      return {
        attributeMap, // {attr_1: val_a, attr_2: val_b}
        variantName: nameParts.join(" • "), // "Merah • XL"
      };
    });

    return formattedCombinations;
  };

  // Fungsi Handler Utama di EditProductPage.tsx
  const handleGenerateVariants = () => {
    const newCombinations = generateCrossProduct(
      currentSelections,
      currentFullList,
    );

    // Ambil variants yang sudah ada
    const existingVariants = productData?.productVariants || [];

    const newVariantsState: any[] = [];
    const usedExistingVariantIds = new Set();

    // Helper untuk membuat signature variant (untuk perbandingan)
    const getVariantSignature = (variant: any) => {
      // Gabungkan semua ID nilai atribut menjadi string yang terurut
      const attributeIds = variant.attributeValues
        .map((av: any) => av.attributeValueId)
        .sort()
        .join("|");
      return attributeIds;
    };

    // 2. Loop melalui kombinasi BARU dan bandingkan dengan yang sudah ada
    for (const newComb of newCombinations) {
      // Buat signature baru
      const newCombAttributeIds = Object.values(newComb.attributeMap)
        .sort()
        .join("|");

      // Cari apakah kombinasi ini sudah ada
      const existingMatch = existingVariants.find((v: any) => {
        // Jika variant lama sudah ditandai dihapus, abaikan
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
          id: undefined, // Variant baru, tidak ada ID
          variantName: newComb.variantName,
          sku: "",
          price: 0,
          images: [],
          _isDeleted: false,
          // Simpan attributeValueIds yang akan diperlukan backend untuk menyimpan relasi
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
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(
        `${apiUrl}/products/${id}/price-tiers`, // Endpoint update (sesuaikan jika beda)
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tiers), // Kirim array tiers
        },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update price tiers");
      }

      toast.success("Price tiers updated successfully");

      // Refresh data agar UI terupdate
      const updatedProductRes = await fetch(`${apiUrl}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedProduct = await updatedProductRes.json();
      setProductData(updatedProduct);
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
