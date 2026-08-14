"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Star, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { ImageDetailModalCore } from "../imageDetailCore";
import { VideoDetailModalCore } from "../videoDetailCore";

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
}

interface FormUpdateProductMediaProps {
  productId: string;
  initialData: Product | undefined;
  isSubmitting: boolean;
  onAddImage: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onDeleteImage: (mediaId: string) => Promise<void>;
  onAddVideo: (
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  onDeleteVideo: (mediaId: string) => Promise<void>;
  onUpdateMediaMetadata: (mediaId: string, updates: any) => Promise<void>;
  onUpdateVideoMetadata: (mediaId: string, updates: any) => Promise<void>;
}

function ExistingMediaDisplay({
  media,
  type,
  onDelete,
  onEdit,
  isSubmitting,
}: {
  media: ProductMedia[];
  type: "image" | "video";
  onDelete: (mediaId: string) => Promise<void>;
  onEdit: (item: any) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border rounded-lg bg-gray-50/50 min-h-30">
      {media.map((m) => (
        <div
          key={m.id}
          // PERBAIKAN 1: Tambahkan 'group' di sini
          className="group relative aspect-square rounded-lg overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all">
          {type === "image" ? (
            <Image src={m.url} alt="img" fill className="object-cover" />
          ) : (
            // PERBAIKAN 3: Video tanpa controls agar overlay hover bekerja
            <video
              src={m.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}

          {m.isFeatured && (
            <div className="absolute top-0 left-0 bg-yellow-500 p-1.5 rounded-br-lg z-20 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-md"
              onClick={() => onEdit(m)}
              disabled={isSubmitting}
              title="Edit Detail SEO">
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={() => onDelete(m.id)}
              disabled={isSubmitting}
              title="Hapus Media">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {media.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center h-full text-muted-foreground italic text-sm">
          <p>Belum ada {type === "image" ? "gambar" : "video"} produk.</p>
        </div>
      )}
    </div>
  );
}

export default function FormUpdateProductMedia({
  initialData,
  isSubmitting,
  onAddImage,
  onDeleteImage,
  onAddVideo,
  onDeleteVideo,
  onUpdateMediaMetadata,
  onUpdateVideoMetadata,
}: FormUpdateProductMediaProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const handleVideoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setUploadProgress(0);

    try {
      await onAddVideo(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
    } catch (error) {
      console.error("Video upload failed", error);
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(0);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      await onAddImage(file);
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
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
            <h3 className="text-lg font-medium mb-1">Gambar Produk</h3>
            <p className="text-xs text-stone-500 mb-3">
              Setiap gambar yang berhasil diunggah akan otomatis dikonversi ke format <strong>.webp</strong> untuk mengoptimalkan performa pemuatan halaman.
            </p>
            <ExistingMediaDisplay
              media={initialData?.images || []}
              type="image"
              onDelete={onDeleteImage}
              onEdit={handleOpenModal}
              isSubmitting={isSubmitting}
            />
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="image/*"
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
                disabled={isSubmitting || isUploadingImage}>
                <Plus className="h-4 w-4 mr-2" />
                {isUploadingImage ? "Uploading..." : "Tambah Gambar"}
              </Button>
            </div>
          </div>

          {/* --- Video Produk --- */}
          <div>
            <h3 className="text-lg font-medium mb-2">Video Produk</h3>
            <ExistingMediaDisplay
              media={initialData?.videos || []}
              type="video"
              onDelete={onDeleteVideo}
              isSubmitting={isSubmitting}
              onEdit={handleOpenVideoModal}
            />
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="video/mp4,video/quicktime"
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
                className="min-w-32">
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadProgress > 0
                      ? `Uploading (${uploadProgress}%)`
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
            {isUploadingVideo && uploadProgress > 0 && (
              <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {isModalOpen && selectedMedia && (
        <ImageDetailModalCore
          tempId={selectedMedia.id as any}
          imageMeta={{
            ...selectedMedia,
            isNew: false,
          }}
          onClose={handleCloseModal}
          setImageMetaField={handleModalUpdateMeta}
          setFeaturedImage={handleModalSetFeatured}
        />
      )}
      {isVideoModalOpen && selectedVideo && (
        <VideoDetailModalCore
          tempId={selectedVideo.id}
          videoMeta={{
            ...selectedVideo,
            isNew: false,
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
