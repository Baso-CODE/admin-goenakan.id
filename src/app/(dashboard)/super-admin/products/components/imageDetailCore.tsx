"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface ImageMeta {
  url: string;
  altText?: string;
  isFeatured?: boolean;
  isNew?: boolean;
}

interface ImageDetailModalProps {
  tempId: string | number;
  imageMeta: ImageMeta;
  onClose: () => void;

  setImageMetaField: (
    tempId: string | number,
    patch: Partial<ImageMeta>
  ) => void;

  setFeaturedImage: (tempId: string | number, isFeatured: boolean) => void;
}

export const ImageDetailModalCore = ({
  imageMeta,
  tempId,
  onClose,
  setImageMetaField,
  setFeaturedImage,
}: ImageDetailModalProps) => {
  // State lokal untuk form
  const [altText, setAltText] = useState(imageMeta.altText || "");

  const handleSaveAndClose = useCallback(() => {
    setImageMetaField(tempId, { altText });
    onClose();
  }, [altText, onClose, setImageMetaField, tempId]);

  const handleSetFeatured = (checked: boolean) => {
    setFeaturedImage(tempId, checked);
  };

  // Menangani penutupan modal dengan tombol Esc
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSaveAndClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveAndClose]);

  return (
    // ... (JSX Modal Anda yang tidak berubah)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
        {/* Tombol Close Absolute */}
        <button
          onClick={handleSaveAndClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition z-10"
          title="Save Changes & Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- KOLOM KIRI: PREVIEW GAMBAR --- */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6 relative min-h-[300px]">
          {/* Tampilkan gambar */}
          {imageMeta.url ? (
            <img
              src={imageMeta.url}
              // Menggunakan altText dari state lokal untuk preview
              alt={altText || "Preview"}
              className="max-w-full max-h-[300px] object-contain shadow-md rounded-md"
            />
          ) : (
            <div className="text-gray-400 text-sm">No Image</div>
          )}

          {/* Badge Status di atas gambar */}
          {imageMeta.isFeatured && ( // Gunakan isFeatured dari prop (yang sudah di-sync dari parent)
            <Badge className="absolute top-4 left-4 bg-indigo-600 hover:bg-indigo-700 gap-1 pl-1 pr-2">
              <Star className="w-3 h-3 fill-white" /> Featured Image
            </Badge>
          )}
          {imageMeta.isNew && (
            <Badge className="absolute top-4 right-4 bg-green-500 hover:bg-green-600">
              NEW
            </Badge>
          )}
        </div>

        {/* --- KOLOM KANAN: FORM EDIT --- */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* ... (Header) ... */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">Image Details</h3>
              <p className="text-sm text-gray-500">
                Edit metadata for improved SEO and display.
              </p>
            </div>

            <hr className="border-gray-100" />

            {/* Input 1: Featured Toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Display Setting
              </Label>
              <label
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  imageMeta.isFeatured // Gunakan isFeatured dari prop
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      imageMeta.isFeatured // Gunakan isFeatured dari prop
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-400"
                    }`}
                  >
                    {imageMeta.isFeatured && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      imageMeta.isFeatured ? "text-indigo-700" : "text-gray-600"
                    }`}
                  >
                    Set as Featured Image
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!imageMeta.isFeatured} // Gunakan isFeatured dari prop
                  onChange={(e) => handleSetFeatured(e.target.checked)}
                />
              </label>
              <p className="text-xs text-gray-400 px-1">
                The featured image is the main photo displayed for this product.
              </p>
            </div>

            {/* Input 2: Alt Text */}
            <div className="space-y-2">
              <Label
                htmlFor="alt-text"
                className="text-sm font-semibold text-gray-700"
              >
                Alt Text (SEO Description)
              </Label>
              <Textarea
                id="alt-text"
                placeholder="Describe the image, e.g. 'Men's Black Cotton T-Shirt Front View'"
                className="resize-none min-h-[100px] focus-visible:ring-indigo-500"
                value={altText ?? ""}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-4">
            <Button
              onClick={handleSaveAndClose}
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              Save Changes & Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
