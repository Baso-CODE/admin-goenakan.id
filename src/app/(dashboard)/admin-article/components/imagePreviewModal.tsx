"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePreviewModalProps {
  src: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}
export function ImagePreviewModal({
  src,
  isOpen,
  onClose,
  alt,
}: ImagePreviewModalProps) {
  if (!src) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Menggunakan variabel warna tema Anda */}
      <DialogContent className="max-w-[95vw] md:max-w-5xl p-2 bg-[oklch(0.22_0.02_50/0.95)] border-none shadow-2xl overflow-hidden backdrop-blur-sm">
        <DialogHeader className="hidden">
          <DialogTitle>{alt || "Image Preview"}</DialogTitle>
        </DialogHeader>

        <div className="relative flex items-center justify-center w-full min-h-[50vh] max-h-[85vh]">
          <img
            src={src}
            alt={alt || "Preview"}
            className="w-full h-full object-contain rounded-md shadow-lg"
          />
        </div>

        {alt && (
          <p className="text-primary-foreground text-center text-sm font-medium py-3">
            {alt}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
