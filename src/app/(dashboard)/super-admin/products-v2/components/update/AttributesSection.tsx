"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AttributeSelector } from "../AttributeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Loader2, X, Plus } from "lucide-react";
import { MockupAreaSelector } from "../MockupAreaSelector";

export default function FormUpdateAttributes({
  initialData,
  isSubmitting,
  onSubmit,
  onAttributesChange,
  onUpdateMediaMockups,
  onUpdateMockupSettings,
  onUpdateMediaMetadata,
}: {
  initialData: any;
  isSubmitting: boolean;
  onSubmit: (payload: any) => Promise<void>;
  onAttributesChange: (
    selections: { attributeId: string; valueIds: string[]; priceModifiers?: Record<string, number> }[],
    fullList: any[]
  ) => void;
  onUpdateMediaMockups?: (mediaId: string, mockups: any[]) => Promise<void>;
  onUpdateMockupSettings?: (settings: {
    isMultiFace: boolean;
    mockupFrontImageId: string | null;
    mockupBackImageId: string | null;
  }) => Promise<void>;
  onUpdateMediaMetadata?: (mediaId: string, updates: any) => Promise<void>;
}) {
  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[]; priceModifiers?: Record<string, number> }[]
  >([]);

  const [attributesFullList, setAttributesFullList] = useState<any[]>([]);

  // Mockup settings state
  const [selectedMockupImage, setSelectedMockupImage] = useState<any | null>(null);
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false);
  const [mockupAreasState, setMockupAreasState] = useState<any[]>([]);

  const [isMultiFace, setIsMultiFace] = useState(false);
  const [mockupFrontImageId, setMockupFrontImageId] = useState<string | null>(null);
  const [mockupBackImageId, setMockupBackImageId] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [mockupSides, setMockupSides] = useState<any[]>([]);

  useEffect(() => {
    if (initialData?.images) {
      const existingMockups = initialData.images
        .filter((img: any) => {
          return (img.mockupAreas && img.mockupAreas.length > 0) || 
                 img.attributeValueId ||
                 img.printPositionValueId;
        })
        .map((img: any) => ({
          id: img.id,
          name: img.mockupSideName || "",
          imageId: img.id,
          mockupAreas: img.mockupAreas || [],
          attributeValueId: img.attributeValueId || null,
          printPositionValueId: img.printPositionValueId || null,
          url: img.url,
        }));
      setMockupSides(existingMockups);
    }
  }, [initialData?.id]);

  // Prefill dari initialData.attributeValues
  useEffect(() => {
    if (!initialData || !initialData.attributeValues) return;

    const grouped: Record<string, string[]> = {};
    const modifiers: Record<string, number> = {};

    initialData.attributeValues.forEach((item: any) => {
      const attrId = item.attributeValue?.attribute?.id;
      const valId = item.attributeValue?.id;

      if (!attrId || !valId) return; // skip data rusak

      if (!grouped[attrId]) grouped[attrId] = [];
      grouped[attrId].push(valId);
      modifiers[valId] = item.priceModifier || 0;
    });

    const variantGeneratingAttrIds = new Set<string>();
    initialData.productVariants?.forEach((variant: any) => {
      variant.attributeValues?.forEach((av: any) => {
        const attrId = av.attributeValue?.attributeId || av.attributeValue?.attribute?.id;
        if (attrId) {
          variantGeneratingAttrIds.add(attrId);
        }
      });
    });

    const mapped = Object.entries(grouped).map(([attributeId, valueIds]) => {
      const rowModifiers: Record<string, number> = {};
      valueIds.forEach((id) => {
        rowModifiers[id] = modifiers[id] || 0;
      });

      const isVariantGenerator = initialData.productVariants?.length > 0
        ? (variantGeneratingAttrIds.size > 0 ? variantGeneratingAttrIds.has(attributeId) : true)
        : true;

      return {
        attributeId,
        valueIds,
        priceModifiers: rowModifiers,
        isVariantGenerator,
      };
    });

    setAttributeSelections(mapped);
  }, [initialData]);

  const handleSave = async () => {
    try {
      const allAttributeValueIds = attributeSelections.flatMap(
        (attr) => attr.valueIds
      );

      const allModifiers: Record<string, number> = {};
      const orderedAttributeIds = attributeSelections
        .map((attr) => attr.attributeId)
        .filter((id) => id !== "");

      const orderedAttributeValueIds = attributesFullList.flatMap((attr) =>
        attr.values?.map((v: any) => v.id) || []
      );

      attributeSelections.forEach((attr) => {
        if (attr.priceModifiers) {
          Object.entries(attr.priceModifiers).forEach(([valId, mod]) => {
            allModifiers[valId] = Number(mod);
          });
        }
      });

      const payload = {
        attributeValueIds: allAttributeValueIds,
        priceModifiers: allModifiers,
        orderedAttributeIds,
        orderedAttributeValueIds,
      };

      await onSubmit(payload);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update attributes");
    }
  };

  const handleSaveSettings = async () => {
    if (!onUpdateMockupSettings) return;
    setIsSavingSettings(true);
    try {
      await onUpdateMockupSettings({
        isMultiFace,
        mockupFrontImageId,
        mockupBackImageId: isMultiFace ? mockupBackImageId : null,
      });
    } catch (err) {
      console.error("Gagal menyimpan pengaturan mockup:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenMockupModal = (image: any) => {
    setSelectedMockupImage(image);
    setMockupAreasState(image.mockupAreas || []);
    setIsMockupModalOpen(true);
  };

  const handleSaveMockupAreas = async () => {
    if (!selectedMockupImage || !onUpdateMediaMockups) return;
    try {
      await onUpdateMediaMockups(selectedMockupImage.id, mockupAreasState);
      
      // Update local state to match
      setMockupSides((prev) =>
        prev.map((item) =>
          item.imageId === selectedMockupImage.id
            ? { ...item, mockupAreas: mockupAreasState }
            : item
        )
      );
      
      setIsMockupModalOpen(false);
      setSelectedMockupImage(null);
    } catch (err) {
      console.error("Gagal menyimpan area mockup:", err);
    }
  };

  const handleAddMockupSide = () => {
    const tempId = `temp-${Date.now()}`;
    setMockupSides((prev) => [
      ...prev,
      {
        id: tempId,
        name: "",
        imageId: "",
        mockupAreas: [],
        attributeValueId: null,
        url: "",
      },
    ]);
  };

  const handleRemoveMockupSide = async (id: string, imageId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus sisi mockup ini?")) return;
    
    if (imageId && !id.startsWith("temp-")) {
      try {
        if (onUpdateMediaMockups) {
          await onUpdateMediaMockups(imageId, []);
        }
        if (onUpdateMediaMetadata) {
          await onUpdateMediaMetadata(imageId, { mockupSideName: null, attributeValueId: null, printPositionValueId: null });
        }
        toast.success("Sisi mockup berhasil dihapus.");
      } catch (err) {
        console.error(err);
        toast.error("Gagal menghapus sisi mockup di server.");
      }
    }
    
    setMockupSides((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveName = async (item: any, newName: string) => {
    if (!item.imageId) return;
    try {
      if (onUpdateMediaMetadata) {
        await onUpdateMediaMetadata(item.imageId, { mockupSideName: newName || null });
        toast.success("Nama posisi berhasil disimpan!");
      }
    } catch (err) {
      toast.error("Gagal menyimpan nama posisi");
    }
  };

  const handleImageSelect = async (itemIndex: number, newImageId: string) => {
    const prevItem = mockupSides[itemIndex];
    const oldImageId = prevItem.imageId;
    
    if (newImageId === oldImageId) return;
    
    const selectedImg = initialData?.images?.find((img: any) => img.id === newImageId);
    if (!selectedImg) return;
    
    const updated = [...mockupSides];
    updated[itemIndex] = {
      ...prevItem,
      id: newImageId,
      imageId: newImageId,
      url: selectedImg.url,
    };
    setMockupSides(updated);
    
    try {
      if (onUpdateMediaMetadata) {
        await onUpdateMediaMetadata(newImageId, { 
          mockupSideName: prevItem.name || null,
          attributeValueId: prevItem.attributeValueId || null,
          printPositionValueId: prevItem.printPositionValueId || null
        });
      }
      if (prevItem.mockupAreas && prevItem.mockupAreas.length > 0 && onUpdateMediaMockups) {
        await onUpdateMediaMockups(newImageId, prevItem.mockupAreas);
      }
      
      if (oldImageId && !oldImageId.startsWith("temp-")) {
        if (onUpdateMediaMetadata) {
          await onUpdateMediaMetadata(oldImageId, { mockupSideName: null, attributeValueId: null, printPositionValueId: null });
        }
        if (onUpdateMediaMockups) {
          await onUpdateMediaMockups(oldImageId, []);
        }
      }
      
      toast.success("Gambar mockup berhasil diubah!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui gambar mockup di server.");
    }
  };

  const getProductAttributeValues = () => {
    const list: { id: string; value: string; attributeName: string; attributeType: string }[] = [];
    
    attributesFullList.forEach((attr) => {
      const selection = attributeSelections.find((sel) => sel.attributeId === attr.id);
      if (!selection) return;
      attr.values?.forEach((val: any) => {
        if (selection.valueIds.includes(val.id)) {
          list.push({
            id: val.id,
            value: val.value.includes("|") ? val.value.split("|")[0] : val.value,
            attributeName: attr.name,
            attributeType: attr.type || "TEXT",
          });
        }
      });
    });

    if (list.length === 0 && initialData?.attributeValues) {
      initialData.attributeValues.forEach((item: any) => {
        if (item.attributeValue) {
          list.push({
            id: item.attributeValue.id,
            value: item.attributeValue.value.includes("|") ? item.attributeValue.value.split("|")[0] : item.attributeValue.value,
            attributeName: item.attributeValue.attribute?.name || "",
            attributeType: item.attributeValue.attribute?.type || "TEXT",
          });
        }
      });
    }

    return list;
  };

  useEffect(() => {
    onAttributesChange(attributeSelections, attributesFullList);
  }, [attributeSelections, attributesFullList]);

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 space-y-4 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <h3 className="text-lg font-semibold">Product Attributes</h3>

        <AttributeSelector
          productId={initialData?.id}
          value={attributeSelections}
          onChange={(attrs, full) => {
            setAttributeSelections(attrs);
            setAttributesFullList(full);
            onAttributesChange(attrs, full);
          }}
        />

        <Button disabled={isSubmitting} onClick={handleSave} className="bg-stone-900 hover:bg-stone-800 text-white font-semibold">
          Save Attributes
        </Button>
      </div>

      {initialData?.isCustom && (
        <Card className="border-stone-200 dark:border-stone-800 shadow-sm">
          <CardHeader className="bg-stone-50/50 dark:bg-stone-900/50 border-b pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-indigo-500" /> Area Custom & Hubungan Gambar Atribut
            </CardTitle>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Atur area mockup pada gambar dan hubungkan gambar ke nilai atribut spesifik (seperti Kapasitas / Ukuran).
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tambahkan posisi mockup dan tautkan ke gambar produk.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMockupSide}
                className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Posisi Mockup</span>
              </Button>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              {(() => {
                const fullAttributeValuesList = getProductAttributeValues();
                const hasSizeAttributes = fullAttributeValuesList.some(v => v.attributeType === "SIZE");

                return (
                  <>
                    {hasSizeAttributes && (
                      <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded-lg flex items-start gap-2.5">
                        <span className="text-amber-500 font-bold text-base mt-0.5">⚠️</span>
                        <div className="text-xs text-amber-800 dark:text-amber-300">
                          <p className="font-bold mb-0.5">Aturan Template Mockup Berdasarkan Ukuran / Kapasitas</p>
                          <p className="leading-relaxed">Produk ini memiliki atribut ukuran/kapasitas. Silakan unggah gambar mockup terpisah untuk masing-masing ukuran di tab Media, lalu tautkan gambar tersebut ke atribut ukurannya di bawah ini. Customizer pembeli akan otomatis memuat gambar mockup dan area cetak yang sesuai dengan ukuran yang dipilih.</p>
                        </div>
                      </div>
                    )}

                    {mockupSides.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg border-stone-300 dark:border-stone-750">
                        <p className="text-sm text-stone-500 italic">Belum ada posisi mockup yang ditambahkan.</p>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddMockupSide} className="mt-3">
                          <Plus className="h-4 w-4 mr-1" /> Tambah Posisi Mockup
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {mockupSides.map((item, itemIdx) => {
                          const availableImages = (initialData?.images || []).filter((img: any) => {
                            return img.id === item.imageId || !mockupSides.some((m) => m.imageId === img.id);
                          });
                          
                          return (
                            <div key={item.id} className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/20 flex flex-col gap-3 relative shadow-xs">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 bg-white dark:bg-stone-850 hover:bg-red-50 dark:hover:bg-red-950/30 border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-650 rounded-full shadow-sm flex items-center justify-center z-10"
                                onClick={() => handleRemoveMockupSide(item.id, item.imageId)}
                                title="Hapus posisi mockup"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                              
                              {item.url ? (
                                <div className="relative aspect-video w-full rounded border dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950 shrink-0">
                                  <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="relative aspect-video w-full rounded border border-dashed border-stone-300 dark:border-stone-700 overflow-hidden bg-stone-100 dark:bg-stone-950 shrink-0 flex items-center justify-center text-xs text-stone-400 font-medium italic">
                                  Pilih Gambar Terlebih Dahulu
                                </div>
                              )}
                              
                              <div className="flex-1 flex flex-col justify-between gap-2.5">
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                      Pilih Gambar dari Galeri
                                    </Label>
                                    <Select
                                      value={item.imageId || "none"}
                                      onValueChange={(val) => handleImageSelect(itemIdx, val)}
                                    >
                                      <SelectTrigger className="w-full h-8 text-xs">
                                        <SelectValue placeholder="Pilih gambar galeri..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none" disabled className="text-xs">Pilih gambar galeri...</SelectItem>
                                        {availableImages.map((img: any) => (
                                          <SelectItem key={img.id} value={img.id} className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <span className="truncate max-w-[180px]">
                                                {img.altText || `Gambar (${img.id.slice(0, 8)})`}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                      Nama Posisi / Sisi Mockup
                                    </Label>
                                    <Input
                                      placeholder="contoh: Tampak Depan, Atas Botol"
                                      value={item.name}
                                      onChange={(e) => {
                                        const newName = e.target.value;
                                        setMockupSides((prev) =>
                                          prev.map((m, idx) =>
                                            idx === itemIdx ? { ...m, name: newName } : m
                                          )
                                        );
                                      }}
                                      onBlur={(e) => handleSaveName(item, e.target.value.trim())}
                                      className="h-8 text-xs bg-white text-slate-800"
                                      disabled={!item.imageId}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1">
                                      <Label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                        Varian / Ukuran
                                      </Label>
                                      <Select
                                        value={item.attributeValueId || "none"}
                                        disabled={!item.imageId}
                                        onValueChange={async (val) => {
                                          const targetVal = val === "none" ? null : val;
                                          try {
                                            if (onUpdateMediaMetadata) {
                                              await onUpdateMediaMetadata(item.imageId, { attributeValueId: targetVal });
                                              setMockupSides((prev) =>
                                                prev.map((m, idx) =>
                                                  idx === itemIdx ? { ...m, attributeValueId: targetVal } : m
                                                )
                                              );
                                              toast.success("Gambar berhasil ditautkan ke varian!");
                                            }
                                          } catch (err) {
                                            toast.error("Gagal menautkan gambar ke varian");
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-full h-8 text-[11px]">
                                          <SelectValue placeholder="Select Variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none" className="text-xs">Select Variant</SelectItem>
                                          {fullAttributeValuesList.filter(v => v.attributeType === "SIZE").map((val) => (
                                            <SelectItem key={val.id} value={val.id} className="text-xs">
                                              {val.value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                        Posisi Cetak (Harga)
                                      </Label>
                                      <Select
                                        value={item.printPositionValueId || "none"}
                                        disabled={!item.imageId}
                                        onValueChange={async (val) => {
                                          const targetVal = val === "none" ? null : val;
                                          try {
                                            if (onUpdateMediaMetadata) {
                                              await onUpdateMediaMetadata(item.imageId, { printPositionValueId: targetVal });
                                              setMockupSides((prev) =>
                                                prev.map((m, idx) =>
                                                  idx === itemIdx ? { ...m, printPositionValueId: targetVal } : m
                                                )
                                              );
                                              toast.success("Gambar berhasil ditautkan ke posisi cetak!");
                                            }
                                          } catch (err) {
                                            toast.error("Gagal menautkan gambar ke posisi cetak");
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-full h-8 text-[11px]">
                                          <SelectValue placeholder="Bebas Sisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none" className="text-xs">Bebas Sisi</SelectItem>
                                          {fullAttributeValuesList.filter(v => v.attributeType === "MOCKUP_SIDE").map((val) => (
                                            <SelectItem key={val.id} value={val.id} className="text-xs">
                                              {val.value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenMockupModal({ id: item.imageId, mockupAreas: item.mockupAreas, url: item.url })}
                                  className="w-full text-xs font-semibold h-8 flex items-center gap-1.5"
                                  disabled={!item.imageId}
                                >
                                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                  Atur Area Mockup
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mockup area selector modal */}
      {isMockupModalOpen && selectedMockupImage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
              <div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  Konfigurasi Area Mockup
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Tentukan satu atau lebih penempatan custom mockup untuk gambar ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
                className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30 dark:bg-stone-950/20">
              <MockupAreaSelector
                imageUrl={selectedMockupImage.url}
                areas={mockupAreasState}
                onChange={(newAreas) => setMockupAreasState(newAreas)}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMockupModalOpen(false);
                  setSelectedMockupImage(null);
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveMockupAreas}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Area Mockup"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
