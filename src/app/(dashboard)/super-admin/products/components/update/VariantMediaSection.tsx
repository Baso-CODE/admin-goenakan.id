"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Star, X, Layers } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState, useEffect } from "react";
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

interface ProductMedia {
  id: string;
  url: string;
  altText?: string;
  isFeatured?: boolean;
}

interface Product {
  id: string;
  images: ProductMedia[];
  videos: ProductMedia[];
  isCustom?: boolean;
  isMultiFace?: boolean;
  mockupFrontImageId?: string | null;
  mockupBackImageId?: string | null;
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
}: {
  media: ProductMedia[];
  type: "image" | "video";
  onDelete: (mediaId: string) => Promise<void>;
  onEdit: (item: any) => void;
  onReorder?: (orderedIds: string[]) => void;
  onFilesDrop?: (files: File[]) => void;
  isSubmitting: boolean;
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

            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
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
                Geser kartu untuk mengubah urutan (Tersimpan otomatis)
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Setiap gambar yang berhasil diunggah akan otomatis dikonversi ke format <strong>.webp</strong> untuk mengoptimalkan performa pemuatan halaman.
            </p>
            <ExistingMediaDisplay
              media={(initialData?.images || []).filter((img: any) => !isMockupImage(img))}
              type="image"
              onDelete={onDeleteImage}
              onEdit={handleOpenModal}
              onReorder={(newIds) => onReorderMedia?.("image", newIds)}
              onFilesDrop={processImageFiles}
              isSubmitting={isSubmitting}
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
              media={initialData?.videos || []}
              type="video"
              onDelete={onDeleteVideo}
              isSubmitting={isSubmitting}
              onEdit={handleOpenVideoModal}
              onReorder={(newIds) => onReorderMedia?.("video", newIds)}
              onFilesDrop={processVideoFiles}
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
          }}
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
          }}
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
