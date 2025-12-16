// components/upload-media/UploadImages.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Image as ImageIcon, Plus, Star, X, Pencil } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState, useEffect, useCallback } from "react";
// import { useFormContext } from "react-hook-form"; // Tidak wajib jika pass 'form' via props
import { ImageDetailModalCore } from "./imageDetailCore";

// =======================================================
// 1. Definisikan Tipe Data
// =======================================================

export interface ImageMeta {
  url: string;
  altText: string;
  isFeatured: boolean;
  isNew: boolean;
  id?: string;
}

export interface ImageItem extends ImageMeta {
  tempId: number;
  file?: File;
}

// =======================================================
// 2. Props UploadImages
// =======================================================

interface UploadImagesProps {
  form: any;
  name: string;
  metadataName: string;
  label?: string;
  max?: number;
  onFilesChange: (files: File[]) => void;
}

// =======================================================
// 3. Komponen UploadImages
// =======================================================

export function UploadImages({
  form,
  name,
  metadataName,
  label = "Gambar Produk Utama",
  max = 10,
  onFilesChange,
}: UploadImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // State Lokal
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageItem, setSelectedImageItem] = useState<ImageItem | null>(
    null
  );
  const [tempIdCounter, setTempIdCounter] = useState(0);

  // =======================================================
  // LOGIKA SINKRONISASI (FIXED INFINITE LOOP)
  // =======================================================

  useEffect(() => {
    // 1. Ekstrak Files untuk Parent
    const filesToUpload = imageItems
      .filter((item) => item.isNew && item.file)
      .map((item) => item.file!);

    // 2. Ekstrak Metadata untuk RHF
    const metadataForForm = imageItems.map((item) => ({
      isFeatured: item.isFeatured,
      altText: item.altText,
    }));

    // --- BAGIAN KRUSIAL UNTUK MENCEGAH LOOP ---

    // A. Kirim File ke Parent
    // Kita panggil ini agar parent tahu file fisik yang mau diupload
    onFilesChange(filesToUpload);

    // B. Kirim Metadata ke RHF dengan GUARD (Pencegah Loop)
    // Ambil nilai yang saat ini ada di RHF
    const currentRHFValue = form.getValues(metadataName);

    // Bandingkan string JSON-nya.
    // Jika isinya SAMA PERSIS, JANGAN panggil setValue.
    if (JSON.stringify(currentRHFValue) !== JSON.stringify(metadataForForm)) {
      form.setValue(metadataName, metadataForForm, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageItems]);
  // PENJELASAN DEPENDENCY:
  // Kita HANYA ingin effect ini jalan kalau 'imageItems' lokal berubah.
  // Kita sengaja menghapus 'form', 'onFilesChange', dll dari dependency
  // karena referensi mereka bisa tidak stabil dan memicu loop lagi.

  // =======================================================
  // LOGIKA LAINNYA (TIDAK BERUBAH)
  // =======================================================

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const combinedLength = imageItems.length + newFiles.length;

    if (combinedLength > max) {
      alert(`Maximum ${max} images allowed.`);
      return;
    }

    let currentTempId = tempIdCounter;
    const newItems: ImageItem[] = newFiles.map((file) => {
      currentTempId += 1;
      return {
        tempId: currentTempId,
        url: URL.createObjectURL(file),
        altText: "",
        isFeatured: false,
        isNew: true,
        file: file,
      };
    });

    setTempIdCounter(currentTempId);
    setImageItems((prev) => [...prev, ...newItems]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveItem = (tempIdToRemove: number) => {
    const itemToRemove = imageItems.find(
      (item) => item.tempId === tempIdToRemove
    );
    if (itemToRemove && itemToRemove.isNew) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    setImageItems((prev) =>
      prev.filter((item) => item.tempId !== tempIdToRemove)
    );
  };

  const handleOpenModal = (item: ImageItem) => {
    setSelectedImageItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedImageItem(null);
    setIsModalOpen(false);
  };

  const setImageMetaField = useCallback(
    (tempId: number, patch: Partial<ImageMeta>) => {
      setImageItems((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, ...patch } : item
        )
      );
    },
    []
  );

  const setFeaturedImage = useCallback(
    (tempIdToFeature: number, isFeatured: boolean) => {
      setImageItems((prev) =>
        prev.map((item) => ({
          ...item,
          isFeatured:
            item.tempId === tempIdToFeature
              ? isFeatured
              : isFeatured
              ? false
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
                (Max: {max} files)
              </span>
            </FormLabel>

            {/* Area Pratinjau Gambar */}
            <div className="flex flex-wrap gap-3 p-3 border border-dashed rounded-lg bg-gray-50 min-h-24">
              {imageItems.map((item) => (
                <div
                  key={item.tempId}
                  className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-300 shadow-sm group"
                >
                  <Image
                    src={item.url}
                    alt={item.altText || "Product Image"}
                    fill
                    className="object-cover"
                  />

                  {/* Badge Featured */}
                  {item.isFeatured && (
                    <div className="absolute top-0 left-0 bg-indigo-600 p-1 rounded-br-md">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </div>
                  )}

                  {/* Overlay Aksi */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-white text-gray-800 hover:bg-gray-100"
                      onClick={() => handleOpenModal(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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

              {/* Input File Hidden */}
              <input
                type="file"
                accept="image/*"
                multiple
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Tombol Add */}
              {imageItems.length < max && (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs mt-1">Add Image</span>
                </div>
              )}

              {imageItems.length === 0 && (
                <p className="text-sm text-gray-500 self-center p-2 italic">
                  <ImageIcon className="h-4 w-4 inline-block mr-1 text-indigo-500" />
                  Click 'Add Image' atau seret file ke sini.
                </p>
              )}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      {isModalOpen && selectedImageItem && (
        <ImageDetailModalCore
          tempId={selectedImageItem.tempId}
          imageMeta={selectedImageItem}
          onClose={handleCloseModal}
          setImageMetaField={setImageMetaField}
          setFeaturedImage={setFeaturedImage}
        />
      )}
    </>
  );
}
