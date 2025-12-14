// components/upload-media/UploadVideos.tsx
"use client";

import { useState, ChangeEvent, useRef } from "react";
import { X, Plus, Video } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface UploadVideosProps {
  form: any;
  name: string;
  label?: string;
  max?: number;
  onFilesChange?: (files: FileList) => void;
}

export function UploadVideos({
  form,
  name,
  label = "Video Produk",
  max = 3,
  onFilesChange,
}: UploadVideosProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    rhfOnChange: (...event: any[]) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const combinedFiles = [...uploadedFiles, ...newFiles];

    if (combinedFiles.length > max) {
      alert(`Maximum ${max} videos allowed.`);
      return;
    }

    // 1. Update list File
    setUploadedFiles(combinedFiles);

    // 2. Update RHF
    rhfOnChange(combinedFiles);

    // 3. Update Preview
    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newUrls]);

    // 4. Inform parent (jika perlu)
    onFilesChange?.(files);

    // Kosongkan input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemovePreview = (
    indexToRemove: number,
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

    // 3. Update RHF
    rhfOnChange(updatedFiles);
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { onChange, ref } }) => (
        <FormItem className="space-y-4">
          <FormLabel className="text-md font-semibold flex items-center justify-between">
            {label}{" "}
            <span className="text-sm font-normal text-gray-500">
              {" "}
              (Max: {max} files)
            </span>
          </FormLabel>

          {/* Area Pratinjau Video */}
          <div className="flex flex-wrap gap-3 p-3 border border-dashed rounded-lg bg-gray-50 min-h-24">
            {previews.map((src, index) => (
              <div
                key={index}
                // Dibiarkan lebih besar agar video bisa dilihat
                className="relative w-40 h-24 border border-indigo-300 rounded-md overflow-hidden shadow-sm"
              >
                <video
                  src={src}
                  controls
                  className="w-full h-full object-cover"
                />

                {/* Tombol Hapus Pratinjau */}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-5 w-5 opacity-90 hover:opacity-100"
                  onClick={() => handleRemovePreview(index, onChange)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Input File (Disembunyikan) */}
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              multiple
              ref={inputRef}
              className="hidden"
              onChange={(e) => handleFileChange(e, onChange)}
            />

            {/* Tombol Tambah Video - DIMENSI W-20 H-20 DISERAGAMKAN DENGAN IMAGES */}
            {uploadedFiles.length < max && (
              <div
                onClick={() => inputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs mt-1">Add Video</span>
              </div>
            )}

            {previews.length === 0 && (
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
  );
}
