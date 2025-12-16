"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { X, Plus, Star, Pencil } from "lucide-react";
import { ImageDetailModalCore } from "../imageDetailCore";

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
  onAddImage: (file: File) => Promise<void>;
  onDeleteImage: (mediaId: string) => Promise<void>;
  onAddVideo: (file: File) => Promise<void>;
  onDeleteVideo: (mediaId: string) => Promise<void>;
  onUpdateMediaMetadata: (
    mediaId: string,
    updates: { altText?: string; isFeatured?: boolean }
  ) => Promise<void>;
}

// Sub-komponen untuk menampilkan media yang sudah ada dengan tombol hapus
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
  onEdit?: (item: ProductMedia) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3 p-2 border rounded-md min-h-20">
      {media.map((m) => (
        <div
          key={m.id}
          className="relative w-24 h-24 rounded-md overflow-hidden border"
        >
          {type === "image" ? (
            <Image
              src={m.url}
              alt={`Existing ${type}`}
              fill
              className="object-cover"
            />
          ) : (
            <video
              src={m.url}
              controls
              className="w-full h-full object-cover"
            />
          )}

          {type === "image" && m.isFeatured && (
            <div className="absolute top-0 left-0 bg-indigo-600 p-1 rounded-br-md z-10">
              <Star className="h-3 w-3 fill-white text-white" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {/* Tombol Edit (Hanya Image) */}
            {type === "image" && onEdit && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 bg-white text-gray-800 hover:bg-gray-100"
                onClick={() => onEdit(m)}
                disabled={isSubmitting}
                title="Edit Details"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}

            {/* Tombol Hapus */}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={() => onDelete(m.id)}
              disabled={isSubmitting}
              title="Delete"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
      {media.length === 0 && (
        <p className="text-sm text-muted-foreground self-center p-2">
          Belum ada {type} produk yang diunggah.
        </p>
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
}: FormUpdateProductMediaProps) {
  const [isUploading, setIsUploading] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleModalUpdateMeta = (id: number | string, patch: any) => {
    // Karena id dari server string, kita cast saja.
    // Kita langsung panggil API parent setiap kali ada perubahan di modal.
    if (selectedMedia && selectedMedia.id === id) {
      onUpdateMediaMetadata(id as string, patch);

      // Update state lokal sementara agar UI modal responsif (optional,
      // tapi karena onUpdateMediaMetadata update `productData` via parent,
      // biasanya modal akan re-render otomatis jika props berubah)
      setSelectedMedia((prev) => (prev ? { ...prev, ...patch } : null));
    }
  };

  // Adapter: Khusus untuk Featured Image
  const handleModalSetFeatured = (id: number | string, isFeatured: boolean) => {
    if (selectedMedia && selectedMedia.id === id) {
      onUpdateMediaMetadata(id as string, { isFeatured });
    }
  };

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    handler: (file: File) => Promise<void>,
    ref: React.RefObject<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await handler(file);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      // Reset input agar bisa upload file yang sama lagi
      if (ref.current) {
        ref.current.value = "";
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
            <h3 className="text-lg font-medium mb-2">Gambar Produk</h3>
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
                onChange={(e) => handleFileChange(e, onAddImage, imageInputRef)}
                disabled={isSubmitting || isUploading}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={isSubmitting || isUploading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Tambah Gambar"}
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
            />
            <div className="mt-3 flex gap-2 items-center">
              <Input
                type="file"
                accept="video/mp4,video/quicktime"
                ref={videoInputRef}
                onChange={(e) => handleFileChange(e, onAddVideo, videoInputRef)}
                disabled={isSubmitting || isUploading}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={isSubmitting || isUploading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Tambah Video"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {isModalOpen && selectedMedia && (
        <ImageDetailModalCore
          // Kita passing ID string, pastikan ModalCore Anda mentoleransi type 'any' atau 'string | number' untuk ID
          // Jika ModalCore strict number, Anda perlu mengubah type prop di ModalCore-nya.
          tempId={selectedMedia.id as any}
          // Mapping data agar sesuai dengan shape ImageMeta di modal
          imageMeta={{
            ...selectedMedia,
            isNew: false,
          }}
          onClose={handleCloseModal}
          // Hubungkan ke Handler API
          setImageMetaField={handleModalUpdateMeta}
          setFeaturedImage={handleModalSetFeatured}
        />
      )}
    </>
  );
}
