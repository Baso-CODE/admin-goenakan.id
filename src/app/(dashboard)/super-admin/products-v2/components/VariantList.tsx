"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Layers,
  Pencil,
  Plus,
  PlusCircle,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

interface VariantListProps {
  combinations: { label: string; valueIds: string[] }[];
  variantMetas: {
    variantIndex: number;
    price: number;
    stock?: number;
    description?: string;
    isFeatured?: boolean;
    altText?: string;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
    priceTiers?: {
      minQuantity: number;
      maxQuantity: number | null;
      price: string | number;
    }[];
  }[];
  onUpdateVariantMeta: (index: number, field: string, value: any) => void;
  onChangeMeta: (filesMap: File[][]) => void;
}

// --- MODAL IMAGE ---
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
          tempId: `v${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`,
          url: URL.createObjectURL(file),
          file,
          isFeatured: v.images.length === 0 && i === 0,
          altText: "",
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

      {combinations.map((comb, idx) => {
        const meta = variantMetas.find((m) => m.variantIndex === idx);
        const images =
          variantStates.find((v) => v.variantIndex === idx)?.images || [];
        const variantTiers = meta?.priceTiers || [];

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

            <div className="flex flex-col gap-6 items-start">
              <div className="w-full bg-white p-4 rounded-lg border shadow-sm space-y-5">
                {/* BARIS HARGA & STOK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase">
                      Variant Price (Rp)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={meta?.price ?? 0}
                      onChange={(e) =>
                        onUpdateVariantMeta(
                          idx,
                          "price",
                          e.target.valueAsNumber,
                        )
                      }
                      className="font-mono font-medium text-lg"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Harga standar spesifik untuk varian ini.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-amber-600 uppercase">
                      Variant Stock
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={meta?.stock ?? 0}
                      onChange={(e) =>
                        onUpdateVariantMeta(
                          idx,
                          "stock",
                          e.target.valueAsNumber,
                        )
                      }
                      className="font-mono font-medium text-lg border-amber-200 focus-visible:ring-amber-500"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-amber-600 italic">
                      Jumlah stok untuk kombinasi atribut ini.
                    </p>
                  </div>
                </div>

                {/* ✨ PRICE TIERS UNTUK VARIAN */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <Label className="text-sm font-bold text-gray-700">
                        Harga Grosir (Wholesale)
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTiers = [
                          ...variantTiers,
                          { minQuantity: 1, maxQuantity: null, price: "" },
                        ];
                        onUpdateVariantMeta(idx, "priceTiers", newTiers);
                      }}>
                      <PlusCircle className="w-3 h-3 mr-1.5" /> Tambah Tier
                      Varian
                    </Button>
                  </div>

                  {variantTiers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 border border-dashed rounded-md bg-gray-50">
                      Belum ada harga grosir khusus varian ini.
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y overflow-hidden shadow-sm">
                      <div className="bg-muted/50 grid grid-cols-12 gap-2 p-2 px-3 text-[10px] font-bold text-gray-500 uppercase">
                        <div className="col-span-3">Min Qty</div>
                        <div className="col-span-3">Max Qty (Kosong = ∞)</div>
                        <div className="col-span-5">Harga Satuan (Rp)</div>
                        <div className="col-span-1 text-center">Aksi</div>
                      </div>
                      {variantTiers.map((tier, tierIdx) => (
                        <div
                          key={tierIdx}
                          className="grid grid-cols-12 gap-2 p-2 px-3 items-center bg-white">
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min={1}
                              value={tier.minQuantity}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 1
                                    : e.target.valueAsNumber;
                                const updated = [...variantTiers];
                                updated[tierIdx].minQuantity = val;
                                onUpdateVariantMeta(idx, "priceTiers", updated);
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min={1}
                              value={tier.maxQuantity ?? ""}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? null
                                    : e.target.valueAsNumber;
                                const updated = [...variantTiers];
                                updated[tierIdx].maxQuantity = val;
                                onUpdateVariantMeta(idx, "priceTiers", updated);
                              }}
                              placeholder="∞"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-5">
                            <Input
                              type="number"
                              value={tier.price}
                              onChange={(e) => {
                                const updated = [...variantTiers];
                                updated[tierIdx].price = e.target.value;
                                onUpdateVariantMeta(idx, "priceTiers", updated);
                              }}
                              placeholder="0"
                              className="h-8 text-sm font-mono"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = variantTiers.filter(
                                  (_, i) => i !== tierIdx,
                                );
                                onUpdateVariantMeta(idx, "priceTiers", updated);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <Label className="text-xs font-bold text-gray-500 uppercase">
                    Dimensi & Berat
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">
                        Berat (gram)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={meta?.weight ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          onUpdateVariantMeta(
                            idx,
                            "weight",
                            val ? parseFloat(val) : undefined,
                          );
                        }}
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
                        step="any"
                        value={meta?.length ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          onUpdateVariantMeta(
                            idx,
                            "length",
                            val ? parseFloat(val) : undefined,
                          );
                        }}
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
                        step="any"
                        value={meta?.width ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          onUpdateVariantMeta(
                            idx,
                            "width",
                            val ? parseFloat(val) : undefined,
                          );
                        }}
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
                        step="any"
                        value={meta?.height ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", ".");
                          onUpdateVariantMeta(
                            idx,
                            "height",
                            val ? parseFloat(val) : undefined,
                          );
                        }}
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
                    className="resize-y min-h-20 text-sm bg-gray-50 focus-visible:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* BAGIAN BAWAH: Images */}
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

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
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
                        <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center z-10">
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
                            className="bg-white/90 hover:bg-red-500 hover:text-white p-1.5 rounded-full"
                            title="Delete Image">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/50 text-white mb-1">
                            <Pencil className="w-5 h-5" />
                          </div>
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
