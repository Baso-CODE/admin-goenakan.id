"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Star, X, Layers } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState, useEffect, useMemo } from "react";
import { ImageDetailModalCore } from "../imageDetailCore";
import { VideoDetailModalCore } from "../videoDetailCore";
import { MockupAreaSelector } from "../MockupAreaSelector";
import { isMockupImage } from "@/helper/mediaFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CategorizerAttribute {
  attributeId: string;
  attributeName: string;
  values: {
    id: string;
    value: string;
  }[];
}

interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
  isFeatured?: boolean;
  attributeValueId?: string | null;
  sortOrder?: number;
}

interface Product {
  id: string;
  images: ProductMedia[];
  videos: ProductMedia[];
  isCustom?: boolean;
  isMultiFace?: boolean;
  mockupFrontImageId?: string | null;
  mockupBackImageId?: string | null;
  attributeValues?: any[];
  productVariants?: any[];
}

interface FormUpdateProductMediaProps {
  productId: string;
  initialData: Product | undefined;
  isSubmitting: boolean;
  onAddImage: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onAddMultipleImages?: (
    files: File[],
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onDeleteImage: (mediaId: string) => Promise<void>;
  onAddVideo: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onAddMultipleVideos?: (
    files: File[],
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onDeleteVideo: (mediaId: string) => Promise<void>;
  onUpdateMediaMetadata: (mediaId: string, updates: any) => Promise<void>;
  onUpdateVideoMetadata: (mediaId: string, updates: any) => Promise<void>;
  onReorderMedia?: (type: "image" | "video", orderedIds: string[]) => Promise<void>;
}

function ExistingMediaDisplay({
  media,
  type,
  onDelete,
  onEdit,
  onReorder,
  onFilesDrop,
  isSubmitting,
  categorizerAttr,
  onUpdateAttributeValue,
}: {
  media: ProductMedia[];
  type: "image" | "video";
  onDelete: (mediaId: string) => Promise<void>;
  onEdit: (item: any) => void;
  onReorder?: (orderedIds: string[]) => void;
  onFilesDrop?: (files: File[]) => void;
  isSubmitting: boolean;
  categorizerAttr?: CategorizerAttribute | null;
  onUpdateAttributeValue?: (mediaId: string, attributeValueId: string | null) => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingOverZone, setIsDraggingOverZone] = useState(false);

  // OS file drop handlers
  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOverZone(true);
    }
  };

  const handleZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(false);
  };

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onFilesDrop) {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        type === "image"
          ? f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)
          : f.type.startsWith("video/"),
      );
      if (files.length > 0) {
        onFilesDrop(files);
      }
    }
  };

  // Item drag & drop reorder handlers
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...media];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (onReorder) {
      onReorder(reordered.map((m) => m.id));
    }
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      onDragOver={handleZoneDragOver}
      onDragLeave={handleZoneDragLeave}
      onDrop={handleZoneDrop}
      className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border-2 border-dashed rounded-lg transition-colors min-h-36 ${
        isDraggingOverZone
          ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30"
          : "border-stone-200 dark:border-stone-800 bg-gray-50/50"
      }`}>
      {media.map((m, index) => {
        const isItemDragged = draggedIndex === index;
        const isItemOver = dragOverIndex === index;

        return (
          <div
            key={m.id}
            draggable={!isSubmitting}
            onDragStart={(e) => handleItemDragStart(e, index)}
            onDragOver={(e) => handleItemDragOver(e, index)}
            onDrop={(e) => handleItemDrop(e, index)}
            onDragEnd={handleItemDragEnd}
            className={`group relative aspect-square rounded-lg overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all select-none cursor-grab active:cursor-grabbing ${
              isItemDragged
                ? "opacity-30 scale-95 border-dashed border-indigo-400"
                : isItemOver
                  ? "border-indigo-500 ring-2 ring-indigo-400 scale-105"
                  : "border-stone-200 dark:border-stone-700"
            }`}>
            {type === "image" ? (
              <Image src={m.url} alt="img" fill className="object-cover pointer-events-none" />
            ) : (
              <video
                src={m.url}
                className="w-full h-full object-cover pointer-events-none"
                muted
                playsInline
              />
            )}

            {/* Badge Nomor Urut */}
            <div
              className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold z-20 shadow-sm ${
                index === 0
                  ? "bg-indigo-600 text-white"
                  : "bg-black/60 text-white backdrop-blur-xs"
              }`}>
              #{index + 1}
            </div>

            {m.isFeatured && (
              <div className="absolute top-1.5 right-1.5 bg-yellow-500 p-1.5 rounded-lg z-20 shadow-sm">
                <Star className="h-3.5 w-3.5 fill-white text-white" />
              </div>
            )}

            {/* Quick Option Assignment Dropdown */}
            {categorizerAttr && (
              <div
                className="absolute bottom-1.5 left-1.5 right-1.5 z-40 max-w-[calc(100%-12px)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}>
                <Select
                  value={m.attributeValueId || "general"}
                  onValueChange={(val) => {
                    onUpdateAttributeValue?.(
                      m.id,
                      val === "general" ? null : val,
                    );
                  }}
                  disabled={isSubmitting}>
                  <SelectTrigger className="h-6 w-full min-w-0 max-w-full text-[10px] font-semibold bg-white/95 dark:bg-stone-900/95 shadow-xs border-stone-300 dark:border-stone-700 px-1 py-0 overflow-hidden flex items-center justify-between gap-0.5 [&>svg]:size-3 [&>svg]:shrink-0">
                    <span className="truncate block flex-1 text-left min-w-0">
                      {m.attributeValueId
                        ? categorizerAttr.values.find((v) => v.id === m.attributeValueId)?.value || "Kategori"
                        : type === "video" ? "Video Umum" : "Foto Umum"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-48 z-50">
                    <SelectItem
                      value="general"
                      className="text-xs font-medium text-stone-600">
                      {type === "video" ? "Video Umum" : "Foto Umum"} (Semua {categorizerAttr.attributeName})
                    </SelectItem>
                    {categorizerAttr.values.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={v.id}
                        className="text-xs font-medium">
                        {v.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div
              className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 ${
                categorizerAttr ? "pb-7" : ""
              }`}>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(m);
                }}
                disabled={isSubmitting}
                title="Edit Detail SEO">
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(m.id);
                }}
                disabled={isSubmitting}
                title="Hapus Media">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {media.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center h-full text-muted-foreground italic text-sm py-6">
          <p>Belum ada {type === "image" ? "gambar" : "video"} produk. Tarik file dari komputer ke sini atau klik Tambah.</p>
        </div>
      )}
    </div>
  );
}

export default function FormUpdateProductMedia({
  initialData,
  isSubmitting,
  onAddImage,
  onAddMultipleImages,
  onDeleteImage,
  onAddVideo,
  onAddMultipleVideos,
  onDeleteVideo,
  onUpdateMediaMetadata,
  onUpdateVideoMetadata,
  onReorderMedia,
}: FormUpdateProductMediaProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const cleanOptionLabel = (val: string) => {
    if (!val) return "";
    return val.split("|")[0].trim();
  };

  // 1. Ekstrak semua grup atribut dan nilai-nilainya
  const attributeGroups = useMemo<CategorizerAttribute[]>(() => {
    const groupsMap = new Map<string, CategorizerAttribute>();

    if (
      initialData?.attributeValues &&
      Array.isArray(initialData.attributeValues)
    ) {
      for (const item of initialData.attributeValues) {
        const attr = item.attributeValue?.attribute || item.attribute;
        const val = item.attributeValue;
        if (!attr?.id || !val?.id) continue;

        if (!groupsMap.has(attr.id)) {
          groupsMap.set(attr.id, {
            attributeId: attr.id,
            attributeName: attr.name,
            values: [],
          });
        }
        const grp = groupsMap.get(attr.id)!;
        if (!grp.values.some((v) => v.id === val.id)) {
          grp.values.push({ id: val.id, value: cleanOptionLabel(val.value) });
        }
      }
    }

    if (
      initialData?.productVariants &&
      Array.isArray(initialData.productVariants)
    ) {
      for (const variant of initialData.productVariants) {
        if (variant.attributeValues && Array.isArray(variant.attributeValues)) {
          for (const av of variant.attributeValues) {
            const val = av.attributeValue;
            const attr = val?.attribute;
            if (!attr?.id || !val?.id) continue;

            if (!groupsMap.has(attr.id)) {
              groupsMap.set(attr.id, {
                attributeId: attr.id,
                attributeName: attr.name,
                values: [],
              });
            }
            const grp = groupsMap.get(attr.id)!;
            if (!grp.values.some((v) => v.id === val.id)) {
              grp.values.push({ id: val.id, value: cleanOptionLabel(val.value) });
            }
          }
        }
      }
    }

    return Array.from(groupsMap.values());
  }, [initialData]);

  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [activeValueFilter, setActiveValueFilter] = useState<string>("ALL");

  // Auto-detect categorizer attribute if any image already has attributeValueId
  useEffect(() => {
    if (!selectedAttrId && initialData?.images && attributeGroups.length > 0) {
      for (const img of initialData.images) {
        if (img.attributeValueId) {
          const matchGroup = attributeGroups.find((g: CategorizerAttribute) =>
            g.values.some((v: { id: string; value: string }) => v.id === img.attributeValueId),
          );
          if (matchGroup) {
            setSelectedAttrId(matchGroup.attributeId);
            break;
          }
        }
      }
    }
  }, [initialData?.images, attributeGroups, selectedAttrId]);

  const categorizerAttr = useMemo<CategorizerAttribute | null>(() => {
    if (!selectedAttrId) return null;
    return (
      attributeGroups.find((g: CategorizerAttribute) => g.attributeId === selectedAttrId) || null
    );
  }, [selectedAttrId, attributeGroups]);

  const rawImages = useMemo<ProductMedia[]>(() => {
    return (initialData?.images || []).filter(
      (img: ProductMedia) => !isMockupImage(img),
    );
  }, [initialData?.images]);

  const displayedImages = useMemo<ProductMedia[]>(() => {
    if (!categorizerAttr || activeValueFilter === "ALL") {
      return rawImages;
    }
    if (activeValueFilter === "GENERAL") {
      return rawImages.filter((img: ProductMedia) => !img.attributeValueId);
    }
    return rawImages.filter(
      (img: ProductMedia) => img.attributeValueId === activeValueFilter,
    );
  }, [rawImages, categorizerAttr, activeValueFilter]);

  const handleUpdateAttributeValue = (
    mediaId: string,
    attributeValueId: string | null,
  ) => {
    onUpdateMediaMetadata(mediaId, { attributeValueId });
  };

  const rawVideos = useMemo<ProductMedia[]>(() => {
    return initialData?.videos || [];
  }, [initialData?.videos]);

  const displayedVideos = useMemo<ProductMedia[]>(() => {
    if (!categorizerAttr || activeValueFilter === "ALL") {
      return rawVideos;
    }
    if (activeValueFilter === "GENERAL") {
      return rawVideos.filter((vid: ProductMedia) => !vid.attributeValueId);
    }
    return rawVideos.filter(
      (vid: ProductMedia) => vid.attributeValueId === activeValueFilter,
    );
  }, [rawVideos, categorizerAttr, activeValueFilter]);

  const handleUpdateVideoAttributeValue = (
    mediaId: string,
    attributeValueId: string | null,
  ) => {
    onUpdateVideoMetadata(mediaId, { attributeValueId });
  };

  const handleOpenModal = (item: ProductMedia) => {
    setSelectedMedia(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
    setIsModalOpen(false);
  };

  const handleOpenVideoModal = (item: any) => {
    setSelectedVideo(item);
    setIsVideoModalOpen(true);
  };

  const handleVideoModalUpdate = (id: string | number, patch: any) => {
    onUpdateVideoMetadata(id as string, patch);
    setSelectedVideo((prev: any) => (prev ? { ...prev, ...patch } : null));
  };

  const handleModalUpdateMeta = (id: number | string, patch: any) => {
    if (selectedMedia && selectedMedia.id === id) {
      onUpdateMediaMetadata(id as string, patch);
      setSelectedMedia((prev) => (prev ? { ...prev, ...patch } : null));
    }
  };

  const handleModalSetFeatured = (id: number | string, isFeatured: boolean) => {
    if (selectedMedia && selectedMedia.id === id) {
      onUpdateMediaMetadata(id as string, { isFeatured });
    }
  };

  const processVideoFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingVideo(true);
    setVideoUploadProgress(0);

    try {
      if (files.length > 1 && onAddMultipleVideos) {
        await onAddMultipleVideos(files, (p) => setVideoUploadProgress(Math.round(p)));
      } else {
        for (let i = 0; i < files.length; i++) {
          await onAddVideo(files[i], (p) => {
            const total = ((i + p / 100) / files.length) * 100;
            setVideoUploadProgress(Math.round(total));
          });
        }
      }
    } catch (error) {
      console.error("Video upload failed", error);
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const handleVideoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processVideoFiles(Array.from(e.target.files));
    }
  };

  const processImageFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setImageUploadProgress(0);

    try {
      if (files.length > 1 && onAddMultipleImages) {
        await onAddMultipleImages(files, (p) => setImageUploadProgress(Math.round(p)));
      } else {
        for (let i = 0; i < files.length; i++) {
          await onAddImage(files[i], (p) => {
            const total = ((i + p / 100) / files.length) * 100;
            setImageUploadProgress(Math.round(total));
          });
        }
      }
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setIsUploadingImage(false);
      setImageUploadProgress(0);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processImageFiles(Array.from(e.target.files));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Update Gambar & Video Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Gambar Produk --- */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-medium">Gambar Produk</h3>
              <span className="text-xs text-stone-500 font-normal">
                {activeValueFilter === "ALL"
                  ? "Geser kartu untuk mengubah urutan (Tersimpan otomatis)"
                  : "Filter aktif: Urutan tersimpan pada tab 'Semua'"}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Setiap gambar yang berhasil diunggah akan otomatis dikonversi ke format <strong>.webp</strong> untuk mengoptimalkan performa pemuatan halaman.
            </p>

            {/* Categorizer Attribute Selector */}
            {attributeGroups.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 mb-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <Label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                      Kategori Galeri Berdasarkan Atribut
                    </Label>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Pilih atribut (misal Model, Warna, Material) untuk mengelompokkan foto ke masing-masing pilihan customer.
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <Select
                    value={selectedAttrId || "none"}
                    onValueChange={(val) => {
                      setSelectedAttrId(val === "none" ? null : val);
                      setActiveValueFilter("ALL");
                    }}>
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-stone-800 border-stone-300">
                      <SelectValue placeholder="Pilih Atribut..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="none">
                        -- Tanpa Kategori (Semua Foto Umum) --
                      </SelectItem>
                      {attributeGroups.map((group: CategorizerAttribute) => (
                        <SelectItem
                          key={group.attributeId}
                          value={group.attributeId}>
                          {group.attributeName} ({group.values.length} opsi)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Filter Tabs / Pills */}
            {categorizerAttr && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold text-stone-500 mr-1">
                  Filter Tampilan:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveValueFilter("ALL")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeValueFilter === "ALL"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}>
                  Semua ({rawImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveValueFilter("GENERAL")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeValueFilter === "GENERAL"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}>
                  Foto Umum / Shared (
                  {rawImages.filter((img: ProductMedia) => !img.attributeValueId).length})
                </button>
                {categorizerAttr.values.map((v: { id: string; value: string }) => {
                  const count = rawImages.filter(
                    (img: ProductMedia) => img.attributeValueId === v.id,
                  ).length;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveValueFilter(v.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        activeValueFilter === v.id
                          ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                      }`}>
                      {v.value} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <ExistingMediaDisplay
              media={displayedImages}
              type="image"
              onDelete={onDeleteImage}
              onEdit={handleOpenModal}
              onReorder={
                activeValueFilter === "ALL"
                  ? (newIds) => onReorderMedia?.("image", newIds)
                  : undefined
              }
              onFilesDrop={processImageFiles}
              isSubmitting={isSubmitting}
              categorizerAttr={categorizerAttr}
              onUpdateAttributeValue={handleUpdateAttributeValue}
            />
             <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                ref={imageInputRef}
                onChange={handleImageFileChange}
                disabled={isSubmitting || isUploadingImage}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={isSubmitting || isUploadingImage}
                className="min-w-36">
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {imageUploadProgress > 0
                      ? `Uploading (${imageUploadProgress}%)`
                      : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Gambar
                  </>
                )}
              </Button>
            </div>
            {isUploadingImage && imageUploadProgress > 0 && (
              <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${imageUploadProgress}%` }}></div>
              </div>
            )}
          </div>

          {/* --- Video Produk --- */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-medium">Video Produk</h3>
              <span className="text-xs text-stone-500 font-normal">
                Geser kartu untuk mengubah urutan (Tersimpan otomatis)
              </span>
            </div>
            <ExistingMediaDisplay
              media={displayedVideos}
              type="video"
              onDelete={onDeleteVideo}
              isSubmitting={isSubmitting}
              onEdit={handleOpenVideoModal}
              onReorder={
                activeValueFilter === "ALL"
                  ? (newIds) => onReorderMedia?.("video", newIds)
                  : undefined
              }
              onFilesDrop={processVideoFiles}
              categorizerAttr={categorizerAttr}
              onUpdateAttributeValue={handleUpdateVideoAttributeValue}
            />
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                multiple
                ref={videoInputRef}
                onChange={handleVideoFileChange}
                disabled={isSubmitting || isUploadingVideo}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={isSubmitting || isUploadingVideo}
                className="min-w-36">
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {videoUploadProgress > 0
                      ? `Uploading (${videoUploadProgress}%)`
                      : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Video
                  </>
                )}
              </Button>
            </div>
            {isUploadingVideo && videoUploadProgress > 0 && (
              <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${videoUploadProgress}%` }}></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Edit Metadata Gambar */}
      {isModalOpen && selectedMedia && (
        <ImageDetailModalCore
          tempId={selectedMedia.id as any}
          imageMeta={{
            ...selectedMedia,
            isNew: false,
            altText: selectedMedia.altText || "",
            isFeatured: selectedMedia.isFeatured || false,
            attributeValueId: selectedMedia.attributeValueId || null,
          }}
          categorizerAttr={categorizerAttr}
          onClose={handleCloseModal}
          setImageMetaField={handleModalUpdateMeta}
          setFeaturedImage={handleModalSetFeatured}
        />
      )}

      {/* Modal Edit Metadata Video */}
      {isVideoModalOpen && selectedVideo && (
        <VideoDetailModalCore
          tempId={selectedVideo.id}
          videoMeta={{
            ...selectedVideo,
            isNew: false,
            title: selectedVideo.title || "",
            altText: selectedVideo.altText || "",
            isFeatured: selectedVideo.isFeatured || false,
            attributeValueId: selectedVideo.attributeValueId || null,
          }}
          categorizerAttr={categorizerAttr}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedVideo(null);
          }}
          setVideoMetaField={handleVideoModalUpdate}
          setFeaturedVideo={(id, isFeatured) =>
            handleVideoModalUpdate(id, { isFeatured })
          }
        />
      )}
    </>
  );
}
