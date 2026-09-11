"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import getCroppedImg from "@/lib/cropImage";
import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";

interface ImageCropperProps {
  children: React.ReactNode;
  aspectRatio: number;
  onCropComplete: (croppedFile: File) => void;
  disabled?: boolean;
}

export function ImageCropper({
  children,
  aspectRatio,
  onCropComplete,
  disabled = false,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memicu klik pada input file tersembunyi
  const handleTriggerClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Saat file dipilih dari perangkat
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = URL.createObjectURL(file);
      setImageSrc(imageDataUrl);
      setIsOpen(true); // Buka modal
    }
    // Reset input value supaya file yang sama bisa dipilih lagi jika dibatalkan
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onCropCompleteCallback = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // Proses Crop dan Simpan
  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsCropping(true);
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        `cropped-${Date.now()}.webp`,
      );
      onCropComplete(croppedFile);
      setIsOpen(false);
      setImageSrc(null);
    } catch (e) {
      console.error("Gagal melakukan crop:", e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <>
      {/* Wrapper untuk elemen yang bisa diklik (Trigger) */}
      <div
        onClick={handleTriggerClick}
        className="w-full h-full cursor-pointer">
        {children}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Modal Crop (Shadcn Dialog) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-white z-10 shadow-sm">
            <DialogTitle>Sesuaikan Gambar</DialogTitle>
          </DialogHeader>

          {/* Area Crop */}
          <div className="relative flex-1 bg-stone-900">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
                restrictPosition={false}
              />
            )}
          </div>

          <DialogFooter className="p-4 bg-white z-10 flex flex-col sm:flex-row items-center gap-4 border-t">
            <div className="flex-1 flex items-center w-full gap-2">
              <span className="text-xs text-stone-500 font-medium">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#C4A48E]"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsOpen(false)}
                disabled={isCropping}>
                Batal
              </Button>
              <Button
                onClick={handleCropSave}
                className="w-full sm:w-auto bg-[#C4A48E] hover:bg-[#a88a75] text-white"
                disabled={isCropping}>
                {isCropping ? "Memproses..." : "Crop & Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
