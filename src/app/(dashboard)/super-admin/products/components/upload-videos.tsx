"use client";

import { useState, ChangeEvent, useRef, useEffect, useCallback } from "react";
import { X, Plus, Video, Pencil, Star } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { VideoDetailModalCore, VideoMeta } from "./videoDetailCore";

// Definisikan tipe untuk item yang disimpan di state lokal
export interface VideoItem extends VideoMeta {
  tempId: number;
  file?: File;
}

// Update Interface Props
interface UploadVideosProps {
  form: any;
  name: string;
  metadataName: string;
  label?: string;
  max?: number;

  onFilesChange?: (files: File[], metadata: VideoMeta[]) => void;
}

export function UploadVideos({
  form,
  name,
  metadataName,
  label = "Video Produk",
  max = 3,
  onFilesChange,
}: UploadVideosProps) {
  // State Lokal Baru
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoItem, setSelectedVideoItem] = useState<VideoItem | null>(
    null
  );
  const [tempIdCounter, setTempIdCounter] = useState(0); // Untuk unique key

  const inputRef = useRef<HTMLInputElement>(null);

  // === useEffect untuk Sinkronisasi ke Parent/RHF ===
  useEffect(() => {
    // 1. Ambil File untuk Upload
    const filesToUpload = videoItems
      .filter((item) => item.isNew && item.file)
      .map((item) => item.file!);

    // 2. Ambil Metadata untuk RHF
    const metadataForForm = videoItems.map((item) => ({
      url: item.url,
      title: item.title,
      isFeatured: item.isFeatured,
      altText: item.altText,
    }));

    //
    onFilesChange?.(filesToUpload, metadataForForm);

    // 4. Sinkronisasi Metadata ke RHF secara langsung
    const currentRHFValue = form.getValues(metadataName);
    if (JSON.stringify(currentRHFValue) !== JSON.stringify(metadataForForm)) {
      form.setValue(metadataName, metadataForForm, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [videoItems]);

  // === HANDLER FILE ===
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const combinedLength = videoItems.length + newFiles.length;

    if (combinedLength > max) {
      alert(`Maximum ${max} videos allowed.`);
      return;
    }

    let currentTempId = tempIdCounter;
    const newItems: VideoItem[] = newFiles.map((file) => {
      currentTempId += 1;
      return {
        tempId: currentTempId,
        url: URL.createObjectURL(file),
        title: file.name,
        altText: "",
        isFeatured: false,
        isNew: true,
        file: file,
      };
    });

    setTempIdCounter(currentTempId);
    setVideoItems((prev) => [...prev, ...newItems]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // === HANDLER REMOVE ===
  const handleRemoveItem = (tempIdToRemove: number) => {
    const itemToRemove = videoItems.find(
      (item) => item.tempId === tempIdToRemove
    );
    if (itemToRemove && itemToRemove.isNew) {
      // Bebaskan URL memori hanya jika itu adalah file baru yang di-upload
      URL.revokeObjectURL(itemToRemove.url);
    }
    setVideoItems((prev) =>
      prev.filter((item) => item.tempId !== tempIdToRemove)
    );
  };

  // === HANDLER MODAL/METADATA ===
  const handleOpenModal = (item: VideoItem) => {
    setSelectedVideoItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVideoItem(null);
    setIsModalOpen(false);
  };

  const setVideoMetaField = useCallback(
    (tempId: string | number, patch: Partial<VideoMeta>) => {
      setVideoItems((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, ...patch } : item
        )
      );
    },
    []
  );

  const setFeaturedVideo = useCallback(
    (tempIdToFeature: string | number, isFeatured: boolean) => {
      setVideoItems((prev) =>
        prev.map((item) => ({
          ...item,
          isFeatured:
            item.tempId === tempIdToFeature
              ? isFeatured
              : isFeatured
              ? false // Jika ada yang baru di-featured, batalkan yang lain
              : item.isFeatured,
        }))
      );
    },
    []
  );

  return (
    <>
      <FormField
        control={form.control}
        name={name}
        render={() => (
          <FormItem className="space-y-4">
            <FormLabel className="text-md font-semibold flex items-center justify-between">
              {label}{" "}
              <span className="text-sm font-normal text-gray-500">
                {" "}
                (Max: {max} files)
              </span>
            </FormLabel>

            {/* Area Pratinjau Video (Diubah menggunakan videoItems) */}
            <div className="flex flex-wrap gap-3 p-3 border border-dashed rounded-lg bg-gray-50 min-h-24">
              {videoItems.map((item) => (
                <div
                  key={item.tempId}
                  className="relative w-40 h-24 border border-indigo-300 rounded-md overflow-hidden shadow-sm group"
                >
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-cover"
                  />

                  {/* Badge Featured */}
                  {item.isFeatured && (
                    <div className="absolute top-0 left-0 bg-indigo-600 p-1 rounded-br-md">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </div>
                  )}

                  {/* Overlay Aksi */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    {/* Tombol Edit Metadata */}
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-white text-gray-800 hover:bg-gray-100"
                      onClick={() => handleOpenModal(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* Tombol Hapus */}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => handleRemoveItem(item.tempId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Input File (Disembunyikan) */}
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                multiple
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Tombol Tambah Video */}
              {videoItems.length < max && (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="w-40 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs mt-1">Add Video</span>
                </div>
              )}

              {videoItems.length === 0 && (
                <p className="text-sm text-gray-500 self-center p-2 italic">
                  <Video className="h-4 w-4 inline-block mr-1 text-indigo-500" />
                  Click 'Add Video' atau seret file ke sini.
                </p>
              )}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Panggil Modal Video Detail */}
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
