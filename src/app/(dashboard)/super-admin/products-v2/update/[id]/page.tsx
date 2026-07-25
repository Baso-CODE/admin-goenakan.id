"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { fetchApi, status } = useApi();
  const { id } = useParams();
  const router = useRouter();

  const [productData, setProductData] = useState<any | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<any[]>([]);
  const [currentFullList, setCurrentFullList] = useState<any[]>([]);

  const fetchProductData = async () => {
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

  useEffect(() => {
    fetchProductData();
  }, [id, status, fetchApi]);
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
      router.push("/super-admin/products-v2");
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
      const res = await fetchApi(`/products/${id}/attributes`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update attributes");

      toast.success("Attributes updated");
      await fetchProductData();
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
              id: img.id,
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
          stock: v.stock,
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
        productVariants: updated.variants,
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
    updates: {
      altText?: string;
      isFeatured?: boolean;
      attributeValueId?: string | null;
      printPositionValueId?: string | null;
      printSideValueId?: string | null;
      mockupSideName?: string | null;
    },
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

  const handleUpdateMediaMockups = async (
    mediaId: string,
    mockupAreas: any[],
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/products/image/${mediaId}/mockups`, {
        method: "PUT",
        body: JSON.stringify({ mockupAreas }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update mockup areas");
      }

      const responseData = await res.json();
      const updatedMockupAreas = responseData.data || responseData;

      setProductData((prev: any) => {
        if (!prev) return prev;

        const newImages = prev.images.map((img: any) =>
          img.id === mediaId
            ? { ...img, mockupAreas: updatedMockupAreas }
            : img,
        );

        return {
          ...prev,
          images: newImages,
        };
      });

      toast.success("Mockup areas updated successfully!");
    } catch (err) {
      console.error("Error updating mockup areas:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update mockup areas",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMockupSettings = async (settings: {
    isMultiFace: boolean;
    mockupFrontImageId: string | null;
    mockupBackImageId: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to update mockup settings",
        );
      }

      const updatedProduct = await res.json();
      setProductData((prev: any) => ({
        ...prev,
        isMultiFace: updatedProduct.isMultiFace,
        mockupFrontImageId: updatedProduct.mockupFrontImageId,
        mockupBackImageId: updatedProduct.mockupBackImageId,
      }));

      toast.success("Pengaturan mockup berhasil disimpan!");
    } catch (err) {
      console.error("Error updating mockup settings:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan mockup",
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

  const handleAddImage = async (file: File): Promise<any> => {
    try {
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

      const newImage = updatedProduct.images[updatedProduct.images.length - 1];
      return newImage;
    } catch (err) {
      console.error("Error adding image:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan gambar",
      );
      throw err;
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

  const generateCrossProduct = (selections: any[], fullList: any[]) => {
    const variantGeneratingSelections = selections.filter(
      (sel) => sel.isVariantGenerator !== false,
    );
    if (variantGeneratingSelections.length === 0) return [];
    const activeAttributes = fullList
      .filter((attr) =>
        variantGeneratingSelections.some((sel) => sel.attributeId === attr.id),
      )
      .map((attr) => ({
        ...attr,
        // Filter values hanya yang dipilih
        values: attr.values.filter((val: any) =>
          variantGeneratingSelections
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
        const valText = val.value.includes("|")
          ? val.value.split("|")[0]
          : val.value;
        nameParts.push(valText);
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
      if (variant.attributeValues) {
        return variant.attributeValues
          .map((av: any) => av.attributeValueId)
          .sort()
          .join("|");
      }
      if (variant.attributeValueIds) {
        return [...variant.attributeValueIds].sort().join("|");
      }
      return "";
    };

    for (const newComb of newCombinations) {
      const valueIdsInCombo = Object.values(newComb.attributeMap) as string[];
      const newCombAttributeIds = Object.values(newComb.attributeMap)
        .sort()
        .join("|");

      const existingMatch = existingVariants.find((v: any) => {
        if (v._isDeleted) return false;

        // Cek apakah signature atributnya cocok
        const existingSignature = getVariantSignature(v);
        if (existingSignature && existingSignature !== "") {
          return existingSignature === newCombAttributeIds;
        }

        // Fallback: Cocokkan berdasarkan nama (case-insensitive, normalize separators)
        const normalizeName = (name: string) =>
          name?.toLowerCase().replace(/[\s•·\-\/]/g, "") || "";
        return (
          normalizeName(v.variantName) === normalizeName(newComb.variantName)
        );
      });

      if (existingMatch) {
        newVariantsState.push({
          ...existingMatch,
          _isDeleted: false,
          attributeValueIds: valueIdsInCombo,
        });
        usedExistingVariantIds.add(existingMatch.id);
      } else {
        // B. Variant BARU DIBUAT
        let modifierSum = 0;
        currentSelections.forEach((selection: any) => {
          if (selection.isVariantGenerator !== false) {
            selection.valueIds.forEach((valId: string) => {
              if (valueIdsInCombo.includes(valId)) {
                const modVal = selection.priceModifiers?.[valId];
                if (modVal !== undefined) {
                  modifierSum += Number(modVal) || 0;
                }
              }
            });
          }
        });

        const basePrice = Number(productData?.basePrice) || 0;

        newVariantsState.push({
          id: undefined,
          variantName: newComb.variantName,
          sku: "",
          price: basePrice + modifierSum,
          images: [],
          _isDeleted: false,

          attributeValueIds: valueIdsInCombo,
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
      const res = await fetchApi(`/products/${id}/price-tiers`, {
        method: "PUT",
        body: JSON.stringify(tiers),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update price tiers");
      }

      toast.success("Price tiers updated successfully");

      //  Refresh data menggunakan fetchApi
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
    <div className="space-y-6 w-full max-w-full">
      <div className="border-b pb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight uppercase">
          Edit Produk
        </h2>
      </div>

      <Tabs defaultValue="identity" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <TabsTrigger
            value="identity"
            className="font-semibold text-xs sm:text-sm">
            1. Informasi Utama
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="font-semibold text-xs sm:text-sm">
            2. Media & Visual
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="font-semibold text-xs sm:text-sm">
            3. Harga & Tiers
          </TabsTrigger>
          <TabsTrigger
            value="customization"
            disabled={!productData?.isCustom}
            className="font-semibold text-xs sm:text-sm">
            4. Kustomisasi & Varian
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="identity"
          className="space-y-6 animate-fade-in focus-visible:outline-none">
          <FormProductCore
            initialData={productData}
            onSubmit={handleUpdateProduct}
            isSubmitting={isSubmitting}
          />
        </TabsContent>

        <TabsContent
          value="media"
          className="space-y-6 animate-fade-in focus-visible:outline-none">
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
        </TabsContent>

        <TabsContent
          value="pricing"
          className="space-y-6 animate-fade-in focus-visible:outline-none">
          <FormUpdatePriceTiers
            initialData={productData}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdatePriceTiers}
          />
        </TabsContent>

        <TabsContent
          value="customization"
          className="space-y-6 animate-fade-in focus-visible:outline-none">
          <FormUpdateAttributes
            initialData={productData}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdateAttributes}
            onAttributesChange={(selections, fullList) => {
              setCurrentSelections(selections);
              setCurrentFullList(fullList);
            }}
            onUpdateMediaMockups={handleUpdateMediaMockups}
            onUpdateMockupSettings={handleUpdateMockupSettings}
            onUpdateMediaMetadata={handleUpdateMediaMetadata}
            onAddImage={handleAddImage}
          />
          <FormUpdateVariants
            initialData={productData}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdateVariants}
            onGenerateClick={handleGenerateVariants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
