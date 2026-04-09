"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, Plus, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// --- TIPE DATA ---
type ImageMeta = {
  tempId: string;
  url: string;
  isFeatured: boolean;
  altText: string;
  file: File;
};

type VariantState = {
  variantIndex: number;
  images: ImageMeta[];
};

// --- PROPS ---
interface VariantListProps {
  combinations: { label: string; valueIds: string[] }[];
  variantMetas: {
    variantIndex: number;
    price: number;
    description?: string;
    isFeatured?: boolean;
    altText?: string;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
  }[];
  onUpdateVariantMeta: (index: number, field: string, value: any) => void;
  onChangeMeta: (filesMap: File[][]) => void;
}

// --- MODAL (TIDAK BERUBAH) ---
interface ImageDetailModalProps {
  image: ImageMeta;
  onClose: () => void;
  onSave: (updates: Partial<ImageMeta>) => void;
  onSetFeatured: (isFeatured: boolean) => void;
}

const ImageDetailModal = ({
  image,
  onClose,
  onSave,
  onSetFeatured,
}: ImageDetailModalProps) => {
  const [altText, setAltText] = useState(image.altText);
  const [isFeatured, setIsFeatured] = useState(image.isFeatured);

  const handleSave = () => {
    onSave({ altText });
    onClose();
  };

  const handleFeaturedChange = (checked: boolean) => {
    setIsFeatured(checked);
    onSetFeatured(checked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6 relative mmin-h-75">
          <img
            src={image.url}
            alt="Preview"
            className="max-w-full max-h-75 object-contain shadow-md rounded-md"
          />
          {isFeatured && (
            <Badge className="absolute top-4 left-4 bg-indigo-600">
              <Star className="w-3 h-3 fill-white mr-1" /> Featured
            </Badge>
          )}
        </div>
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Image Details</h3>
            <div className="space-y-3">
              <Label>Display Setting</Label>
              <label
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer ${
                  isFeatured
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200"
                }`}>
                <span className="text-sm font-medium text-gray-700">
                  Set as Featured
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isFeatured}
                  onChange={(e) => handleFeaturedChange(e.target.checked)}
                />
                {isFeatured && <Check className="w-4 h-4 text-indigo-600" />}
              </label>
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Textarea
                placeholder="Describe image for SEO..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-6 w-full">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT UTAMA ---
export function VariantList({
  combinations,
  variantMetas,
  onUpdateVariantMeta,
  onChangeMeta,
}: VariantListProps) {
  const [variantStates, setVariantStates] = useState<VariantState[]>(() =>
    combinations.map((_, idx) => ({ variantIndex: idx, images: [] })),
  );

  useEffect(() => {
    setVariantStates((prev) => {
      if (prev.length !== combinations.length) {
        return combinations.map((_, idx) => ({
          variantIndex: idx,
          images: [],
        }));
      }
      return prev;
    });
  }, [combinations.length]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [modalData, setModalData] = useState<{
    variantIdx: number;
    tempId: string;
  } | null>(null);

  const syncToParent = (newStates: VariantState[]) => {
    const filesMap = newStates.map((v) => v.images.map((img) => img.file));
    onChangeMeta(filesMap);
  };

  const handleAddFiles = (idx: number, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);

    setVariantStates((prev) => {
      const nextState = prev.map((v) => {
        if (v.variantIndex !== idx) return v;
        const newImages: ImageMeta[] = newFiles.map((file, i) => ({
          tempId: `v${idx}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)}-${i}`,
          url: URL.createObjectURL(file),
          file,
          isFeatured: v.images.length === 0 && i === 0,
          altText: "",
          isNew: true,
        }));
        return { ...v, images: [...v.images, ...newImages] };
      });
      syncToParent(nextState);
      return nextState;
    });
  };

  const handleRemoveFile = (variantIdx: number, tempId: string) => {
    setVariantStates((prev) => {
      const nextState = prev.map((v) => {
        if (v.variantIndex !== variantIdx) return v;
        const filtered = v.images.filter((img) => img.tempId !== tempId);
        if (
          v.images.find((img) => img.tempId === tempId)?.isFeatured &&
          filtered.length > 0
        ) {
          filtered[0].isFeatured = true;
        }
        return { ...v, images: filtered };
      });
      syncToParent(nextState);
      return nextState;
    });
  };

  const handleUpdateImageMeta = (
    variantIdx: number,
    tempId: string,
    updates: Partial<ImageMeta>,
  ) => {
    setVariantStates((prev) =>
      prev.map((v) => {
        if (v.variantIndex !== variantIdx) return v;
        return {
          ...v,
          images: v.images.map((img) =>
            img.tempId === tempId ? { ...img, ...updates } : img,
          ),
        };
      }),
    );
  };

  const handleSetFeatured = (variantIdx: number, tempId: string) => {
    setVariantStates((prev) =>
      prev.map((v) => {
        if (v.variantIndex !== variantIdx) return v;
        return {
          ...v,
          images: v.images.map((img) => ({
            ...img,
            isFeatured: img.tempId === tempId,
          })),
        };
      }),
    );
  };

  const activeImage = modalData
    ? variantStates
        .find((v) => v.variantIndex === modalData.variantIdx)
        ?.images.find((img) => img.tempId === modalData.tempId)
    : null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold tracking-tight text-gray-800">
        Generated Variants ({combinations.length})
      </h3>
      <p className="text-sm text-gray-500">
        Set price and upload images for each variant.
      </p>
      <hr />

      {combinations.map((comb, idx) => {
        const meta = variantMetas.find((m) => m.variantIndex === idx);
        const images =
          variantStates.find((v) => v.variantIndex === idx)?.images || [];

        return (
          <div key={idx} className="border p-6 rounded-xl bg-gray-50 space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-semibold text-lg">
                <span className="text-gray-500 mr-2">#{idx + 1}</span>
                <span className="text-indigo-600">
                  {comb.label.split("|").join(" • ")}
                </span>
              </h4>
            </div>

            {/* 🟢 UPDATE DISINI: Mengubah dari grid Kiri-Kanan menjadi Atas-Bawah (flex-col) */}
            <div className="flex flex-col gap-6 items-start">
              {/* BAGIAN ATAS: Informasi (Price, Dimensi, & Deskripsi) - Full Width */}
              <div className="w-full bg-white p-4 rounded-lg border shadow-sm space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase">
                    Variant Price (Rp)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={meta?.price ?? 0}
                    onChange={(e) =>
                      onUpdateVariantMeta(idx, "price", e.target.valueAsNumber)
                    }
                    className="font-mono font-medium text-lg md:w-1/3" // Diberi batas lebar sedikit agar tidak terlalu panjang
                    placeholder="0"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Overrides Base Price.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Label className="text-xs font-bold text-gray-500 uppercase">
                    Dimensi & Berat
                  </Label>
                  {/* Grid ini akan 2 kolom di HP, dan 4 kolom berjajar di layar besar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">
                        Berat (gram)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={meta?.weight ?? ""}
                        onChange={(e) =>
                          onUpdateVariantMeta(
                            idx,
                            "weight",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        className="h-9 text-sm bg-gray-50"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">
                        Panjang (cm)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={meta?.length ?? ""}
                        onChange={(e) =>
                          onUpdateVariantMeta(
                            idx,
                            "length",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        className="h-9 text-sm bg-gray-50"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">
                        Lebar (cm)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={meta?.width ?? ""}
                        onChange={(e) =>
                          onUpdateVariantMeta(
                            idx,
                            "width",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        className="h-9 text-sm bg-gray-50"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">
                        Tinggi (cm)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={meta?.height ?? ""}
                        onChange={(e) =>
                          onUpdateVariantMeta(
                            idx,
                            "height",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        className="h-9 text-sm bg-gray-50"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase">
                    Description (Optional)
                  </Label>
                  <Textarea
                    placeholder="Tulis deskripsi spesifik untuk varian ini..."
                    value={meta?.description ?? ""}
                    onChange={(e) =>
                      onUpdateVariantMeta(idx, "description", e.target.value)
                    }
                    className="resize-y min-h-20 text-sm bg-gray-50 focus-visible:bg-white transition-colors placeholder:text-gray-400 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
                  />
                </div>
              </div>

              {/* BAGIAN BAWAH: Images - Full Width */}
              <div className="w-full space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  className="space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Upload Images</span>
                </Button>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={(el) => {
                    fileInputRefs.current[idx] = el;
                  }}
                  onChange={(e) => {
                    handleAddFiles(idx, e.target.files);
                    e.target.value = "";
                  }}
                />

                {/* Grid gambar di-adjust sedikit agar lebih banyak yang bisa tampil jika layarnya lebar */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {images.length === 0 && (
                    <div className="col-span-full py-4 text-center text-sm text-gray-400 italic border-2 border-dashed rounded-lg bg-white/50">
                      No images yet
                    </div>
                  )}
                  {images.map((img) => (
                    <div
                      key={img.tempId}
                      onClick={() =>
                        setModalData({ variantIdx: idx, tempId: img.tempId })
                      }
                      className="group relative aspect-square border rounded-lg overflow-hidden cursor-pointer bg-white hover:ring-2 hover:ring-indigo-500 transition-all">
                      <img
                        src={img.url}
                        alt="Variant"
                        className="w-full h-full object-cover"
                      />
                      {img.isFeatured && (
                        <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center z-10 shadow-sm">
                          <Star className="w-3 h-3 mr-1 fill-white" /> Main
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx, img.tempId);
                            }}
                            className="bg-white/90 hover:bg-red-500 hover:text-white p-1.5 rounded-full shadow-sm transition-colors"
                            title="Delete Image">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/50 text-white mb-1">
                            <Pencil className="w-5 h-5" />
                          </div>
                          <span className="text-white text-[10px] font-medium tracking-wide bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            Edit Info
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {modalData && activeImage && (
        <ImageDetailModal
          image={activeImage}
          onClose={() => setModalData(null)}
          onSave={(updates) =>
            handleUpdateImageMeta(
              modalData.variantIdx,
              modalData.tempId,
              updates,
            )
          }
          onSetFeatured={(checked) =>
            checked && handleSetFeatured(modalData.variantIdx, modalData.tempId)
          }
        />
      )}
    </div>
  );
}
