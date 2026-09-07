"use client";

import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Image as ImageIcon, Pencil, Plus, Star, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { ImageDetailModalCore } from "./imageDetailCore";

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

interface UploadImagesProps {
  form: any;
  name: string;
  metadataName: string;
  label?: string;
  max?: number;
  onFilesChange: (files: File[]) => void;
}

// 3. Komponen UploadImages

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
    null,
  );
  const [tempIdCounter, setTempIdCounter] = useState(0);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingOverZone, setIsDraggingOverZone] = useState(false);

  useEffect(() => {
    const filesToUpload = imageItems
      .filter((item) => item.isNew && item.file)
      .map((item) => item.file!);

    const metadataForForm = imageItems.map((item) => ({
      isFeatured: item.isFeatured,
      altText: item.altText,
    }));

    onFilesChange(filesToUpload);

    const currentRHFValue = form.getValues(metadataName);

    if (JSON.stringify(currentRHFValue) !== JSON.stringify(metadataForForm)) {
      form.setValue(metadataName, metadataForForm, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [imageItems]);

  const processIncomingFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name),
    );
    if (newFiles.length === 0) return;

    const combinedLength = imageItems.length + newFiles.length;

    if (combinedLength > max) {
      alert(`Maksimal ${max} gambar yang diizinkan.`);
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processIncomingFiles(e.target.files);
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

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverZone(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
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

    const reordered = [...imageItems];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setImageItems(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemoveItem = (tempIdToRemove: number) => {
    const itemToRemove = imageItems.find(
      (item) => item.tempId === tempIdToRemove,
    );
    if (itemToRemove && itemToRemove.isNew) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    setImageItems((prev) =>
      prev.filter((item) => item.tempId !== tempIdToRemove),
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
    (tempId: string | number, patch: Partial<ImageMeta>) => {
      setImageItems((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const setFeaturedImage = useCallback(
    (tempIdToFeature: string | number, isFeatured: boolean) => {
      setImageItems((prev) =>
        prev.map((item) => ({
          ...item,
          isFeatured:
            item.tempId === tempIdToFeature
              ? isFeatured
              : isFeatured
                ? false
                : item.isFeatured,
        })),
      );
    },
    [],
  );

  return (
    <>
      <FormField
        control={form.control}
        name={name}
        render={() => (
          <FormItem className="space-y-4">
            <FormLabel className="text-md font-semibold flex items-center justify-between">
              <span>{label}</span>
              <span className="text-xs font-normal text-stone-500">
                (Tersimpan: {imageItems.length} / Max: {max} gambar • Geser untuk atur urutan)
              </span>
            </FormLabel>

            {/* Area Pratinjau Gambar / Dropzone */}
            <div
              onDragOver={handleZoneDragOver}
              onDragLeave={handleZoneDragLeave}
              onDrop={handleZoneDrop}
              className={`flex flex-wrap gap-3 p-3 border-2 border-dashed rounded-lg transition-colors min-h-28 ${
                isDraggingOverZone
                  ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30"
                  : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50"
              }`}>
              {imageItems.map((item, index) => {
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
                    className={`relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm group cursor-grab active:cursor-grabbing transition-all select-none ${
                      isItemDragged
                        ? "opacity-30 scale-95 border-dashed border-indigo-400 bg-indigo-50"
                        : isItemOver
                          ? "border-indigo-500 ring-2 ring-indigo-400 scale-105"
                          : "border-stone-200 dark:border-stone-700 hover:shadow-md"
                    }`}>
                    <Image
                      src={item.url}
                      alt={item.altText || "Product Image"}
                      fill
                      className="object-cover pointer-events-none"
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

                    {/* Overlay Aksi */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2 z-20">
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
                          handleRemoveItem(item.tempId);
                        }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Input File Hidden */}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                ref={inputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Tombol Add */}
              {imageItems.length < max && (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center text-stone-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-all">
                  <Plus className="h-6 w-6" />
                  <span className="text-[11px] font-medium mt-1">Tambah Foto</span>
                </div>
              )}

              {imageItems.length === 0 && (
                <div
                  onClick={() => inputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center py-4 cursor-pointer text-stone-400 hover:text-stone-600">
                  <ImageIcon className="h-6 w-6 mb-1 text-indigo-500 opacity-80" />
                  <p className="text-xs">
                    Klik <strong>Tambah Foto</strong> atau seret multiple gambar ke sini
                  </p>
                </div>
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
