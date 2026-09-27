"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";

import "cropperjs/dist/cropper.css";

interface ImageCropperProps {
  children: React.ReactNode;
  aspectRatio?: number | null;
  onCropComplete: (croppedFile: File) => void;
  disabled?: boolean;
  allowVideo?: boolean;
}

export function ImageCropper({
  children,
  aspectRatio,
  onCropComplete,
  disabled = false,
  allowVideo = false,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const [isCropping, setIsCropping] = useState(false);

  const [zoomValue, setZoomValue] = useState(1);

  const [scaleX, setScaleX] = useState(1);

  const [scaleY, setScaleY] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cropperRef = useRef<ReactCropperElement>(null);

  /**
   * ==========================================
   * CLEANUP BLOB
   * ==========================================
   */
  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  /**
   * ==========================================
   * OPEN FILE PICKER
   * ==========================================
   */
  const handleTriggerClick = () => {
    if (disabled) return;

    fileInputRef.current?.click();
  };

  /**
   * ==========================================
   * FILE CHANGE
   * ==========================================
   */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    /**
     * VIDEO
     */
    if (file.type.startsWith("video/")) {
      if (allowVideo) {
        onCropComplete(file);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    /**
     * IMAGE VALIDATION
     */
    if (!file.type.startsWith("image/")) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    /**
     * Cleanup source sebelumnya.
     */
    if (imageSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }

    const objectUrl = URL.createObjectURL(file);

    setImageSrc(objectUrl);

    /**
     * Reset transform.
     */
    setZoomValue(1);

    setScaleX(1);
    setScaleY(1);

    setIsOpen(true);

    /**
     * Agar file yang sama
     * bisa dipilih kembali.
     */
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * ==========================================
   * GET CROPPER
   * ==========================================
   */
  const getCropper = () => {
    return cropperRef.current?.cropper;
  };

  /**
   * ==========================================
   * ROTATE LEFT
   * ==========================================
   */
  const handleRotateLeft = () => {
    const cropper = getCropper();

    if (!cropper) return;

    cropper.rotate(-90);
  };

  /**
   * ==========================================
   * ROTATE RIGHT
   * ==========================================
   */
  const handleRotateRight = () => {
    const cropper = getCropper();

    if (!cropper) return;

    cropper.rotate(90);
  };

  /**
   * ==========================================
   * FLIP HORIZONTAL
   * ==========================================
   */
  const handleFlipHorizontal = () => {
    const cropper = getCropper();

    if (!cropper) return;

    const nextScaleX = scaleX * -1;

    setScaleX(nextScaleX);

    cropper.scaleX(nextScaleX);
  };

  /**
   * ==========================================
   * FLIP VERTICAL
   * ==========================================
   */
  const handleFlipVertical = () => {
    const cropper = getCropper();

    if (!cropper) return;

    const nextScaleY = scaleY * -1;

    setScaleY(nextScaleY);

    cropper.scaleY(nextScaleY);
  };

  /**
   * ==========================================
   * ZOOM IN
   * ==========================================
   */
  const handleZoomIn = () => {
    const cropper = getCropper();

    if (!cropper) return;

    /**
     * +2%.
     */
    cropper.zoom(0.02);

    setZoomValue((prev) => Math.min(3, Number((prev + 0.02).toFixed(2))));
  };

  /**
   * ==========================================
   * ZOOM OUT
   * ==========================================
   */
  const handleZoomOut = () => {
    const cropper = getCropper();

    if (!cropper) return;

    /**
     * -2%.
     */
    cropper.zoom(-0.02);

    setZoomValue((prev) => Math.max(0.1, Number((prev - 0.02).toFixed(2))));
  };

  /**
   * ==========================================
   * ZOOM SLIDER
   * ==========================================
   */
  const handleZoomSlider = (value: number) => {
    const cropper = getCropper();

    if (!cropper) return;

    /**
     * Ambil ratio image saat ini.
     */
    const imageData = cropper.getImageData();

    const currentRatio = imageData.width / imageData.naturalWidth;

    /**
     * Target relative terhadap
     * base image.
     */
    const difference = value - zoomValue;

    cropper.zoom(difference);

    setZoomValue(value);
  };

  /**
   * ==========================================
   * RESET
   * ==========================================
   */
  const handleReset = () => {
    const cropper = getCropper();

    if (!cropper) return;

    cropper.reset();

    /**
     * Setelah reset, pastikan
     * aspect ratio tetap sesuai prop.
     */
    cropper.setAspectRatio(aspectRatio ?? Number.NaN);

    setZoomValue(1);

    setScaleX(1);
    setScaleY(1);
  };

  /**
   * ==========================================
   * CROPPER READY
   * ==========================================
   */
  const handleCropperReady = () => {
    const cropper = getCropper();

    if (!cropper) return;

    /**
     * Pakai aspect ratio
     * dari parent.
     *
     * null / undefined =
     * free crop.
     */
    cropper.setAspectRatio(aspectRatio ?? Number.NaN);

    /**
     * Reset posisi awal.
     */
    setZoomValue(1);

    setScaleX(1);
    setScaleY(1);
  };

  /**
   * ==========================================
   * SAVE
   * ==========================================
   */
  const handleCropSave = async () => {
    const cropper = getCropper();

    if (!cropper) return;

    try {
      setIsCropping(true);

      /**
       * Canvas hasil crop.
       */
      const canvas = cropper.getCroppedCanvas({
        /**
         * Batasi output terlalu besar.
         */
        maxWidth: 4096,
        maxHeight: 4096,

        /**
         * Kualitas resize.
         */
        imageSmoothingEnabled: true,

        imageSmoothingQuality: "high",

        /**
         * Untuk image transparan.
         */
        fillColor: "transparent",
      });

      if (!canvas) {
        throw new Error("Gagal membuat canvas crop");
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.92);
      });

      if (!blob) {
        throw new Error("Gagal membuat file hasil crop");
      }

      const file = new File([blob], `cropped-${Date.now()}.webp`, {
        type: "image/webp",
      });

      onCropComplete(file);

      closeEditor();
    } catch (error) {
      console.error("Gagal melakukan crop:", error);
    } finally {
      setIsCropping(false);
    }
  };

  /**
   * ==========================================
   * CLOSE EDITOR
   * ==========================================
   */
  const closeEditor = () => {
    if (imageSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }

    setImageSrc(null);

    setZoomValue(1);

    setScaleX(1);
    setScaleY(1);

    setIsOpen(false);
  };

  /**
   * ==========================================
   * DIALOG CHANGE
   * ==========================================
   */
  const handleDialogChange = (open: boolean) => {
    if (isCropping) {
      return;
    }

    if (!open) {
      closeEditor();
      return;
    }

    setIsOpen(true);
  };

  return (
    <>
      {/* ================================= */}
      {/* TRIGGER */}
      {/* ================================= */}

      <div
        onClick={handleTriggerClick}
        className="w-full h-full cursor-pointer">
        {children}

        <input
          ref={fileInputRef}
          type="file"
          accept={allowVideo ? "image/*,video/*" : "image/*"}
          onChange={onFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* ================================= */}
      {/* DIALOG */}
      {/* ================================= */}

      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent
          className="
            sm:max-w-4xl
            h-[90vh]
            max-h-[900px]
            flex
            flex-col
            p-0
            overflow-hidden
            bg-white
          ">
          {/* ============================= */}
          {/* HEADER */}
          {/* ============================= */}

          <DialogHeader
            className="
              shrink-0
              px-5
              py-4
              bg-white
              border-b
            ">
            <DialogTitle>Sesuaikan Area Gambar</DialogTitle>
          </DialogHeader>

          {/* ============================= */}
          {/* TOOLBAR */}
          {/* ============================= */}

          <div
            className="
              shrink-0
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              bg-stone-50
              border-b
              overflow-x-auto
            ">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotateLeft}
              disabled={isCropping}>
              <RotateCcw className="w-4 h-4 sm:mr-2" />

              <span className="hidden sm:inline">Kiri</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotateRight}
              disabled={isCropping}>
              <RotateCw className="w-4 h-4 sm:mr-2" />

              <span className="hidden sm:inline">Kanan</span>
            </Button>

            <div className="w-px h-6 bg-stone-300 mx-1 shrink-0" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFlipHorizontal}
              disabled={isCropping}>
              <FlipHorizontal className="w-4 h-4 sm:mr-2" />

              <span className="hidden sm:inline">Horizontal</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFlipVertical}
              disabled={isCropping}>
              <FlipVertical className="w-4 h-4 sm:mr-2" />

              <span className="hidden sm:inline">Vertikal</span>
            </Button>

            <div className="w-px h-6 bg-stone-300 mx-1 shrink-0" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isCropping}>
              Reset
            </Button>
          </div>

          {/* ============================= */}
          {/* INFO */}
          {/* ============================= */}

          <div
            className="
              shrink-0
              bg-white
              border-b
              px-4
              py-2
              text-center
            ">
            <p className="text-xs text-stone-500">
              {aspectRatio
                ? "Rasio crop mengikuti ukuran yang ditentukan. Gambar dapat digeser dan diperbesar di dalam area crop."
                : "Crop bebas. Tarik sudut atau sisi untuk menentukan ukuran potongan."}
            </p>
          </div>

          {/* ============================= */}
          {/* CROPPER */}
          {/* ============================= */}

          <div
            className="
              relative
              flex-1
              min-h-0
              bg-[#111111]
            ">
            {imageSrc && (
              <Cropper
                ref={cropperRef}
                src={imageSrc}
                /**
                 * Sangat penting:
                 *
                 * width + height 100%
                 * membuat editor tidak
                 * terpisah-pisah.
                 */
                style={{
                  height: "100%",
                  width: "100%",
                }}
                /**
                 * Aspect ratio parent.
                 *
                 * NaN = FREE.
                 */
                aspectRatio={aspectRatio ?? Number.NaN}
                /**
                 * Crop box langsung
                 * muncul ketika editor dibuka.
                 */
                autoCrop
                autoCropArea={0.9}
                /**
                 * User bisa resize crop box.
                 */
                cropBoxResizable
                /**
                 * User bisa geser crop box.
                 */
                cropBoxMovable
                /**
                 * User bisa drag gambar.
                 */
                dragMode="move"
                /**
                 * Double click tidak
                 * mengubah drag mode.
                 */
                toggleDragModeOnDblclick={false}
                /**
                 * Gambar tetap berada
                 * di area canvas.
                 *
                 * Ini mengurangi kejadian
                 * gambar lari ke pojok.
                 */
                viewMode={1}
                /**
                 * Zoom menggunakan
                 * mouse wheel.
                 */
                zoomable
                zoomOnWheel
                /**
                 * Cropper responsive.
                 */
                responsive
                /**
                 * Tidak menampilkan
                 * background grid tambahan.
                 */
                background={false}
                /**
                 * Guidelines.
                 */
                guides
                center
                highlight
                /**
                 * Crop box minimum.
                 */
                minCropBoxWidth={40}
                minCropBoxHeight={40}
                /**
                 * Restore posisi jika
                 * ukuran container berubah.
                 */
                restore
                /**
                 * Cek orientation EXIF.
                 */
                checkOrientation
                /**
                 * Ready.
                 */
                ready={handleCropperReady}
              />
            )}
          </div>

          {/* ============================= */}
          {/* ZOOM */}
          {/* ============================= */}

          <div
            className="
              shrink-0
              px-5
              py-3
              bg-stone-50
              border-t
            ">
            <div className="flex items-center gap-3">
              {/* ZOOM OUT BUTTON */}

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleZoomOut}
                disabled={isCropping}>
                <ZoomOut className="w-4 h-4" />
              </Button>

              {/* ZOOM SLIDER */}

              <input
                type="range"
                value={zoomValue}
                min={0.5}
                max={3}
                /**
                 * Sekarang 1%,
                 * bukan lompat 5%.
                 */
                step={0.01}
                onChange={(e) => handleZoomSlider(Number(e.target.value))}
                disabled={isCropping}
                className="
                  flex-1
                  accent-[#C4A48E]
                  cursor-pointer
                "
              />

              {/* ZOOM IN BUTTON */}

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleZoomIn}
                disabled={isCropping}>
                <ZoomIn className="w-4 h-4" />
              </Button>

              {/* PERCENTAGE */}

              <span
                className="
                  text-xs
                  text-stone-500
                  font-medium
                  min-w-[52px]
                  text-right
                ">
                {Math.round(zoomValue * 100)}%
              </span>
            </div>
          </div>

          {/* ============================= */}
          {/* FOOTER */}
          {/* ============================= */}

          <DialogFooter
            className="
              shrink-0
              p-4
              bg-white
              border-t
              flex
              flex-col
              sm:flex-row
              gap-2
            ">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditor}
              disabled={isCropping}>
              Batal
            </Button>

            <Button
              type="button"
              onClick={handleCropSave}
              disabled={isCropping}
              className="
                bg-[#C4A48E]
                hover:bg-[#a88a75]
                text-white
              ">
              {isCropping ? "Memproses..." : "Crop & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
