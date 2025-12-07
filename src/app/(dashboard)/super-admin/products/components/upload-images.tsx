import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";

interface UploadImagesProps {
  form: any;
  name: string;
  label?: string;
  max?: number;
  onFilesChange?: (files: FileList) => void; // NEW
}

export function UploadImages({
  form,
  name,
  label = "Upload Gambar",
  max = 10,
  onFilesChange,
}: UploadImagesProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { onChange, ref } }) => (
        <FormItem>
          <FormLabel>
            {label} (Maks {max})
          </FormLabel>

          <FormControl>
            <Input
              type="file"
              accept="image/*"
              multiple
              ref={ref}
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;

                // RHF update
                onChange(files);

                // Inform parent component
                onFilesChange?.(files);

                // Preview
                const urls = Array.from(files).map((file) =>
                  URL.createObjectURL(file)
                );
                setPreviews(urls);
              }}
            />
          </FormControl>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {previews.map((src, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-md overflow-hidden border"
                >
                  <Image
                    src={src}
                    alt={`preview-${index}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
