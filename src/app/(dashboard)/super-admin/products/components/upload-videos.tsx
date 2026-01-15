"use client";

import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { VideoDetailModalCore, VideoMeta } from "./videoDetailCore";

// --- KONFIGURASI CLOUDINARY ---
const CLOUD_NAME = "do9sfnf5k"; // Dari env Anda
const UPLOAD_PRESET = "ml_default"; // GANTI INI DENGAN PRESET 'UNSIGNED' DARI DASHBOARD ANDA

// Interface data video yang sudah matang (berisi URL)
export interface VideoItem extends VideoMeta {
  tempId: string; // ID unik lokal untuk key react
}

interface UploadVideosProps {
  form: any;
  metadataName: string; // Nama field di RHF (misal: "videosMetadata")
  label?: string;
  max?: number;
}

export function UploadVideos({
  form,
  metadataName,
  label = "Video Produk",
  max = 3,
}: UploadVideosProps) {
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoItem, setSelectedVideoItem] = useState<VideoItem | null>(
    null
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Load Initial Data (Untuk mode Edit)
  useEffect(() => {
    const currentData = form.getValues(metadataName) || [];
    if (currentData.length > 0 && videoItems.length === 0) {
      // Map data dari form ke format state lokal
      const mapped = currentData.map((v: any, i: number) => ({
        ...v,
        tempId: v.publicId || `existing_${i}`,
      }));
      setVideoItems(mapped);
    }
  }, []);

  // 2. Sync State Lokal ke React Hook Form (RHF)
  useEffect(() => {
    // Kita hanya kirim metadata (URL, publicId, dll) ke form
    // Backend TIDAK butuh file binary lagi
    const formValue = videoItems.map(({ tempId, ...rest }) => rest);

    form.setValue(metadataName, formValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [videoItems, form, metadataName]);

  // === FUNGSI UPLOAD KE CLOUDINARY ===
  const uploadToCloudinary = async (file: File): Promise<VideoItem | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("resource_type", "video");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Gagal upload ke Cloudinary");
      const data = await res.json();

      return {
        tempId: data.public_id, // Gunakan public_id sebagai key unik
        url: data.secure_url,
        publicId: data.public_id,
        title: file.name,
        isFeatured: false,
        altText: file.name,
      };
    } catch (error) {
      console.error("Upload Error:", error);
      return null;
    }
  };

  // === HANDLER PILIH FILE ===
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (videoItems.length + files.length > max) {
      alert(`Maksimal ${max} video.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0); // Reset progress (bisa dikembangkan nanti)

    // Upload Paralel (Semua file sekaligus) - Jauh lebih cepat
    const promises = Array.from(files).map((file) => uploadToCloudinary(file));
    const results = await Promise.all(promises);

    // Ambil yang sukses saja
    const successItems = results.filter((item) => item !== null) as VideoItem[];

    if (successItems.length < files.length) {
      alert("Beberapa video gagal diupload.");
    }

    setVideoItems((prev) => [...prev, ...successItems]);
    setIsUploading(false);

    // Reset input agar bisa pilih file yang sama lagi kalau mau
    if (inputRef.current) inputRef.current.value = "";
  };

  // === HANDLER DELETE ===
  const handleRemove = (tempId: string) => {
    setVideoItems((prev) => prev.filter((item) => item.tempId !== tempId));
    // Note: Video di Cloudinary tidak langsung terhapus, tapi nanti di backend
    // kita hanya simpan array URL yang baru. Cloudinary akan punya sampah file,
    // tapi itu urusan maintenance nanti.
  };

  // === HANDLER MODAL & FEATURED ===
  const handleOpenModal = (item: VideoItem) => {
    setSelectedVideoItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVideoItem(null);
    setIsModalOpen(false);
  };

  const setVideoMetaField = (
    tempId: string | number,
    patch: Partial<VideoMeta>
  ) => {
    setVideoItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, ...patch } : item
      )
    );
  };

  const setFeaturedVideo = (tempId: string | number, isFeatured: boolean) => {
    setVideoItems((prev) =>
      prev.map((item) => ({
        ...item,
        isFeatured:
          item.tempId === tempId
            ? isFeatured
            : isFeatured
            ? false // Unset yang lain jika ada yang baru diset true
            : item.isFeatured,
      }))
    );
  };

  return (
    <>
      <FormField
        control={form.control}
        name={metadataName}
        render={() => (
          <FormItem className="space-y-4">
            <FormLabel className="text-md font-semibold flex items-center justify-between">
              {label}{" "}
              <span className="text-sm font-normal text-gray-500">
                (Max: {max}, Direct Upload)
              </span>
            </FormLabel>

            <div className="flex flex-wrap gap-3 p-3 border border-dashed rounded-lg bg-gray-50 min-h-24">
              {/* LIST VIDEO */}
              {videoItems.map((item) => (
                <div
                  key={item.tempId}
                  className="relative w-40 h-24 border border-indigo-300 rounded-md overflow-hidden bg-black group shadow-sm">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                  />

                  {/* Badge Featured */}
                  {item.isFeatured && (
                    <div className="absolute top-0 left-0 bg-indigo-600 p-1 rounded-br-md z-10">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </div>
                  )}

                  {/* Action Buttons (Hover) */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => handleOpenModal(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => handleRemove(item.tempId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* INPUT FILE HIDDEN */}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                multiple
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* TOMBOL ADD / LOADING STATE */}
              {videoItems.length < max && (
                <div
                  onClick={() => !isUploading && inputRef.current?.click()}
                  className={`w-40 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors ${
                    isUploading
                      ? "opacity-70 cursor-not-allowed bg-gray-100"
                      : ""
                  }`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      <span className="text-xs mt-2 font-medium text-indigo-600">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span className="text-xs mt-1">Add Video</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* MODAL EDIT METADATA */}
      {isModalOpen && selectedVideoItem && (
        <VideoDetailModalCore
          tempId={selectedVideoItem.tempId}
          videoMeta={selectedVideoItem}
          onClose={handleCloseModal}
          setVideoMetaField={setVideoMetaField}
          setFeaturedVideo={setFeaturedVideo}
        />
      )}
    </>
  );
}
