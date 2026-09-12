"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// ✨ Import createImage dari utility
import getCroppedImg, { createImage } from "@/lib/cropImage";
import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
// ✨ Import ikon pendukung
import {
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
} from "lucide-react";

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
  const [rotation, setRotation] = useState(0); // ✨ State baru untuk Rotasi
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = URL.createObjectURL(file);
      setImageSrc(imageDataUrl);

      // ✨ Reset state saat gambar baru dipilih
      setRotation(0);
      setZoom(1);
      setIsOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onCropCompleteCallback = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // ✨ Fungsi untuk Membalik Gambar (Flip)
  const flipImage = async (direction: "horizontal" | "vertical") => {
    if (!imageSrc) return;
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = image.width;
      canvas.height = image.height;

      // Logika pembalikan menggunakan skala negatif
      if (direction === "horizontal") {
        ctx.translate(image.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, image.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(image, 0, 0);

      // Update imageSrc dengan versi yang sudah dibalik
      const newImageSrc = canvas.toDataURL("image/png");
      setImageSrc(newImageSrc);
    } catch (e) {
      console.error("Gagal melakukan flip gambar:", e);
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsCropping(true);
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation, // ✨ Kirim parameter rotasi ke utility
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[650px] h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-white z-10 shadow-sm border-b">
            <DialogTitle>Sesuaikan Gambar</DialogTitle>
          </DialogHeader>

          {/* ✨ Toolbar Rotasi & Flip */}
          <div className="flex items-center justify-center gap-2 p-3 bg-stone-50 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r - 90)}>
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Kiri</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r + 90)}>
              <RotateCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Kanan</span>
            </Button>
            <div className="w-px h-6 bg-stone-300 mx-2" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => flipImage("horizontal")}>
              <FlipHorizontal className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Horizontal</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => flipImage("vertical")}>
              <FlipVertical className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Vertikal</span>
            </Button>
          </div>

          {/* Area Crop */}
          <div className="relative flex-1 bg-stone-900">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation} // ✨ Kirim rotasi ke cropper
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteCallback}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
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
