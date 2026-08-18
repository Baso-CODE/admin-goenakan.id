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
  onRefresh,
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
  onAddImage?: (
    fileOrUrl: File | string,
    onProgress?: (progress: number) => void,
  ) => Promise<any>;
  onRefresh?: () => Promise<void>;
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
  const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);

  if (initialData?.id && initialData.id !== prevProductId) {
    setPrevProductId(initialData.id);
    setIsInitialized(false);
  }

  const getProductAttributeValues = () => {
    const list: { id: string; value: string; rawValue: string; attributeName: string; attributeType: string }[] = [];
    
    attributesFullList.forEach((attr) => {
      const selection = attributeSelections.find((sel) => sel.attributeId === attr.id);
      if (!selection) return;
      attr.values?.forEach((val: any) => {
        if (selection.valueIds.includes(val.id)) {
          list.push({
            id: val.id,
            value: val.value.includes("|") ? val.value.split("|")[0] : val.value,
            rawValue: val.value,
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
            rawValue: item.attributeValue.value,
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
      if (imageId) {
        if (onUpdateMediaMockups) {
          await onUpdateMediaMockups(imageId, []);
        }
        if (onUpdateMediaMetadata) {
          await onUpdateMediaMetadata(imageId, {
            mockupSideName: null,
            attributeValueId: null,
            printSideValueId: null,
            printPositionValueId: null,
          });
        }
        let frontCleared = false;
        let backCleared = false;
        let nextFront = mockupFrontImageId;
        let nextBack = mockupBackImageId;
        if (mockupFrontImageId === imageId) {
          setMockupFrontImageId(null);
          nextFront = null;
          frontCleared = true;
        }
        if (mockupBackImageId === imageId) {
          setMockupBackImageId(null);
          nextBack = null;
          backCleared = true;
        }
        if ((frontCleared || backCleared) && onUpdateMockupSettings) {
          await onUpdateMockupSettings({
            isMultiFace,
            mockupFrontImageId: nextFront,
            mockupBackImageId: isMultiFace ? nextBack : null,
          });
        }
      }
      toast.success("Mockup berhasil dihapus");
    } catch (err) {
      console.error("Failed to unlink image metadata on delete", err);
      toast.error("Gagal menghapus mockup di server");
      return;
    }
    setMockupSides((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    if (initialData?.images && !isInitialized) {
      const fullAttributeValuesList = getProductAttributeValues();
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

      const sortedMockupSides = [...initialMockupSides].sort((a, b) => {
        const indexA = fullAttributeValuesList.findIndex(v => v.id === a.attributeValueId);
        const indexB = fullAttributeValuesList.findIndex(v => v.id === b.attributeValueId);
        const valA = indexA === -1 ? 9999 : indexA;
        const valB = indexB === -1 ? 9999 : indexB;
        if (valA !== valB) return valA - valB;
        return a.name.localeCompare(b.name);
      });

      setMockupSides(sortedMockupSides);
      setIsInitialized(true);
    }
  }, [initialData?.images, isInitialized]);

  useEffect(() => {
    if (isInitialized && initialData?.images) {
      const dbImageIds = new Set(initialData.images.map((img: any) => img.id));
      setMockupSides((prev) =>
        prev.filter(
          (m) =>
            !m.imageId ||
            m.imageId.startsWith("new-") ||
            m.imageId.startsWith("slot-") ||
            m.imageId.startsWith("size-default-") ||
            dbImageIds.has(m.imageId)
        )
      );
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

  const handleSaveMockupAreas = () => {
    if (!selectedMockupImage) return;

    // Validate that physical size is input for each area
    for (const area of mockupAreasState) {
      if (!area.physicalWidth || area.physicalWidth <= 0 || !area.physicalHeight || area.physicalHeight <= 0) {
        toast.error(`Silakan isi ukuran fisik lebar & tinggi area cetak untuk "${area.label || "Mockup Zone"}"`);
        return;
      }
    }
    
    // Update local state to match
    setMockupSides((prev) =>
      prev.map((item) =>
        item.id === selectedMockupImage.id
          ? { ...item, mockupAreas: mockupAreasState }
          : item
      )
    );
    
    setIsMockupModalOpen(false);
    setSelectedMockupImage(null);
    toast.success("Area mockup berhasil diupdate");
  };

  const handleClearSlot = (id: string) => {
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

  const handlePasteMockupConfig = (id: string) => {
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

    setMockupSides((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, mockupAreas: pastedAreas } : item
      )
    );
    toast.success("Konfigurasi area mockup berhasil ditempel!");
  };

  const handleImageSelect = (id: string, newImageId: string) => {
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
              imageId: newImageId,
              url: selectedImg.url,
              mockupAreas: selectedImg.mockupAreas || item.mockupAreas || [],
            }
          : item
      )
    );
    toast.success("Gambar mockup berhasil diubah!");
  };

  const [isSavingMockups, setIsSavingMockups] = useState(false);

  const handleSaveMockups = async () => {
    // Validation
    const fullAttributeValuesList = getProductAttributeValues();
    for (const side of mockupSides) {
      const sizeOpt = fullAttributeValuesList.find(o => o.id === side.attributeValueId);
      const sizeName = sizeOpt ? sizeOpt.value : "";
      const printPositionName = side.name || "Posisi Mockup";
      const fullName = sizeName ? `${sizeName} - ${printPositionName}` : printPositionName;

      if (!side.imageId && !side.url) {
        toast.error(`Silakan pilih atau hubungkan gambar mockup untuk "${fullName}"`);
        return;
      }
      if (!side.attributeValueId) {
        toast.error(`Silakan hubungkan ukuran/kapasitas untuk "${fullName}"`);
        return;
      }
      if (!side.printPositionValueId) {
        toast.error(`Silakan pilih posisi cetak untuk "${fullName}"`);
        return;
      }
      if (!side.mockupAreas || side.mockupAreas.length === 0) {
        toast.error(`Silakan atur area mockup (klik tombol "Atur Area") untuk "${fullName}"`);
        return;
      }
    }

    setIsSavingMockups(true);
    try {
      // 1. Identify which images need to be unlinked/cleared.
      const activeImageIds = new Set(mockupSides.map((m) => m.imageId).filter(Boolean));
      const imagesToUnlink = (initialData?.images || []).filter(
        (img: any) =>
          (img.mockupSideName || img.attributeValueId || img.printSideValueId || img.printPositionValueId || (img.mockupAreas && img.mockupAreas.length > 0)) &&
          !activeImageIds.has(img.id)
      );

      // 2. Perform unlinking for cleared/deleted mockups
      for (const img of imagesToUnlink) {
        if (onUpdateMediaMockups) {
          await onUpdateMediaMockups(img.id, []);
        }
        if (onUpdateMediaMetadata) {
          await onUpdateMediaMetadata(img.id, {
            mockupSideName: null,
            attributeValueId: null,
            printSideValueId: null,
            printPositionValueId: null,
          });
        }
      }

      // 3. Save updates for active mockup sides
      for (const side of mockupSides) {
        let currentImageId = side.imageId;
        const isNewImagePlaceholder = currentImageId && currentImageId.startsWith("size-default-");
        
        // If imageId is a size-default URL placeholder, register it first
        if (isNewImagePlaceholder && onAddImage) {
          try {
            const uploadedImg = await onAddImage(side.url);
            if (uploadedImg && uploadedImg.id) {
              currentImageId = uploadedImg.id;
            }
          } catch (err) {
            console.error("Failed to register size default image during save", err);
            toast.error(`Gagal mendaftarkan gambar default untuk ukuran ${side.name}`);
            continue;
          }
        }

        if (!currentImageId) continue;
        
        // Check if this side has changed compared to its initial state in initialData.images
        const initialImg = initialData?.images?.find((img: any) => img.id === currentImageId);

        if (initialImg) {
          const hasMetadataChanged = 
            (side.name || null) !== (initialImg.mockupSideName || null) ||
            (side.attributeValueId || null) !== (initialImg.attributeValueId || null) ||
            (side.printPositionValueId || null) !== (initialImg.printPositionValueId || null);

          const initialAreas = initialImg.mockupAreas || [];
          const currentAreas = side.mockupAreas || [];
          const hasAreasChanged = JSON.stringify(initialAreas) !== JSON.stringify(currentAreas);

          if (!hasMetadataChanged && !hasAreasChanged) {
            // Nothing changed for this existing side, skip saving
            continue;
          }

          // Save metadata only if changed
          if (hasMetadataChanged && onUpdateMediaMetadata) {
            await onUpdateMediaMetadata(currentImageId, {
              mockupSideName: side.name || null,
              attributeValueId: side.attributeValueId || null,
              printSideValueId: side.printSideValueId || null,
              printPositionValueId: side.printPositionValueId || null,
            });
          }

          // Save mockup areas only if changed
          if (hasAreasChanged && onUpdateMediaMockups) {
            await onUpdateMediaMockups(currentImageId, currentAreas);
          }
        } else {
          // This is a newly registered image/side (not in initialData.images yet), save everything
          if (onUpdateMediaMetadata) {
            await onUpdateMediaMetadata(currentImageId, {
              mockupSideName: side.name || null,
              attributeValueId: side.attributeValueId || null,
              printSideValueId: side.printSideValueId || null,
              printPositionValueId: side.printPositionValueId || null,
            });
          }
          
          if (onUpdateMediaMockups) {
            await onUpdateMediaMockups(currentImageId, side.mockupAreas || []);
          }
        }
      }

      toast.success("Pengaturan mockup berhasil disimpan!");
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Gagal menyimpan pengaturan mockup:", err);
      toast.error("Gagal menyimpan pengaturan mockup");
    } finally {
      setIsSavingMockups(false);
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
                                  {(() => {
                                    const sizeOpt = fullAttributeValuesList.find(o => o.id === item.attributeValueId);
                                    const sizeName = sizeOpt ? sizeOpt.value : "";
                                    const printPositionName = item.name || "Posisi Mockup Baru";
                                    return sizeName ? `${sizeName} - ${printPositionName}` : printPositionName;
                                  })()}
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
                                          disabled={isUploading || uploadProgressMap[item.id] !== undefined}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file && onAddImage) {
                                              setIsUploading(true);
                                              setUploadProgressMap((prev) => ({ ...prev, [item.id]: 0 }));
                                              try {
                                                const uploadedImg = await onAddImage(file, (progress: number) => {
                                                  setUploadProgressMap((prev) => ({
                                                    ...prev,
                                                    [item.id]: Math.round(progress),
                                                  }));
                                                });
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
                                              } finally {
                                                setIsUploading(false);
                                                setUploadProgressMap((prev) => {
                                                  const copy = { ...prev };
                                                  delete copy[item.id];
                                                  return copy;
                                                });
                                              }
                                            }
                                          }}
                                        />
                                        <span className="flex items-center justify-center h-8 px-2.5 border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 rounded text-xs font-semibold text-stone-700 dark:text-stone-300 gap-1.5 min-w-16">
                                          {uploadProgressMap[item.id] !== undefined ? (
                                            <>
                                              <Loader2 className="h-3 w-3 animate-spin text-stone-500" />
                                              <span>{uploadProgressMap[item.id]}%</span>
                                            </>
                                          ) : (
                                            "Browse"
                                          )}
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
                                      className="h-8 text-xs bg-white text-slate-800"
                                      disabled={!item.imageId}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                      Hubungkan Ukuran / Model
                                    </Label>
                                    <Select
                                       value={item.attributeValueId || "none"}
                                       onValueChange={(val) => {
                                         const targetVal = val === "none" ? null : val;
                                         setMockupSides((prev) =>
                                            prev.map((m) =>
                                              m.id === item.id
                                                ? {
                                                    ...m,
                                                    attributeValueId: targetVal,
                                                  }
                                                : m
                                            )
                                          );
                                       }}
                                     >
                                       <SelectTrigger className="w-full h-8 text-xs">
                                         <SelectValue placeholder="Semua Ukuran / Model" />
                                       </SelectTrigger>
                                       <SelectContent>
                                         <SelectItem value="none" className="text-xs">Semua Ukuran / Model</SelectItem>
                                         {fullAttributeValuesList.filter(v => v.attributeType === "SIZE" || v.attributeType === "MODEL_SHAPE").map((val) => (
                                           <SelectItem key={val.id} value={val.id} className="text-xs">
                                             {val.attributeName}: {val.value}
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
                                      onValueChange={(val) => {
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

                    <div className="flex justify-between items-center pt-4 border-t border-stone-105 dark:border-stone-805">
                      <Button
                        type="button"
                        onClick={handleSaveMockups}
                        disabled={isSavingMockups}
                        className="text-xs font-semibold h-8 bg-primary hover:bg-primary/90 text-white shadow-xs"
                      >
                        {isSavingMockups ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>Simpan Area Custom & Hubungan Gambar</span>
                        )}
                      </Button>

                      <Button
                        type="button"
                        onClick={handleAddMockupSide}
                        className="text-xs font-semibold space-x-1.5 h-8 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-750 shadow-xs"
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
                className="bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-1.5 shadow-sm"
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
