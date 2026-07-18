"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { AttributeSelector, SelectedAttributeRow } from "../AttributeSelector";
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
import { Layers, Loader2, X, Plus, ChevronDown, Trash2 } from "lucide-react";
import { MockupAreaSelector } from "../MockupAreaSelector";

export default function FormUpdateAttributes({
  initialData,
  isSubmitting,
  onSubmit,
  onAttributesChange,
  onUpdateMediaMockups,
  onUpdateMockupSettings,
  onUpdateMediaMetadata,
  onAddImage,
}: {
  initialData: any;
  isSubmitting: boolean;
  onSubmit: (payload: any) => Promise<void>;
  onAttributesChange: (
    selections: SelectedAttributeRow[],
    fullList: any[]
  ) => void;
  onUpdateMediaMockups?: (mediaId: string, mockups: any[]) => Promise<void>;
  onUpdateMockupSettings?: (settings: {
    isMultiFace: boolean;
    mockupFrontImageId: string | null;
    mockupBackImageId: string | null;
  }) => Promise<void>;
  onUpdateMediaMetadata?: (mediaId: string, updates: any) => Promise<void>;
  onAddImage?: (file: File) => Promise<any>;
}) {
  const [attributeSelections, setAttributeSelections] = useState<
    SelectedAttributeRow[]
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
  const [isUploading, setIsUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);

  if (initialData?.id && initialData.id !== prevProductId) {
    setPrevProductId(initialData.id);
    setIsInitialized(false);
  }

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

  const handleAddMockupSide = () => {
    setMockupSides((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        name: "",
        imageId: "",
        mockupAreas: [],
        attributeValueId: null,
        printPositionValueId: null,
        url: "",
      },
    ]);
  };

  const handleRemoveMockupSide = async (id: string, imageId: string | null) => {
    try {
      if (imageId && onUpdateMediaMetadata) {
        await onUpdateMediaMetadata(imageId, {
          mockupSideName: null,
          attributeValueId: null,
          printSideValueId: null,
          printPositionValueId: null,
        });
      }
    } catch (err) {
      console.error("Failed to unlink image metadata on delete", err);
    }
    setMockupSides((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    if (initialData?.images && !isInitialized) {
      const initialMockupSides = initialData.images
        .filter((img: any) => img.mockupSideName || img.attributeValueId || img.printSideValueId || img.printPositionValueId || (img.mockupAreas && img.mockupAreas.length > 0))
        .map((img: any) => ({
          id: img.id,
          name: img.mockupSideName || "",
          imageId: img.id,
          mockupAreas: img.mockupAreas || [],
          attributeValueId: img.attributeValueId || null,
          printSideValueId: img.printSideValueId || null,
          printPositionValueId: img.printPositionValueId || null,
          url: img.url,
        }));
      setMockupSides(initialMockupSides);
      setIsInitialized(true);
    }
  }, [initialData?.images, isInitialized]);

  // Prefill dari initialData.attributeValues
  useEffect(() => {
    if (!initialData || !initialData.attributeValues) return;

    const grouped: Record<string, string[]> = {};
    const modifiers: Record<string, number> = {};
    const weights: Record<string, number> = {};
    const widths: Record<string, number> = {};
    const heights: Record<string, number> = {};
    const lengths: Record<string, number> = {};

    initialData.attributeValues.forEach((item: any) => {
      const attrId = item.attributeValue?.attribute?.id || item.attributeId;
      const valId = item.attributeValue?.id || item.attributeValueId;

      if (!attrId || !valId) return; // skip data rusak

      if (!grouped[attrId]) grouped[attrId] = [];
      grouped[attrId].push(valId);
      modifiers[valId] = item.priceModifier || 0;
      weights[valId] = item.weight || 0;
      widths[valId] = item.width || 0;
      heights[valId] = item.height || 0;
      lengths[valId] = item.length || 0;
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
      const rowWeights: Record<string, number> = {};
      const rowWidths: Record<string, number> = {};
      const rowHeights: Record<string, number> = {};
      const rowLengths: Record<string, number> = {};

      valueIds.forEach((id) => {
        rowModifiers[id] = modifiers[id] || 0;
        rowWeights[id] = weights[id] || 0;
        rowWidths[id] = widths[id] || 0;
        rowHeights[id] = heights[id] || 0;
        rowLengths[id] = lengths[id] || 0;
      });

      const existingSelection = attributeSelections.find((sel) => sel.attributeId === attributeId);
      const isVariantGenerator = existingSelection && existingSelection.isVariantGenerator !== undefined
        ? existingSelection.isVariantGenerator
        : initialData.productVariants?.length > 0
          ? (variantGeneratingAttrIds.size > 0 ? variantGeneratingAttrIds.has(attributeId) : true)
          : true;

      return {
        attributeId,
        valueIds,
        priceModifiers: rowModifiers,
        weights: rowWeights,
        widths: rowWidths,
        heights: rowHeights,
        lengths: rowLengths,
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
      const allWeights: Record<string, number> = {};
      const allWidths: Record<string, number> = {};
      const allHeights: Record<string, number> = {};
      const allLengths: Record<string, number> = {};

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
        if (attr.weights) {
          Object.entries(attr.weights).forEach(([valId, w]) => {
            allWeights[valId] = Number(w);
          });
        }
        if (attr.widths) {
          Object.entries(attr.widths).forEach(([valId, w]) => {
            allWidths[valId] = Number(w);
          });
        }
        if (attr.heights) {
          Object.entries(attr.heights).forEach(([valId, h]) => {
            allHeights[valId] = Number(h);
          });
        }
        if (attr.lengths) {
          Object.entries(attr.lengths).forEach(([valId, l]) => {
            allLengths[valId] = Number(l);
          });
        }
      });

      const payload = {
        attributeValueIds: allAttributeValueIds,
        priceModifiers: allModifiers,
        weights: allWeights,
        widths: allWidths,
        heights: allHeights,
        lengths: allLengths,
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

  const handleClearSlot = async (id: string) => {
    const item = mockupSides.find((m) => m.id === id);
    if (!item) return;
    if (item.imageId && !item.id.startsWith("slot-")) {
      try {
        if (onUpdateMediaMockups) {
          await onUpdateMediaMockups(item.imageId, []);
        }
        if (onUpdateMediaMetadata) {
          await onUpdateMediaMetadata(item.imageId, {
            mockupSideName: null,
            attributeValueId: null,
            printSideValueId: null,
            printPositionValueId: null,
          });
        }
      } catch (err) {
        toast.error("Gagal mereset slot di server");
        return;
      }
    }
    setMockupSides((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              imageId: "",
              url: "",
              mockupAreas: [],
            }
          : m
      )
    );
    toast.success("Slot berhasil dikosongkan");
  };

  const [copiedMockupAreas, setCopiedMockupAreas] = useState<any[] | null>(null);

  const handleCopyMockupConfig = (areas: any[]) => {
    setCopiedMockupAreas(areas);
    toast.success("Konfigurasi area mockup berhasil disalin!");
  };

  const handlePasteMockupConfig = async (id: string) => {
    if (!copiedMockupAreas) return;
    const targetItem = mockupSides.find((m) => m.id === id);
    if (!targetItem || !targetItem.imageId) {
      toast.error("Pilih gambar terlebih dahulu sebelum menempel area mockup");
      return;
    }

    const pastedAreas = copiedMockupAreas.map((area) => ({
      ...area,
      id: `area-${Date.now()}-${Math.random()}`,
    }));

    try {
      if (onUpdateMediaMockups) {
        await onUpdateMediaMockups(targetItem.imageId, pastedAreas);
        setMockupSides((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, mockupAreas: pastedAreas } : item
          )
        );
        toast.success("Konfigurasi area mockup berhasil ditempel!");
      }
    } catch (err) {
      toast.error("Gagal menempel konfigurasi area mockup");
    }
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

  const handleImageSelect = async (id: string, newImageId: string) => {
    const prevItem = mockupSides.find((m) => m.id === id);
    if (!prevItem) return;
    const oldImageId = prevItem.imageId;
    
    if (newImageId === oldImageId) return;
    
    const selectedImg = initialData?.images?.find((img: any) => img.id === newImageId);
    if (!selectedImg) return;
    
    setMockupSides((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              id: newImageId,
              imageId: newImageId,
              url: selectedImg.url,
            }
          : item
      )
    );
    
    try {
      if (onUpdateMediaMetadata) {
        await onUpdateMediaMetadata(newImageId, { 
          mockupSideName: prevItem.name || null,
          attributeValueId: prevItem.attributeValueId || null,
          printSideValueId: prevItem.printSideValueId || null,
          printPositionValueId: prevItem.printPositionValueId || null
        });
      }
      if (prevItem.mockupAreas && prevItem.mockupAreas.length > 0 && onUpdateMediaMockups) {
        await onUpdateMediaMockups(newImageId, prevItem.mockupAreas);
      }
      
      if (oldImageId && !oldImageId.startsWith("temp-")) {
        if (onUpdateMediaMetadata) {
          await onUpdateMediaMetadata(oldImageId, { mockupSideName: null, attributeValueId: null, printSideValueId: null, printPositionValueId: null });
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
                Unggah gambar mockup dan atur area cetak untuk masing-masing slot sisi print di bawah ini.
              </p>
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
                          <p className="leading-relaxed">Produk ini memiliki atribut ukuran/kapasitas. Silakan unggah gambar mockup terpisah untuk masing-masing ukuran di tab Media, lalu tautkan gambar tersebut ke slot ukurannya di bawah ini.</p>
                        </div>
                      </div>
                    )}
                                        {mockupSides.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg border-stone-300 dark:border-stone-750">
                        <p className="text-sm text-stone-500 italic">Belum ada mockup yang ditambahkan. Silakan klik tombol di bawah untuk menambah mockup.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {mockupSides.map((item) => {
                          const availableImages = (initialData?.images || []).filter((img: any) => {
                            return img.id === item.imageId || !mockupSides.some((m) => m.imageId === img.id);
                          });
                          return (
                            <div key={item.id} className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-white dark:bg-stone-900/60 flex flex-col gap-3 relative shadow-xs">
                              <div className="pr-12">
                                <h4 className="text-xs font-bold text-indigo-655 dark:text-indigo-400 truncate mb-0.5">
                                  {item.name || "Posisi Mockup Baru"}
                                </h4>
                              </div>

                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                {item.imageId && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 bg-white dark:bg-stone-850 hover:bg-stone-50 border border-stone-200 dark:border-stone-700 text-stone-500 rounded-full shadow-sm flex items-center justify-center"
                                    onClick={() => handleClearSlot(item.id)}
                                    title="Kosongkan gambar"
                                  >
                                    <X className="h-3.5 w-3.5 text-stone-500" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 bg-white dark:bg-stone-850 hover:bg-red-50 hover:text-red-600 border border-stone-200 dark:border-stone-700 text-stone-500 rounded-full shadow-sm flex items-center justify-center"
                                  onClick={() => handleRemoveMockupSide(item.id, item.imageId)}
                                  title="Hapus mockup"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {item.url ? (
                                <div className="relative aspect-video w-full rounded border dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950 shrink-0">
                                  <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="relative aspect-video w-full rounded border border-dashed border-stone-300 dark:border-stone-770 overflow-hidden bg-stone-100 dark:bg-stone-950 shrink-0 flex items-center justify-center text-xs text-stone-400 font-medium italic text-center p-2">
                                  Silakan Unggah atau Pilih Gambar
                                </div>
                              )}

                              <div className="flex-1 flex flex-col justify-between gap-2.5">
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                      Pilih Gambar
                                    </Label>
                                    <div className="flex gap-1.5 items-center">
                                      <div className="flex-1">
                                        <Select
                                          value={item.imageId || "none"}
                                          onValueChange={(val) => handleImageSelect(item.id, val)}
                                          disabled={isUploading}
                                        >
                                          <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder={isUploading ? "Uploading..." : "Pilih gambar..."} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none" disabled className="text-xs">Pilih gambar...</SelectItem>
                                            {availableImages.map((img: any) => (
                                              <SelectItem key={img.id} value={img.id} className="text-xs">
                                                <span className="truncate max-w-[180px]">
                                                  {img.altText || `Gambar (${img.id.slice(0, 8)})`}
                                                </span>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <Label className="shrink-0 cursor-pointer">
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          disabled={isUploading}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file && onAddImage) {
                                              try {
                                                const uploadedImg = await onAddImage(file);
                                                if (uploadedImg && uploadedImg.id) {
                                                  setMockupSides((prev) =>
                                                    prev.map((m) =>
                                                      m.id === item.id
                                                        ? {
                                                            ...m,
                                                            imageId: uploadedImg.id,
                                                            url: uploadedImg.url || URL.createObjectURL(file),
                                                          }
                                                        : m
                                                    )
                                                  );
                                                }
                                              } catch (err) {
                                                console.error("Upload failed in card select", err);
                                              }
                                            }
                                          }}
                                        />
                                        <span className="flex items-center justify-center h-8 px-2.5 border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 rounded text-xs font-semibold text-stone-700 dark:text-stone-300">
                                          Browse
                                        </span>
                                      </Label>
                                    </div>
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
                                          prev.map((m) =>
                                            m.id === item.id ? { ...m, name: newName } : m
                                          )
                                        );
                                      }}
                                      onBlur={() => handleSaveName(item, item.name)}
                                      className="h-8 text-xs bg-white text-slate-800"
                                      disabled={!item.imageId}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                      Hubungkan Ukuran
                                    </Label>
                                    <Select
                                      value={item.attributeValueId || "none"}
                                      onValueChange={async (val) => {
                                        const targetVal = val === "none" ? null : val;
                                        setMockupSides((prev) =>
                                          prev.map((m) => m.id === item.id ? { ...m, attributeValueId: targetVal } : m)
                                        );
                                        if (item.imageId && onUpdateMediaMetadata) {
                                          try {
                                            await onUpdateMediaMetadata(item.imageId, { attributeValueId: targetVal });
                                            toast.success("Ukuran mockup berhasil disinkronkan!");
                                          } catch (err) {
                                            toast.error("Gagal menyinkronkan ukuran");
                                          }
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full h-8 text-xs">
                                        <SelectValue placeholder="Semua Ukuran" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none" className="text-xs">Semua Ukuran</SelectItem>
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
                                      Posisi Cetak (Harga Modifier)
                                    </Label>
                                    <Select
                                      value={item.printPositionValueId || "none"}
                                      disabled={!item.imageId}
                                      onValueChange={async (val) => {
                                        const targetVal = val === "none" ? null : val;
                                        const targetOpt = fullAttributeValuesList.find(o => o.id === targetVal);
                                        setMockupSides((prev) =>
                                          prev.map((m) =>
                                            m.id === item.id
                                              ? {
                                                  ...m,
                                                  printPositionValueId: targetVal,
                                                  name: targetOpt ? targetOpt.value : m.name
                                                }
                                              : m
                                          )
                                        );
                                        if (item.imageId && onUpdateMediaMetadata) {
                                          try {
                                            await onUpdateMediaMetadata(item.imageId, {
                                              printPositionValueId: targetVal,
                                              mockupSideName: targetOpt ? targetOpt.value : item.name || null
                                            });
                                            toast.success("Posisi cetak mockup berhasil disinkronkan!");
                                          } catch (err) {
                                            toast.error("Gagal menyinkronkan posisi cetak");
                                          }
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full h-8 text-[11px]">
                                        <SelectValue placeholder="Bebas" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none" className="text-xs">Bebas Posisi</SelectItem>
                                        {fullAttributeValuesList.filter(v => v.attributeType === "MOCKUP_SIDE").map((val) => (
                                          <SelectItem key={val.id} value={val.id} className="text-xs">
                                            {val.value}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="flex gap-1.5 w-full mt-2.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenMockupModal(item)}
                                    className="flex-1 text-xs font-semibold h-8 flex items-center justify-center gap-1.5"
                                    disabled={!item.imageId}
                                  >
                                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                    Atur Area
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyMockupConfig(item.mockupAreas || [])}
                                    className="text-xs font-medium h-8 px-2 flex items-center justify-center"
                                    disabled={!item.imageId || !item.mockupAreas || item.mockupAreas.length === 0}
                                    title="Salin area mockup"
                                  >
                                    Copy
                                  </Button>

                                  {copiedMockupAreas && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePasteMockupConfig(item.id)}
                                      className="text-xs font-medium h-8 px-2 flex items-center justify-center border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400"
                                      disabled={!item.imageId}
                                      title="Tempel area mockup"
                                    >
                                      Paste
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        type="button"
                        onClick={handleAddMockupSide}
                        className="text-xs font-semibold space-x-1.5 h-8 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Posisi Mockup</span>
                      </Button>
                    </div>
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
