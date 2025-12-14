"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { X, Plus } from "lucide-react";

interface ProductMedia {
  id: string;
  url: string;
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
}

// Sub-komponen untuk menampilkan media yang sudah ada dengan tombol hapus
function ExistingMediaDisplay({
  media,
  type,
  onDelete,
  isSubmitting,
}: {
  media: ProductMedia[];
  type: "image" | "video";
  onDelete: (mediaId: string) => Promise<void>;
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

          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-5 w-5 opacity-80 hover:opacity-100"
            onClick={() => onDelete(m.id)}
            disabled={isSubmitting}
          >
            <X className="h-3 w-3" />
          </Button>
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
}: FormUpdateProductMediaProps) {
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
  );
}
