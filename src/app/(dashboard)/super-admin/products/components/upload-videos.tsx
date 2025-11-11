"use client";

import { useState } from "react";
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

interface UploadVideosProps {
  form: any;
  name: string;
  label?: string;
  max?: number;
}

export function UploadVideos({
  form,
  name,
  label = "Upload Video",
  max = 3,
}: UploadVideosProps) {
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
              accept="video/mp4,video/quicktime"
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
            <div className="flex flex-wrap gap-3 mt-3">
              {previews.map((src, index) => (
                <div
                  key={index}
                  className="relative w-40 h-24 border rounded-md overflow-hidden"
                >
                  <video
                    src={src}
                    controls
                    className="w-full h-full object-cover"
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
