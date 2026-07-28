import { MaterialTypeFormValues } from "@/app/(dashboard)/super-admin/product-materials/components/materialTypeForm";
import {
  cartesianProduct,
  Category,
  ProductFormValues,
  productSchema,
} from "@/app/(dashboard)/super-admin/products-v2/components/product.schema";
import { useApi } from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { parseColorValue } from "@/utils/colorConverter";

export function useProductFormV2(
  onSubmitProps: (data: ProductFormValues, files: any) => Promise<void>,
) {
  const { fetchApi, status } = useApi();

  // === DATA STATES ===
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);
  const [itemNames, setItemNames] = useState<any[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [tagCategories, setTagCategories] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<
    { id: string; name: string; code?: string }[]
  >([]);

  // === MODAL STATES ===
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemCategoryModalOpen, setIsItemCategoryModalOpen] = useState(false);
  const [isItemNameModalOpen, setIsItemNameModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // === UI STATES ===
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [isSubmittingTags, setIsSubmittingTags] = useState(false);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);

  // === VARIANT STATES ===
  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[]; priceModifiers?: Record<string, number>; isVariantGenerator?: boolean }[]
  >([]);
  const [combinations, setCombinations] = useState<
    { label: string; valueIds: string[] }[]
  >([]);
  const [attributesList, setAttributesList] = useState<any[]>([]);
  const [variantMetas, setVariantMetas] = useState<any[]>([]);
  const [variantFilesMap, setVariantFilesMap] = useState<File[][]>([]);
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [isGenModalOpen, setIsGenModalOpen] = useState<boolean>(false);
  const [activeGroupFilters, setActiveGroupFilters] = useState<Record<string, Record<string, string[]>>>({});

  // === FORM INITIALIZATION ===
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      itemCategoryId: "",
      itemNameId: "",
      tagIds: [],
      description: "",
      basePrice: 0,
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      isCustom: false,
      isMadeByOrder: false,
      materialTypeId: "",
      stock: 0,
      attributes: [],
      priceTiers: [],
      imagesMetadata: [],
      videosMetadata: [],
      variantImagesMetadata: [],
      mockupAreaX: null,
      mockupAreaY: null,
      mockupAreaWidth: null,
      mockupAreaHeight: null,
      mockupSides: [],
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedItemCategoryId = form.watch("itemCategoryId");
  const isCustomProduct = form.watch("isCustom");
  const basePrice = form.watch("basePrice");

  // === EFFECTS (Data Fetching) ===
  useEffect(() => {
    const fetchMasterData = async () => {
      if (status === "loading" || status === "unauthenticated") return;
      try {
        const [catRes, tagRes, matRes, tagCatRes] = await Promise.all([
          fetchApi("/product-categories/list"),
          fetchApi("/product-tags/list"),
          fetchApi("/material-types/list"),
          fetchApi("/product-tags/categories"),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
        if (matRes.ok) setMaterialTypes(await matRes.json());
        if (tagCatRes.ok) {
          const tagCatsData = await tagCatRes.json();
          setTagCategories(Array.isArray(tagCatsData) ? tagCatsData : []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load master data.");
      }
    };
    fetchMasterData();
  }, [status, fetchApi]);

  useEffect(() => {
    const fetchItemCategories = async () => {
      if (!selectedCategoryId) return setItemCategories([]);
      try {
        const res = await fetchApi(
          `/item-categories?productCategoryId=${selectedCategoryId}&take=100`,
        );
        const result = await res.json();
        setItemCategories(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil Item Categories:", error);
      }
    };
    fetchItemCategories();
  }, [selectedCategoryId, fetchApi]);

  useEffect(() => {
    const fetchItemNames = async () => {
      try {
        const res = await fetchApi(
          "/item-names?take=500",
        );
        const result = await res.json();
        setItemNames(result.data || []);
      } catch (error) {
        console.error("Gagal mengambil Item Names:", error);
      }
    };
    fetchItemNames();
  }, [fetchApi]);

  useEffect(() => {
    if (!isCustomProduct) {
      setAttributeSelections([]);
      setCombinations([]);
      setVariantMetas([]);
      setVariantFilesMap([]);
      form.setValue("attributes", []);
      form.setValue("variantImagesMetadata", []);
    } else {
      form.setValue("stock", 0);
    }
  }, [isCustomProduct, form]);

  useEffect(() => {
    if (!variantMetas.length || !combinations.length) return;
    const currentBasePrice = Number(basePrice) || 0;
    let isChanged = false;

    const updated = variantMetas.map((m) => {
      const comb = combinations[m.variantIndex];
      if (!comb || m.isPriceOverridden) return m;

      let modifierSum = 0;
      attributeSelections.forEach((selection) => {
        if (selection.isVariantGenerator !== false) {
          selection.valueIds.forEach((valId) => {
            if (comb.valueIds.includes(valId)) {
              const modVal = selection.priceModifiers?.[valId];
              if (modVal !== undefined) {
                modifierSum += Number(modVal) || 0;
              }
            }
          });
        }
      });

      const newPrice = currentBasePrice + modifierSum;
      if (m.price !== newPrice) {
        isChanged = true;
        return { ...m, price: newPrice };
      }
      return m;
    });

    if (isChanged) {
      setVariantMetas(updated);
      form.setValue("variantImagesMetadata", updated);
    }
  }, [basePrice, attributeSelections, combinations, variantMetas, form]);

  // === HANDLERS ===
  const handleBulkCreateTags = async () => {
    if (!bulkTagInput.trim() || status !== "authenticated") return;
    const tagNames = bulkTagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tagNames.length === 0) return;

    try {
      setIsSubmittingTags(true);
      const res = await fetchApi("/product-tags/bulk", {
        method: "POST",
        body: JSON.stringify({ names: tagNames }),
      });
      if (!res.ok) throw new Error("Gagal membuat tags");

      const returnedTags = await res.json();
      setTags((prev) => {
        const newTagList = [...prev];
        returnedTags.forEach((rt: any) => {
          if (!newTagList.find((t) => t.id === rt.id)) newTagList.push(rt);
        });
        return newTagList;
      });

      const currentSelected = form.getValues("tagIds") || [];
      const returnedIds = returnedTags.map((rt: any) => rt.id);
      form.setValue(
        "tagIds",
        Array.from(new Set([...currentSelected, ...returnedIds])),
      );

      toast.success("Tags berhasil ditambahkan!");
      setIsTagModalOpen(false);
      setBulkTagInput("");
    } catch (error) {
      toast.error("Gagal menambahkan tags.");
    } finally {
      setIsSubmittingTags(false);
    }
  };

  const handleAddMaterialSubmit = async (values: MaterialTypeFormValues) => {
    if (status !== "authenticated") return;
    try {
      setIsSubmittingMaterial(true);
      const res = await fetchApi("/material-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create material");

      const newMaterial = await res.json();
      setMaterialTypes((prev) => [...prev, newMaterial]);
      form.setValue("materialTypeId", newMaterial.id);

      toast.success("Material berhasil ditambahkan!");
      setIsMaterialModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat material");
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  const handleGenerateSku = async () => {
    const values = form.getValues();
    if (!values.name || values.name.length < 3)
      return toast.error("Isi Nama Produk minimal 3 karakter.");
    if (
      !values.categoryId ||
      !values.itemCategoryId ||
      !values.itemNameId ||
      !values.materialTypeId
    ) {
      return toast.error(
        "Kategori, Item Category, Item Name, dan Material wajib dipilih!",
      );
    }
    if (status !== "authenticated") return;

    try {
      setIsGeneratingSku(true);
      const res = await fetchApi("/products/generate-sku", {
        method: "POST",
        body: JSON.stringify({
          productName: values.name,
          categoryId: values.categoryId,
          itemCategoryId: values.itemCategoryId,
          itemNameId: values.itemNameId,
          materialTypeId: values.materialTypeId,
        }),
      });
      if (!res.ok) throw new Error("Gagal generate SKU");
      const data = await res.json();
      form.setValue("sku", data.sku);
      toast.success(`SKU Generated: ${data.sku}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGeneratingSku(false);
    }
  };

  const handleGenerateVariants = () => {
    if (!attributeSelections.length)
      return toast.error("Tambahkan minimal 1 attribute.");

    const variantGeneratingSelections = attributeSelections.filter(
      (a) => a.isVariantGenerator !== false
    );

    if (!variantGeneratingSelections.length) {
      return setCombinations([]);
    }

    const primarySelection = variantGeneratingSelections[0];
    if (!primarySelection.valueIds.length) {
      return toast.error(`Harap isi nilai untuk atribut utama: ${attributesList.find(a => a.id === primarySelection.attributeId)?.name || ""}`);
    }

    const initialFilters: Record<string, Record<string, string[]>> = {};
    primarySelection.valueIds.forEach((primValId) => {
      initialFilters[primValId] = {};
      variantGeneratingSelections.slice(1).forEach((sel) => {
        initialFilters[primValId][sel.attributeId] = [...sel.valueIds];
      });
    });

    setActiveGroupFilters(initialFilters);
    setIsGenModalOpen(true);
  };

  const handleConfirmVariantGeneration = () => {
    const variantGeneratingSelections = attributeSelections.filter(
      (a) => a.isVariantGenerator !== false
    );
    const primarySelection = variantGeneratingSelections[0];
    const otherSelections = variantGeneratingSelections.slice(1);

    const cartesianProduct = (a: any[]): any[] => {
      return a.reduce((co, b) => co.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    };

    const finalCombos: { valueIds: string[]; label: string }[] = [];

    primarySelection.valueIds.forEach((primValId) => {
      const activeGroups = otherSelections.map((sel) => activeGroupFilters[primValId]?.[sel.attributeId] || []);
      
      let primCombos: string[][] = [];
      if (activeGroups.length === 0) {
        primCombos = [[primValId]];
      } else if (activeGroups.some((g) => g.length === 0)) {
        return; // skip if any other attribute has 0 selected values
      } else {
        const product = cartesianProduct(activeGroups);
        primCombos = product.map((p) => [primValId, ...(Array.isArray(p) ? p : [p])]);
      }

      // Filter based on parentValueId constraint
      const filteredPrimCombos = primCombos.filter((combo) => {
        for (const valueId of combo) {
          let foundAttr: any = null;
          for (const attr of attributesList) {
            const val = attr.values.find((v: any) => v.id === valueId);
            if (val) {
              foundAttr = attr;
              break;
            }
          }

          if (foundAttr && foundAttr.parentValueId) {
            if (!combo.includes(foundAttr.parentValueId)) {
              return false;
            }
          }
        }
        return true;
      });

      filteredPrimCombos.forEach((combo) => {
        const names: string[] = [];
        attributesList.forEach((attr: any) => {
          const selection = attributeSelections.find((s) => s.attributeId === attr.id);
          if (selection && selection.isVariantGenerator !== false) {
            combo.forEach((valueId) => {
              const found = attr.values.find((v: any) => v.id === valueId);
              if (found) {
                let valStr = found.value;
                if (attr.type === "COLOR") {
                  const parsed = parseColorValue(found.value);
                  valStr = parsed.name || parsed.hex;
                } else if (found.value.includes("|")) {
                  valStr = found.value.split("|")[0];
                }
                names.push(`${attr.name} - ${valStr}`);
              }
            });
          }
        });
        finalCombos.push({ valueIds: combo, label: names.join(" | ") });
      });
    });

    setCombinations(finalCombos);

    const currentBasePrice = Number(form.getValues("basePrice")) || 0;
    const newVariantMetas = finalCombos.map((comb, idx) => {
      let modifierSum = 0;
      attributeSelections.forEach((selection) => {
        if (selection.isVariantGenerator !== false) {
          selection.valueIds.forEach((valId) => {
            if (comb.valueIds.includes(valId)) {
              const modVal = selection.priceModifiers?.[valId];
              if (modVal !== undefined) {
                modifierSum += Number(modVal) || 0;
              }
            }
          });
        }
      });

      return {
        variantIndex: idx,
        price: currentBasePrice + modifierSum,
        stock: 0,
        isFeatured: false,
        altText: "",
        description: "",
        priceTiers: [],
      };
    });

    setVariantMetas(newVariantMetas);
    form.setValue("variantImagesMetadata", newVariantMetas);
    setVariantFilesMap(finalCombos.map(() => []));
    setIsGenModalOpen(false);
  };

  const handleAddAttributeValueInline = async (attributeId: string, newValueName: string, primValId: string, priceModifier?: string) => {
    const attr = attributesList.find((a) => a.id === attributeId);
    if (!attr) return toast.error("Attribute not found.");

    const formattedValues = attr.values.map((v: any) => ({
      id: v.id,
      value: v.value,
      position: v.position || 0,
    }));

    const nextPosition = formattedValues.length;
    formattedValues.push({
      value: newValueName.trim(),
      position: nextPosition,
    });

    try {
      const res = await fetchApi(`/product-attributes/${attributeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: attr.name,
          type: attr.type || "TEXT",
          values: formattedValues,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add value.");
      }

      const updatedAttr = await res.json();
      
      const nextFullList = attributesList.map((a) => (a.id === attributeId ? updatedAttr : a));
      setAttributesList(nextFullList);

      const newValueObj = updatedAttr.values.find((v: any) => v.value === newValueName.trim());
      if (newValueObj) {
        const nextSelections = attributeSelections.map((sel) => {
          if (sel.attributeId === attributeId) {
            const nextModifiers = { ...sel.priceModifiers };
            if (priceModifier && priceModifier.trim() !== "") {
              nextModifiers[newValueObj.id] = Number(priceModifier) || 0;
            }
            return {
              ...sel,
              valueIds: [...sel.valueIds, newValueObj.id],
              priceModifiers: nextModifiers,
            };
          }
          return sel;
        });
        setAttributeSelections(nextSelections);
        form.setValue("attributes", nextSelections);

        setActiveGroupFilters((prev) => {
          const nextFilters = { ...prev };
          if (nextFilters[primValId]) {
            if (!nextFilters[primValId][attributeId]) {
              nextFilters[primValId][attributeId] = [];
            }
            nextFilters[primValId][attributeId] = [...nextFilters[primValId][attributeId], newValueObj.id];
          }
          return nextFilters;
        });

        toast.success(`Berhasil menambahkan nilai "${newValueName}"`);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan nilai atribut.");
    }
  };

  const submit = async (values: ProductFormValues) => {
    try {
      const basePriceVal = Number(values.basePrice) || 0;
      const mappedPriceTiers = (values.priceTiers || []).map((tier: any) => {
        const discountVal = Number(tier.discount || 0);
        const calculatedPrice = Math.max(0, basePriceVal - discountVal);
        return {
          minQuantity: Number(tier.minQuantity || 1),
          maxQuantity: tier.maxQuantity ? Number(tier.maxQuantity) : null,
          price: String(calculatedPrice),
        };
      });

      const payload = {
        ...values,
        basePrice: basePriceVal,
        stock: isCustomProduct ? 0 : Number(values.stock || 0),
        weight: Number(values.weight || 0),
        width: Number(values.width || 0),
        height: Number(values.height || 0),
        length: Number(values.length || 0),
        attributes: isCustomProduct ? attributeSelections : undefined,
        variantImagesMetadata: isCustomProduct ? variantMetas : [],
        priceTiers: mappedPriceTiers,
      };

      const filesToSubmit = {
        images: productImagesFiles.length > 0 ? productImagesFiles : null,
        videos: null,
        variantImages: isCustomProduct ? variantFilesMap : [],
      };
      await onSubmitProps(payload, filesToSubmit);
    } catch (err) {
      toast.error("Failed to submit product form");
    }
  };

  const handleClearAllVariants = () => {
    setCombinations([]);
    setVariantMetas([]);
    setVariantFilesMap([]);
    form.setValue("variantImagesMetadata", []);
  };

  const handleRemoveVariant = (idx: number) => {
    setCombinations((prev) => prev.filter((_, i) => i !== idx));
    setVariantMetas((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      const reindexed = filtered.map((meta, i) => ({
        ...meta,
        variantIndex: i,
      }));
      form.setValue("variantImagesMetadata", reindexed);
      return reindexed;
    });
    setVariantFilesMap((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddCustomVariant = () => {
    const nextIdx = combinations.length;
    const newCombo = {
      label: `Custom Variant ${nextIdx + 1}`,
      valueIds: [],
    };
    const newMeta = {
      variantIndex: nextIdx,
      price: Number(form.getValues("basePrice")) || 0,
      stock: 0,
      isFeatured: false,
      altText: "",
      description: "",
      priceTiers: [],
    };

    setCombinations((prev) => [...prev, newCombo]);
    setVariantMetas((prev) => {
      const updated = [...prev, newMeta];
      form.setValue("variantImagesMetadata", updated);
      return updated;
    });
    setVariantFilesMap((prev) => [...prev, []]);
  };

  const handleUpdateVariantLabel = (idx: number, newLabel: string) => {
    setCombinations((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, label: newLabel } : c))
    );
  };

  // Return everything needed by the UI
  return {
    form,
    submit,
    state: {
      categories,
      itemCategories,
      itemNames,
      tags,
      materialTypes,
      isCategoryModalOpen,
      isItemCategoryModalOpen,
      isItemNameModalOpen,
      isMaterialModalOpen,
      isTagModalOpen,
      isGeneratingSku,
      tagSearchOpen,
      tagSearchQuery,
      bulkTagInput,
      isSubmittingTags,
      isSubmittingMaterial,
      isCustomProduct,
      attributeSelections,
      combinations,
      variantMetas,
      selectedCategoryId,
      selectedItemCategoryId,
      productImagesFiles,
      attributesList,
      tagCategories,
      isGenModalOpen,
      activeGroupFilters,
    },
    setters: {
      setIsCategoryModalOpen,
      setIsItemCategoryModalOpen,
      setIsItemNameModalOpen,
      setIsMaterialModalOpen,
      setIsTagModalOpen,
      setTagSearchOpen,
      setTagSearchQuery,
      setBulkTagInput,
      setCategories,
      setTags,
      setItemCategories,
      setItemNames,
      setProductImagesFiles,
      setAttributeSelections,
      setAttributesList,
      setVariantMetas,
      setVariantFilesMap,
      setTagCategories,
      setIsGenModalOpen,
      setActiveGroupFilters,
    },
    handlers: {
      handleBulkCreateTags,
      handleAddMaterialSubmit,
      handleGenerateSku,
      handleGenerateVariants,
      handleUpdateVariantMeta: (idx: number, field: string, val: any) => {
        const updated = variantMetas.map((m) => {
          if (m.variantIndex === idx) {
            const isPriceEdit = field === "price";
            return {
              ...m,
              [field]: val,
              ...(isPriceEdit ? { isPriceOverridden: true } : {}),
            };
          }
          return m;
        });
        setVariantMetas(updated);
        form.setValue("variantImagesMetadata", updated);
      },
      handleAddAttributeToForm: (attrs: any, fullAttrs: any) => {
        setAttributeSelections(attrs);
        form.setValue("attributes", attrs);
        setAttributesList(fullAttrs);
      },
      handleClearAllVariants,
      handleRemoveVariant,
      handleAddCustomVariant,
      handleUpdateVariantLabel,
      handleConfirmVariantGeneration,
      handleAddAttributeValueInline,
    },
  };
}
