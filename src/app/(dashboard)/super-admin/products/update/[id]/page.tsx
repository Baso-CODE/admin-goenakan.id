"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ColorValueInput } from "@/components/ui/color-value-input";
import { parseColorValue } from "@/utils/colorConverter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/helper/apiurl";
import { getSession } from "next-auth/react";
import FormUpdateAttributes from "../../components/update/AttributesSection";
import FormProductCore, {
  ProductCoreFormValues,
} from "../../components/update/CoreSection";
import FormUpdatePriceTiers from "../../components/update/FormUpdatePriceTier";
import FormUpdateProductMedia from "../../components/update/VariantMediaSection";
import FormUpdateVariants, {
  VariantFormValues,
} from "../../components/update/VariantsSection";
import { ModelShapeValueInput } from "../../components/AttributeSelector";
import { isMockupImage } from "@/helper/mediaFilter";

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
  const [isGenModalOpen, setIsGenModalOpen] = useState<boolean>(false);
  const [activeGroupFilters, setActiveGroupFilters] = useState<Record<string, Record<string, string[]>>>({});
  const [inlineInputAttrId, setInlineInputAttrId] = useState<string | null>(null);
  const [inlineInputGroupId, setInlineInputGroupId] = useState<string | null>(null);
  const [inlineInputValue, setInlineInputValue] = useState<string>("");
  const [inlineInputPrice, setInlineInputPrice] = useState<string>("");

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
      colorMaskFile?: File | null;
      deleteColorMask?: boolean;
    },
  ) => {
    setIsSubmitting(true);
    try {
      // 1. Upload color mask first if present
      if (updates.colorMaskFile) {
        const maskFormData = new FormData();
        maskFormData.append("colorMask", updates.colorMaskFile);
        const uploadRes = await fetchApi(`/products/image/${mediaId}/color-mask`, {
          method: "POST",
          body: maskFormData,
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload color mask");
        }
      }

      // 2. Perform metadata PATCH update
      const { colorMaskFile, ...metaUpdates } = updates;

      const res = await fetchApi(`/products/image/${mediaId}/seo`, {
        method: "PATCH",
        body: JSON.stringify(metaUpdates),
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

  const handleAddImage = async (
    fileOrUrl: File | string,
    onProgress?: (progress: number) => void,
    altText?: string,
    extraMeta?: {
      mockupSideName?: string | null;
      attributeValueId?: string | null;
      printPositionValueId?: string | null;
      printSideValueId?: string | null;
    },
  ): Promise<any> => {
    try {
      const currentSession = await getSession();
      const currentToken = currentSession?.user?.accessToken;

      if (fileOrUrl instanceof File) {
        const formData = new FormData();
        formData.append("image", fileOrUrl);
        if (altText) {
          formData.append("altText", altText);
        }
        if (extraMeta?.mockupSideName) {
          formData.append("mockupSideName", extraMeta.mockupSideName);
        }
        if (extraMeta?.attributeValueId) {
          formData.append("attributeValueId", extraMeta.attributeValueId);
        }
        if (extraMeta?.printPositionValueId) {
          formData.append("printPositionValueId", extraMeta.printPositionValueId);
        }
        if (extraMeta?.printSideValueId) {
          formData.append("printSideValueId", extraMeta.printSideValueId);
        }

        const uploadData = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${apiUrl}/products/${id}/image`, true);

          if (currentToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${currentToken}`);
          }

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
              try {
                const errJson = JSON.parse(xhr.responseText);
                reject(new Error(errJson.message || "Failed to add image"));
              } catch {
                reject(new Error(`Gagal upload image: ${xhr.statusText}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network Error saat upload image"));
          xhr.send(formData);
        });

        setProductData(uploadData);
        toast.success("Gambar berhasil ditambahkan!");

        const oldImageIds = new Set((productData?.images || []).map((img: any) => img.id));
        const newImage = uploadData.images.find((img: any) => !oldImageIds.has(img.id)) || uploadData.images[uploadData.images.length - 1];
        return newImage;
      } else {
        const formData = new FormData();
        formData.append("url", fileOrUrl);
        if (altText) {
          formData.append("altText", altText);
        }
        if (extraMeta?.mockupSideName) {
          formData.append("mockupSideName", extraMeta.mockupSideName);
        }
        if (extraMeta?.attributeValueId) {
          formData.append("attributeValueId", extraMeta.attributeValueId);
        }
        if (extraMeta?.printPositionValueId) {
          formData.append("printPositionValueId", extraMeta.printPositionValueId);
        }
        if (extraMeta?.printSideValueId) {
          formData.append("printSideValueId", extraMeta.printSideValueId);
        }

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
        toast.success("Gambar berhasil ditambahkan!");

        const oldImageIds = new Set((productData?.images || []).map((img: any) => img.id));
        const newImage = updatedProduct.images.find((img: any) => !oldImageIds.has(img.id)) || updatedProduct.images[updatedProduct.images.length - 1];
        return newImage;
      }
    } catch (err) {
      console.error("Error adding image:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan gambar",
      );
      throw err;
    }
  };

  const handleAddMultipleImages = async (
    files: File[],
    onProgress?: (progress: number) => void,
  ): Promise<void> => {
    try {
      const currentSession = await getSession();
      const currentToken = currentSession?.user?.accessToken;

      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const uploadData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiUrl}/products/${id}/images`, true);

        if (currentToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${currentToken}`);
        }

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
            try {
              const errJson = JSON.parse(xhr.responseText);
              reject(new Error(errJson.message || "Failed to add images"));
            } catch {
              reject(new Error(`Gagal upload images: ${xhr.statusText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network Error saat upload images"));
        xhr.send(formData);
      });

      setProductData(uploadData);
      toast.success(`${files.length} gambar berhasil ditambahkan!`);
    } catch (err) {
      console.error("Error adding multiple images:", err);
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan gambar",
      );
      throw err;
    }
  };

  const handleReorderMedia = async (
    type: "image" | "video",
    orderedIds: string[],
  ): Promise<void> => {
    const previousProductData = productData;

    // Optimistic Update
    setProductData((prev: any) => {
      if (!prev) return prev;
      if (type === "image") {
        const mockupImages = (prev.images || []).filter(isMockupImage);
        const map = new Map((prev.images || []).map((img: any) => [img.id, img]));
        const reordered = orderedIds.map((imgId) => map.get(imgId)).filter(Boolean);
        return { ...prev, images: [...reordered, ...mockupImages] };
      } else {
        const map = new Map((prev.videos || []).map((vid: any) => [vid.id, vid]));
        const reordered = orderedIds.map((vidId) => map.get(vidId)).filter(Boolean);
        return { ...prev, videos: reordered };
      }
    });

    try {
      const res = await fetchApi(`/products/${id}/media-order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderedIds }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to save media order");
      }

      const updated = await res.json();
      setProductData(updated);
      toast.success(`Urutan ${type === "image" ? "gambar" : "video"} berhasil diperbarui!`);
    } catch (err) {
      console.error("Error reordering media:", err);
      // Rollback
      setProductData(previousProductData);
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui urutan media",
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
      setProductData(updatedProduct);
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
    const variantGeneratingSelections = currentSelections.filter(
      (sel) => sel.isVariantGenerator !== false
    );
    if (variantGeneratingSelections.length === 0) return;

    const primarySelection = variantGeneratingSelections[0];
    if (!primarySelection.valueIds.length) {
      return toast.error("Harap isi nilai untuk atribut utama.");
    }

    const initialFilters: Record<string, Record<string, string[]>> = {};
    primarySelection.valueIds.forEach((primValId: string) => {
      initialFilters[primValId] = {};
      variantGeneratingSelections.slice(1).forEach((sel) => {
        initialFilters[primValId][sel.attributeId] = [...sel.valueIds];
      });
    });

    setActiveGroupFilters(initialFilters);
    setIsGenModalOpen(true);
  };

  const handleConfirmVariantGeneration = () => {
    const variantGeneratingSelections = currentSelections.filter(
      (sel) => sel.isVariantGenerator !== false
    );
    const primarySelection = variantGeneratingSelections[0];
    const otherSelections = variantGeneratingSelections.slice(1);

    const cartesianProduct = (a: any[]): any[] => {
      return a.reduce((co, b) => co.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    };

    const finalCombos: { attributeMap: Record<string, string>; variantName: string }[] = [];

    primarySelection.valueIds.forEach((primValId: string) => {
      const activeGroups = otherSelections.map((sel) => activeGroupFilters[primValId]?.[sel.attributeId] || []);

      let primCombos: string[][] = [];
      if (activeGroups.length === 0) {
        primCombos = [[primValId]];
      } else if (activeGroups.some((g) => g.length === 0)) {
        return; // skip
      } else {
        const product = cartesianProduct(activeGroups);
        primCombos = product.map((p) => [primValId, ...(Array.isArray(p) ? p : [p])]);
      }

      // Filter based on parentValueId
      const filteredPrimCombos = primCombos.filter((combo) => {
        for (const valueId of combo) {
          let foundAttr: any = null;
          for (const attr of currentFullList) {
            const val = attr.values.find((v: any) => v.id === valueId);
            if (val) {
              foundAttr = attr;
              break;
            }
          }

          if (foundAttr && foundAttr.parentValueId) {
            if (!combo.includes(foundAttr.parentValueId)) {
              return false;
            }
          }
        }
        return true;
      });

      filteredPrimCombos.forEach((combo) => {
        const attributeMap: Record<string, string> = {};
        const nameParts: string[] = [];

        combo.forEach((valueId) => {
          let foundAttr: any = null;
          for (const attr of currentFullList) {
            const val = attr.values.find((v: any) => v.id === valueId);
            if (val) {
              foundAttr = attr;
              const valText = val.value.includes("|") ? val.value.split("|")[0] : val.value;
              nameParts.push(valText);
              attributeMap[attr.id] = val.id;
              break;
            }
          }
        });

        finalCombos.push({
          attributeMap,
          variantName: nameParts.join(" • "),
        });
      });
    });

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

    for (const newComb of finalCombos) {
      const valueIdsInCombo = Object.values(newComb.attributeMap) as string[];
      const newCombAttributeIds = Object.values(newComb.attributeMap)
        .sort()
        .join("|");

      const existingMatch = existingVariants.find((v: any) => {
        if (v._isDeleted) return false;

        const existingSignature = getVariantSignature(v);
        if (existingSignature && existingSignature !== "") {
          return existingSignature === newCombAttributeIds;
        }

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
      `Generated ${finalCombos.length} variants. Check form below.`,
    );
    setIsGenModalOpen(false);
  };

  const handleAddAttributeValueInline = async (attributeId: string, newValueName: string, primValId: string, priceModifier?: string) => {
    const attr = currentFullList.find((a) => a.id === attributeId);
    if (!attr) return toast.error("Attribute not found.");

    const formattedValues = attr.values.map((v: any) => ({
      id: v.id,
      value: v.value,
      position: v.position || 0,
    }));

    const nextPosition = formattedValues.length;
    formattedValues.push({
      value: newValueName.trim(),
      position: nextPosition,
    });

    try {
      const res = await fetchApi(`/product-attributes/${attributeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: attr.name,
          type: attr.type || "TEXT",
          values: formattedValues,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add value.");
      }

      const updatedAttr = await res.json();
      
      const nextFullList = currentFullList.map((a) => (a.id === attributeId ? updatedAttr : a));
      setCurrentFullList(nextFullList);

      const newValueObj = updatedAttr.values.find((v: any) => v.value === newValueName.trim());
      if (newValueObj) {
        const nextSelections = currentSelections.map((sel) => {
          if (sel.attributeId === attributeId) {
            const nextModifiers = { ...sel.priceModifiers };
            if (priceModifier && priceModifier.trim() !== "") {
              nextModifiers[newValueObj.id] = Number(priceModifier) || 0;
            }
            return {
              ...sel,
              valueIds: [...sel.valueIds, newValueObj.id],
              priceModifiers: nextModifiers,
            };
          }
          return sel;
        });
        setCurrentSelections(nextSelections);

        setActiveGroupFilters((prev) => {
          const nextFilters = { ...prev };
          if (nextFilters[primValId]) {
            if (!nextFilters[primValId][attributeId]) {
              nextFilters[primValId][attributeId] = [];
            }
            nextFilters[primValId][attributeId] = [...nextFilters[primValId][attributeId], newValueObj.id];
          }
          return nextFilters;
        });

        toast.success(`Berhasil menambahkan nilai "${newValueName}"`);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan nilai atribut.");
    }
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
          forceMount
          className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
          <FormProductCore
            initialData={productData}
            onSubmit={handleUpdateProduct}
            isSubmitting={isSubmitting}
          />
        </TabsContent>

        <TabsContent
          value="media"
          forceMount
          className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
          <FormUpdateProductMedia
            productId={id as string}
            initialData={productData ? {
              ...productData,
              images: (productData.images || []).filter((img: any) => !isMockupImage(img))
            } : undefined}
            isSubmitting={isSubmitting}
            onAddImage={handleAddImage}
            onAddMultipleImages={handleAddMultipleImages}
            onDeleteImage={handleDeleteImage}
            onAddVideo={handleAddVideo}
            onDeleteVideo={handleDeleteVideo}
            onUpdateMediaMetadata={handleUpdateMediaMetadata}
            onUpdateVideoMetadata={handleUpdateVideoMetadata}
            onReorderMedia={handleReorderMedia}
          />
        </TabsContent>

        <TabsContent
          value="pricing"
          forceMount
          className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
          <FormUpdatePriceTiers
            initialData={productData}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdatePriceTiers}
          />
        </TabsContent>

        <TabsContent
          value="customization"
          forceMount
          className="space-y-6 animate-fade-in focus-visible:outline-none data-[state=inactive]:hidden">
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
            onRefresh={fetchProductData}
          />
          <FormUpdateVariants
            initialData={productData}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdateVariants}
            onGenerateClick={handleGenerateVariants}
          />
        </TabsContent>
      </Tabs>

      {/* CHECKLIST GROUPED FILTER MODAL */}
      <Dialog open={isGenModalOpen} onOpenChange={isGenModalOpen ? () => setIsGenModalOpen(false) : setIsGenModalOpen}>
        <DialogContent className="max-w-3xl bg-white border shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900">
              Atur Filter Kombinasi Varian
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1.5">
              Pilih kombinasi atribut yang valid untuk masing-masing item utama di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2 py-4">
            {(() => {
              const variantGeneratingSelections = currentSelections.filter((sel) => sel.isVariantGenerator !== false);
              const primarySelection = variantGeneratingSelections[0];
              const otherSelections = variantGeneratingSelections.slice(1);
              const primaryAttr = currentFullList.find((a) => a.id === primarySelection?.attributeId);

              if (!primarySelection || !primaryAttr) return null;

              return primarySelection.valueIds.map((primValId: string) => {
                const primVal = primaryAttr.values.find((v: any) => v.id === primValId);
                if (!primVal) return null;

                const primValLabel = primVal.value.split("|")[0];

                return (
                  <div key={primValId} className="border rounded-xl p-5 bg-stone-50/50 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-650"></span>
                        {primaryAttr.name}: {primValLabel}
                      </h4>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setActiveGroupFilters((prev: any) => {
                              const next = { ...prev };
                              next[primValId] = {};
                              otherSelections.forEach((sel: any) => {
                                next[primValId][sel.attributeId] = [...sel.valueIds];
                              });
                              return next;
                            });
                          }}
                          className="text-[10px] h-6 px-2 font-bold"
                        >
                          Pilih Semua
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setActiveGroupFilters((prev: any) => {
                              const next = { ...prev };
                              next[primValId] = {};
                              otherSelections.forEach((sel: any) => {
                                next[primValId][sel.attributeId] = [];
                              });
                              return next;
                            });
                          }}
                          className="text-[10px] h-6 px-2 font-bold text-red-650 hover:bg-red-50"
                        >
                          Kosongkan
                        </Button>
                      </div>
                    </div>

                    {otherSelections.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Tidak ada sub-atribut untuk difilter.</p>
                    ) : (
                      <div className="space-y-4">
                        {otherSelections.map((sel: any) => {
                          const attr = currentFullList.find((a: any) => a.id === sel.attributeId);
                          if (!attr) return null;

                          const activeList = activeGroupFilters[primValId]?.[sel.attributeId] || [];

                          return (
                            <div key={sel.attributeId} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{attr.name}</span>
                                {!(inlineInputAttrId === sel.attributeId && inlineInputGroupId === primValId) && (
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="text-[10px] p-0 h-auto font-bold text-primary hover:text-primary/90"
                                    onClick={() => {
                                      setInlineInputAttrId(sel.attributeId);
                                      setInlineInputGroupId(primValId);
                                      setInlineInputValue("");
                                      setInlineInputPrice("");
                                    }}
                                  >
                                    + Tambah Nilai
                                  </Button>
                                )}
                              </div>

                              {inlineInputAttrId === sel.attributeId && inlineInputGroupId === primValId && (
                                <div className="p-3 border border-stone-200 bg-stone-50/50 rounded-xl space-y-3 w-full max-w-sm">
                                  <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
                                    Tambah Nilai untuk {attr.name}
                                  </span>
                                  {attr.type === "COLOR" ? (
                                    <ColorValueInput
                                      value={inlineInputValue}
                                      onChange={(val) => setInlineInputValue(val)}
                                    />
                                  ) : (attr.type === "MODEL_SHAPE" || attr.type === "SIZE") ? (
                                    <ModelShapeValueInput
                                      value={inlineInputValue}
                                      onChange={(val) => setInlineInputValue(val)}
                                      placeholder={attr.type === "SIZE" ? "Nama Ukuran (e.g. 500ml, XL)" : "Nama Model / Shape (e.g. Oval, Bulat)"}
                                      type={attr.type}
                                    />
                                  ) : (
                                    <Input
                                      type="text"
                                      placeholder="Masukkan nilai baru..."
                                      value={inlineInputValue}
                                      onChange={(e: any) => setInlineInputValue(e.target.value)}
                                      className="h-8 text-xs bg-white text-slate-800"
                                      autoFocus
                                    />
                                  )}

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      Penyesuaian Harga (Opsional)
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="Contoh: 5000 atau -2000"
                                      value={inlineInputPrice}
                                      onChange={(e: any) => setInlineInputPrice(e.target.value)}
                                      className="h-8 text-xs bg-white text-slate-800"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-3 text-xs text-stone-500 font-bold border-stone-250 bg-white"
                                      onClick={() => {
                                        setInlineInputAttrId(null);
                                        setInlineInputGroupId(null);
                                        setInlineInputValue("");
                                        setInlineInputPrice("");
                                      }}
                                    >
                                      Batal
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-white font-bold"
                                      onClick={async () => {
                                        if (!inlineInputValue.trim()) return;
                                        await handleAddAttributeValueInline(
                                          sel.attributeId,
                                          inlineInputValue,
                                          primValId,
                                          inlineInputPrice
                                        );
                                        setInlineInputAttrId(null);
                                        setInlineInputGroupId(null);
                                        setInlineInputValue("");
                                        setInlineInputPrice("");
                                      }}
                                    >
                                      Simpan
                                    </Button>
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {attr.values
                                  .filter((v: any) => sel.valueIds.includes(v.id))
                                  .map((v: any) => {
                                    const isChecked = activeList.includes(v.id);
                                    
                                    const isColorType = attr.type === "COLOR";
                                    const isModelShape = attr.type === "MODEL_SHAPE" || attr.type === "SIZE";

                                    const priceMod = sel.priceModifiers?.[v.id];
                                    const priceModLabel = priceMod && Number(priceMod) !== 0
                                      ? ` (${Number(priceMod) > 0 ? "+" : ""}Rp ${Number(priceMod).toLocaleString("id-ID")})`
                                      : "";

                                    let contentNode = null;

                                    if (isColorType) {
                                      const parsed = parseColorValue(v.value);
                                      const isCustomColor = parsed.name.toLowerCase().includes("custom") || parsed.name.toLowerCase().includes("kustom");
                                      contentNode = (
                                        <span className="truncate flex items-center gap-1.5 flex-1 font-medium text-xs text-slate-700">
                                          <span
                                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-inner"
                                            style={{
                                              background: isCustomColor
                                                ? "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
                                                : parsed.hex,
                                            }}
                                          />
                                          <span className="truncate">{parsed.name || parsed.hex}{priceModLabel}</span>
                                          {!isCustomColor && (
                                            <span className="text-[9px] text-slate-450 font-mono shrink-0">
                                              CMYK({parsed.cmyk.c},{parsed.cmyk.m},{parsed.cmyk.y},{parsed.cmyk.k})
                                            </span>
                                          )}
                                        </span>
                                      );
                                    } else if (isModelShape) {
                                      const p = v.value.split("|");
                                      const mName = p[0] || "";
                                      const mUrl = p[1] || "";
                                      contentNode = (
                                        <span className="truncate flex items-center gap-1.5 flex-1 font-medium text-xs text-slate-700">
                                          {mUrl && (
                                            <img
                                              src={mUrl}
                                              alt={mName}
                                              className="w-4 h-4 object-cover rounded-sm border shrink-0 bg-slate-50"
                                            />
                                          )}
                                          <span className="truncate">{mName}{priceModLabel}</span>
                                        </span>
                                      );
                                    } else {
                                      const label = v.value.split("|")[0];
                                      contentNode = <span className="truncate font-medium text-xs text-slate-700">{label}{priceModLabel}</span>;
                                    }

                                    return (
                                      <label
                                        key={v.id}
                                        className={`flex items-center space-x-2 border rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer select-none transition-all ${
                                          isChecked
                                            ? "border-indigo-650 bg-indigo-50/50 text-indigo-750"
                                            : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            setActiveGroupFilters((prev: any) => {
                                              const next = { ...prev };
                                              const currentList = next[primValId]?.[sel.attributeId] || [];
                                              if (checked) {
                                                next[primValId][sel.attributeId] = [...currentList, v.id];
                                              } else {
                                                next[primValId][sel.attributeId] = currentList.filter((id: string) => id !== v.id);
                                              }
                                              return next;
                                            });
                                          }}
                                          className="h-3.5 w-3.5 border-stone-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        {contentNode}
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsGenModalOpen(false)}
              className="font-bold text-xs uppercase"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmVariantGeneration}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase"
            >
              Generate Varian Terpilih
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
