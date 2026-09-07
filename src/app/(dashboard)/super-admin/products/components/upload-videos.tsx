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

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingOverZone, setIsDraggingOverZone] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoItem, setSelectedVideoItem] = useState<VideoItem | null>(
    null,
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
        },
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

  const processIncomingVideoFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("video/"),
    );
    if (newFiles.length === 0) return;

    if (videoItems.length + newFiles.length > max) {
      alert(`Maksimal ${max} video.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const promises = newFiles.map((file) => uploadToCloudinary(file));
    const results = await Promise.all(promises);

    const successItems = results.filter((item) => item !== null) as VideoItem[];

    if (successItems.length < newFiles.length) {
      alert("Beberapa video gagal diupload.");
    }

    setVideoItems((prev) => [...prev, ...successItems]);
    setIsUploading(false);

    if (inputRef.current) inputRef.current.value = "";
  };

  // === HANDLER PILIH FILE ===
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processIncomingVideoFiles(e.target.files);
    }
  };

  // Dropzone drag from OS handlers
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

  const handleZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processIncomingVideoFiles(e.dataTransfer.files);
    }
  };

  // Drag & drop item reorder handlers
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

    const reordered = [...videoItems];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setVideoItems(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // === HANDLER DELETE ===
  const handleRemove = (tempId: string) => {
    setVideoItems((prev) => prev.filter((item) => item.tempId !== tempId));
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
    patch: Partial<VideoMeta>,
  ) => {
    setVideoItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, ...patch } : item,
      ),
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
              ? false
              : item.isFeatured,
      })),
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
              <span>{label}</span>
              <span className="text-xs font-normal text-stone-500">
                (Tersimpan: {videoItems.length} / Max: {max} video • Geser untuk atur urutan)
              </span>
            </FormLabel>

            <div
              onDragOver={handleZoneDragOver}
              onDragLeave={handleZoneDragLeave}
              onDrop={handleZoneDrop}
              className={`flex flex-wrap gap-3 p-3 border-2 border-dashed rounded-lg transition-colors min-h-28 ${
                isDraggingOverZone
                  ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30"
                  : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50"
              }`}>
              {/* LIST VIDEO */}
              {videoItems.map((item, index) => {
                const isItemDragged = draggedIndex === index;
                const isItemOver = dragOverIndex === index;

                return (
                  <div
                    key={item.tempId}
                    draggable={true}
                    onDragStart={(e) => handleItemDragStart(e, index)}
                    onDragOver={(e) => handleItemDragOver(e, index)}
                    onDrop={(e) => handleItemDrop(e, index)}
                    onDragEnd={handleItemDragEnd}
                    className={`relative w-40 h-24 border rounded-lg overflow-hidden bg-black group shadow-sm cursor-grab active:cursor-grabbing transition-all select-none ${
                      isItemDragged
                        ? "opacity-30 scale-95 border-dashed border-indigo-400"
                        : isItemOver
                          ? "border-indigo-500 ring-2 ring-indigo-400 scale-105"
                          : "border-stone-300 dark:border-stone-700 hover:shadow-md"
                    }`}>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Badge Nomor Urut */}
                    <div
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold z-10 shadow-sm ${
                        index === 0
                          ? "bg-indigo-600 text-white"
                          : "bg-black/60 text-white backdrop-blur-xs"
                      }`}>
                      #{index + 1}
                    </div>

                    {/* Badge Featured */}
                    {item.isFeatured && (
                      <div className="absolute top-1 right-1 bg-amber-500 p-1 rounded z-10 shadow-sm">
                        <Star className="h-3 w-3 fill-white text-white" />
                      </div>
                    )}

                    {/* Action Buttons (Hover) */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2 z-20">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 bg-white text-gray-800 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(item);
                        }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.tempId);
                        }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

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
                  className={`w-40 h-24 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center text-stone-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-all ${
                    isUploading
                      ? "opacity-70 cursor-not-allowed bg-stone-100"
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
                      <span className="text-[11px] font-medium mt-1">Tambah Video</span>
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
