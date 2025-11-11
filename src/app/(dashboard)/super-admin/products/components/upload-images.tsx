"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UploadImagesProps {
  form: any;
  name: string;
  label?: string;
  max?: number;
}

export function UploadImages({
  form,
  name,
  label = "Upload Gambar",
  max = 10,
}: UploadImagesProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { onChange, ref } }) => (
        <FormItem>
          <FormLabel className="">
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

                onChange(files);
                const urls = Array.from(files).map((file) =>
                  URL.createObjectURL(file)
                );
                setPreviews((prev) => [...prev, ...urls]);
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
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-5 w-5"
                    onClick={() =>
                      setPreviews((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
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
