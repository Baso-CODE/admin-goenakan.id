// components/upload-media/UploadImages.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Image as ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";

// Tipe yang diperbarui: onFilesChange sekarang selalu menerima File[]
interface UploadImagesProps {
  form: any;
  name: string;
  label?: string;
  max?: number;
  onFilesChange?: (files: File[]) => void;
}

export function UploadImages({
  form,
  name,
  label = "Gambar Produk Utama",
  max = 10,
  onFilesChange,
}: UploadImagesProps) {
  // State untuk menyimpan URL blob preview
  const [previews, setPreviews] = useState<string[]>([]);
  // File list yang diupload (sumber kebenaran untuk file)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    // rhfOnChange diterima dari FormField, tetapi diabaikan/tidak digunakan untuk file.
    rhfOnChange: (...event: any[]) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const combinedFiles = [...uploadedFiles, ...newFiles];

    if (combinedFiles.length > max) {
      alert(`Maximum ${max} images allowed.`);
      return;
    }

    // 1. Update list File
    setUploadedFiles(combinedFiles);

    // 2. RHF Update DIHAPUS/DIABAIKAN untuk file besar:
    // rhfOnChange(combinedFiles); // ❌ Hapus baris ini.

    // 3. Update Preview
    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newUrls]);

    // 4. Inform parent (Mengirim SEMUA file yang digabungkan)
    onFilesChange?.(combinedFiles);

    // 5. Kosongkan input agar bisa trigger onChange lagi jika file yang sama dipilih
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemovePreview = (
    indexToRemove: number,
    // rhfOnChange diterima dari FormField, tetapi diabaikan/tidak digunakan untuk file.
    rhfOnChange: (...event: any[]) => void
  ) => {
    // 1. Hapus URL preview
    URL.revokeObjectURL(previews[indexToRemove]);
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    // 2. Hapus dari list File
    const updatedFiles = uploadedFiles.filter(
      (_, idx) => idx !== indexToRemove
    );
    setUploadedFiles(updatedFiles);

    // 3. RHF Update DIHAPUS/DIABAIKAN untuk file besar:
    // rhfOnChange(updatedFiles); // ❌ Hapus baris ini.

    // 4. Inform parent (Mengirim list file yang diperbarui)
    onFilesChange?.(updatedFiles);
  };

  return (
    <FormField
      control={form.control}
      name={name}
      // Kita tetap membutuhkan field: { onChange } hanya untuk memenuhi
      // FormField RHF, meskipun kita tidak menggunakannya untuk menyimpan file.
      render={({ field: { onChange, ref } }) => (
        <FormItem className="space-y-4">
          <FormLabel className="text-md font-semibold flex items-center justify-between">
            {label}{" "}
            <span className="text-sm font-normal text-gray-500">
              {" "}
              (Max: {max} files)
            </span>
          </FormLabel>

          {/* Area Pratinjau Gambar */}
          <div className="flex flex-wrap gap-3 p-3 border border-dashed rounded-lg bg-gray-50 min-h-24">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative w-20 h-20 rounded-md overflow-hidden border border-indigo-300 shadow-sm"
              >
                <Image
                  src={src}
                  alt={`preview-${index}`}
                  fill
                  className="object-cover"
                />

                {/* Tombol Hapus Pratinjau */}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-5 w-5 opacity-90 hover:opacity-100"
                  // Kita tetap memanggil handler dengan 'onChange' agar field RHF (jika ada) ter-trigger,
                  // namun fungsi handler sudah dimodifikasi untuk mengabaikan fungsi RHF.
                  onClick={() => handleRemovePreview(index, onChange)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Input File (Disembunyikan) */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={inputRef}
              className="hidden"
              // Kita tetap memanggil handler dengan 'onChange' agar field RHF ter-trigger (meski diabaikan)
              onChange={(e) => handleFileChange(e, onChange)}
            />

            {/* Tombol Tambah Gambar */}
            {uploadedFiles.length < max && (
              <div
                onClick={() => inputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs mt-1">Add Image</span>
              </div>
            )}

            {previews.length === 0 && (
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
  );
}
