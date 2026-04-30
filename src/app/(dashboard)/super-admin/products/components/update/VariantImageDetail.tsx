"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Star, X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { VariantFormValues } from "./VariantsSection";

interface VariantImageDetailProps {
  variantIndex: number;
  imageIndex: number;
  onClose: () => void;
}

export const VariantImageDetail = ({
  variantIndex,
  imageIndex,
  onClose,
}: VariantImageDetailProps) => {
  const form = useFormContext<VariantFormValues>();

  // Path dinamis ke field spesifik
  const basePath = `variants.${variantIndex}.images.${imageIndex}` as const;

  // Watch values
  const imageUrl = form.watch(`${basePath}.url`);
  const isFeatured = form.watch(`${basePath}.isFeatured`);
  const altText = form.watch(`${basePath}.altText`);

  // Handler untuk mengubah status Featured
  const handleSetFeatured = (checked: boolean) => {
    // 1. Ambil semua gambar di varian ini
    const currentImages =
      form.getValues(`variants.${variantIndex}.images`) || [];

    // 2. Set semua gambar lain menjadi false (un-featured)
    currentImages.forEach((_, i) => {
      form.setValue(`variants.${variantIndex}.images.${i}.isFeatured`, false);
    });

    // 3. Set gambar yang sedang diedit sesuai input
    form.setValue(`${basePath}.isFeatured`, checked);
  };

  return (
    // Overlay Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
        {/* Tombol Close Absolute */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition z-10">
          <X className="w-5 h-5" />
        </button>

        {/* --- KOLOM KIRI: PREVIEW GAMBAR --- */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6 relative min-h-75">
          {/* Tampilkan gambar */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-75 object-contain shadow-md rounded-md"
            />
          ) : (
            <div className="text-gray-400 text-sm">No Image</div>
          )}

          {/* Badge Status di atas gambar */}
          {isFeatured && (
            <Badge className="absolute top-4 left-4 bg-indigo-600 hover:bg-indigo-700 gap-1 pl-1 pr-2">
              <Star className="w-3 h-3 fill-white" /> Featured Image
            </Badge>
          )}
        </div>

        {/* --- KOLOM KANAN: FORM EDIT --- */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
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
                  isFeatured
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isFeatured
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-400"
                    }`}>
                    {isFeatured && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isFeatured ? "text-indigo-700" : "text-gray-600"
                    }`}>
                    Set as Featured Image
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!isFeatured}
                  onChange={(e) => handleSetFeatured(e.target.checked)}
                />
              </label>
              <p className="text-xs text-gray-400 px-1">
                The featured image is the main photo displayed for this variant.
              </p>
            </div>

            {/* Input 2: Alt Text */}
            <div className="space-y-2">
              <Label
                htmlFor="alt-text"
                className="text-sm font-semibold text-gray-700">
                Alt Text (SEO Description)
              </Label>
              <Textarea
                id="alt-text"
                placeholder="Describe the image, e.g. 'Men's Black Cotton T-Shirt Front View'"
                className="resize-none min-h-25 focus-visible:ring-indigo-500"
                value={altText ?? ""}
                onChange={(e) =>
                  form.setValue(`${basePath}.altText`, e.target.value)
                }
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 mt-4">
            <Button
              onClick={onClose}
              className="w-full bg-gray-900 hover:bg-gray-800">
              Save Changes & Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
