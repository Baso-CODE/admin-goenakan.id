"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { ArrowDown, ArrowUp, GripVertical, ListChecks, Loader2, Plus, Trash2, Pencil, Check, ChevronsUpDown, Info } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { parseColorValue } from "@/utils/colorConverter";
import { ColorValueInput } from "@/components/ui/color-value-input";





// --- TIPE DATA ---

type AttributeFromServer = {
  id: string;
  name: string;
  type?: string;
  parentValueId?: string | null;
  parentValue?: {
    id: string;
    value: string;
    attributeId: string;
  } | null;
  values: { id: string; value: string; position?: number; attributeId?: string }[];
};

export type SelectedAttributeRow = {
  attributeId: string;
  valueIds: string[];
  priceModifiers?: Record<string, number>;
  isVariantGenerator?: boolean;
  weights?: Record<string, number>;
  widths?: Record<string, number>;
  heights?: Record<string, number>;
  lengths?: Record<string, number>;
};

// --- KOMPONEN UTAMA ---

export function AttributeSelector({
  productId,
  value,
  onChange,
  onAttributeCreated,
}: {
  productId?: string;
  value?: SelectedAttributeRow[];
  onChange: (v: SelectedAttributeRow[], full: AttributeFromServer[]) => void;
  onAttributeCreated?: (attributeId: string) => void;
}) {
  const { fetchApi, status } = useApi();

  const [available, setAvailable] = useState<AttributeFromServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<SelectedAttributeRow[]>(value ?? []);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // React Hook Form for inline local attribute creation dialog
  const localForm = useForm<any>({
    defaultValues: {
      name: "",
      type: "TEXT",
      values: [{ value: "", hasSubAttributes: false }],
      allowCustomColor: false,
      allowFullSide: false,
    },
  });

  const { control } = localForm;
  const currentLocalType = localForm.watch("type");

  // Cloning states
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [allAttributes, setAllAttributes] = useState<AttributeFromServer[]>([]);
  const [selectedCloneId, setSelectedCloneId] = useState("");
  const [submittingClone, setSubmittingClone] = useState(false);
  const [cloneSelectOpen, setCloneSelectOpen] = useState(false);

  // Drag states for option choices
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedAttrId, setDraggedAttrId] = useState<string | null>(null);

  // Sync: Ambil data dari parent saat pertama kali atau saat 'value' berubah
  useEffect(() => {
    if (value) {
      // Check if value is structurally identical to local to avoid infinite loop
      const isIdentical =
        value.length === local.length &&
        value.every((valRow, idx) => {
          const locRow = local[idx];
          if (!locRow) return false;
          if (valRow.attributeId !== locRow.attributeId) return false;
          if (valRow.isVariantGenerator !== locRow.isVariantGenerator) return false;
          if (valRow.valueIds.length !== locRow.valueIds.length) return false;
          
          // Check valueIds
          const valueIdsMatch = valRow.valueIds.every((vId, vIdx) => locRow.valueIds[vIdx] === vId);
          if (!valueIdsMatch) return false;

          // Helper to check shallow object equality
          const objEquals = (a: any, b: any) => {
            if (!a && !b) return true;
            if (!a || !b) return false;
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every((k) => a[k] === b[k]);
          };

          return (
            objEquals(valRow.priceModifiers, locRow.priceModifiers) &&
            objEquals(valRow.weights, locRow.weights) &&
            objEquals(valRow.widths, locRow.widths) &&
            objEquals(valRow.heights, locRow.heights) &&
            objEquals(valRow.lengths, locRow.lengths)
          );
        });

      if (!isIdentical) {
        setLocal(value);
      }
    }
  }, [value]);

  // Sync: Beri tahu parent (FormUpdateAttributes) setiap kali 'local' atau 'available' berubah
  useEffect(() => {
    const cleanLocal = local.map((row) => {
      const attr = available.find((a) => a.id === row.attributeId);
      if (
        (attr?.type === "MOCKUP_SIDE" ||
          attr?.type === "PRINT_METHOD") &&
        row.isVariantGenerator !== false
      ) {
        return { ...row, isVariantGenerator: false };
      }
      return row;
    });

    const hasDiff = cleanLocal.some((row, idx) => {
      const orig = local[idx];
      return orig && orig.isVariantGenerator !== row.isVariantGenerator;
    });

    if (hasDiff) {
      setLocal(cleanLocal);
    } else {
      onChange(local, available);
    }
  }, [local, available]);

  // Clean up sub-attributes if their parent value is unselected
  useEffect(() => {
    const allSelectedValueIds = local.flatMap((row) => row.valueIds);
    const validRows = local.filter((row) => {
      if (!row.attributeId) return true;
      const attr = available.find((a) => a.id === row.attributeId);
      if (!attr || !attr.parentValueId) return true;
      return allSelectedValueIds.includes(attr.parentValueId);
    });

    if (validRows.length !== local.length) {
      setLocal(validRows);
    }
  }, [local, available]);

  // Load attributes from server
  const fetchAttributes = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    setLoading(true);
    try {
      const url = productId
        ? `/product-attributes/list?productId=${productId}`
        : `/product-attributes/list`;
      const res = await fetchApi(url);

      if (!res.ok) throw new Error();

      const data = await res.json();
      setAvailable(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attributes.");
    } finally {
      setLoading(false);
    }
  }, [status, fetchApi, productId]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Load all attributes for cloning when clone dialog opens
  const fetchAllAttributesForClone = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;
    try {
      const res = await fetchApi("/product-attributes/list?productId=all");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAllAttributes(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attributes to clone.");
    }
  }, [status, fetchApi]);

  useEffect(() => {
    if (isCloneOpen) {
      fetchAllAttributesForClone();
    }
  }, [isCloneOpen, fetchAllAttributesForClone]);

  // --- LOGIC HANDLERS ---

  const add = () => {
    const lastRow = local[local.length - 1];
    if (lastRow && !lastRow.attributeId) {
      toast.warning("Please select an attribute for the previous row first.");
      return;
    }
    setLocal((prev) => [...prev, { attributeId: "", valueIds: [], priceModifiers: {}, weights: {}, widths: {}, heights: {}, lengths: {} }]);
  };

  const updatePriceModifier = (index: number, valueId: string, modifier: number) => {
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          priceModifiers: {
            ...row.priceModifiers,
            [valueId]: modifier,
          },
        };
      })
    );
  };

  const updateWeight = (index: number, valueId: string, val: number) => {
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          weights: {
            ...row.weights,
            [valueId]: val,
          },
        };
      })
    );
  };

  const updateWidth = (index: number, valueId: string, val: number) => {
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          widths: {
            ...row.widths,
            [valueId]: val,
          },
        };
      })
    );
  };

  const updateHeight = (index: number, valueId: string, val: number) => {
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          heights: {
            ...row.heights,
            [valueId]: val,
          },
        };
      })
    );
  };

  const updateLength = (index: number, valueId: string, val: number) => {
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          lengths: {
            ...row.lengths,
            [valueId]: val,
          },
        };
      })
    );
  };

  const remove = (i: number) =>
    setLocal((prev) => prev.filter((_, idx) => idx !== i));

  const handleMoveValue = (attributeId: string, index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setAvailable((prev) =>
      prev.map((attr) => {
        if (attr.id !== attributeId) return attr;

        const updatedValues = [...attr.values];
        const temp = updatedValues[index];
        updatedValues[index] = updatedValues[targetIndex];
        updatedValues[targetIndex] = temp;

        return { ...attr, values: updatedValues };
      })
    );
  };

  const handleDragStart = (attrId: string, idx: number) => {
    setDraggedAttrId(attrId);
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (attrId: string, targetIdx: number) => {
    if (draggedAttrId !== attrId || draggedIndex === null || draggedIndex === targetIdx) return;

    setAvailable((prev) =>
      prev.map((attr) => {
        if (attr.id !== attrId) return attr;

        const updatedValues = [...attr.values];
        const temp = updatedValues[draggedIndex];
        updatedValues.splice(draggedIndex, 1);
        updatedValues.splice(targetIdx, 0, temp);

        return { ...attr, values: updatedValues };
      })
    );

    setDraggedIndex(targetIdx);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedAttrId(null);
  };

  const setAttributeId = (index: number, id: string) =>
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        // Cek duplikasi
        const isDuplicate = prev.some(
          (r, j) => j !== index && r.attributeId === id,
        );
        if (isDuplicate) {
          toast.error("This attribute has already been selected.");
          return row; // Kembalikan baris yang lama
        }

        // Reset valueIds saat attribute berubah
        return { ...row, attributeId: id, valueIds: [] };
      }),
    );

  const toggleValue = (index: number, valueId: string) =>
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const isSelected = row.valueIds.includes(valueId);
        const nextValueIds = isSelected
          ? row.valueIds.filter((v) => v !== valueId)
          : [...row.valueIds, valueId];
        
        const nextModifiers = { ...row.priceModifiers };
        if (isSelected && nextModifiers[valueId] !== undefined) {
          delete nextModifiers[valueId];
        }

        return {
          ...row,
          valueIds: nextValueIds,
          priceModifiers: nextModifiers,
        };
      })
    );

  const toggleAllValues = (index: number, attrValues: any[]) =>
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const allIds = attrValues.map((v) => v.id);
        const allSelected = allIds.every((id) => row.valueIds.includes(id));
        
        const nextValueIds = allSelected ? [] : allIds;
        const nextModifiers = allSelected ? {} : { ...row.priceModifiers };
        const nextWeights = allSelected ? {} : { ...row.weights };
        const nextWidths = allSelected ? {} : { ...row.widths };
        const nextHeights = allSelected ? {} : { ...row.heights };
        const nextLengths = allSelected ? {} : { ...row.lengths };

        return {
          ...row,
          valueIds: nextValueIds,
          priceModifiers: nextModifiers,
          weights: nextWeights,
          widths: nextWidths,
          heights: nextHeights,
          lengths: nextLengths,
        };
      })
    );



  // Filter available attributes that are already selected in other rows and whose parent is selected
  const getUnselectedAttributes = (currentId: string) => {
    const selectedIds = local
      .filter((row) => row.attributeId !== currentId)
      .map((row) => row.attributeId);

    const allSelectedValueIds = local.flatMap(row => row.valueIds);

    return available.filter((attr) => {
      if (selectedIds.includes(attr.id)) return false;
      if (!attr.parentValueId) return true;
      return allSelectedValueIds.includes(attr.parentValueId);
    });
  };

  const formatValuesRecursive = (values: any[]): any[] => {
    return values.map((v) => {
      const formatted: any = {
        value: v.value,
        position: v.position || 0,
      };
      if (v.id) formatted.id = v.id;
      if (v.deleted) formatted.deleted = v.deleted;
      if (v.subAttributes && v.subAttributes.length > 0) {
        formatted.subAttributes = v.subAttributes
          .filter((sub: any) => !sub.deleted)
          .map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            type: sub.type,
            parentValueId: sub.parentValueId,
            values: formatValuesRecursive(sub.values),
          }));
      }
      return formatted;
    });
  };

  const mapValuesFromApi = (vals: any[]): any[] => {
    return vals.map((v: any) => {
      const mapped: any = {
        id: v.id,
        value: v.value,
        position: v.position,
        hasSubAttributes: !!(v.subAttributes && v.subAttributes.length > 0),
      };
      if (v.subAttributes && v.subAttributes.length > 0) {
        mapped.subAttributes = v.subAttributes.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          type: sub.type || "TEXT",
          parentValueId: sub.parentValueId,
          values: mapValuesFromApi(sub.values),
        }));
      }
      return mapped;
    });
  };

  const handleOpenEdit = (attr: AttributeFromServer) => {
    setEditingAttributeId(attr.id);
    const hasCustom = attr.values.some(
      (v) => v.value.toLowerCase().includes("custom") || v.value.toLowerCase().includes("kustom")
    );
    const hasFullSide = attr.values.some(
      (v) => v.value.toLowerCase().includes("full side")
    );
    localForm.reset({
      name: attr.name,
      type: attr.type || "TEXT",
      values: mapValuesFromApi(attr.values),
      allowCustomColor: hasCustom,
      allowFullSide: hasFullSide,
    });
    setIsCreateOpen(true);
  };

  const handleDeleteFromDb = async (attrId: string, selectionIdx: number) => {
    if (!confirm("Are you sure you want to permanently delete this attribute from the database?")) {
      return;
    }

    try {
      const res = await fetchApi(`/product-attributes/${attrId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete attribute.");
      }

      toast.success("Attribute deleted successfully.");
      // Remove from active selections
      setLocal((prev) => prev.filter((_, i) => i !== selectionIdx));
      if (!productId) {
        setAvailable((prev) => prev.filter((a) => a.id !== attrId));
      } else {
        await fetchAttributes();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete attribute.");
    }
  };

  const onSubmitCreate = async (data: any) => {
    if (!data.name.trim()) {
      toast.error("Attribute name is required.");
      return;
    }
    
    const normalizedName = data.name.trim().toLowerCase();
    const nameExists = available.some(
      (a) => a.name.toLowerCase() === normalizedName && a.id !== editingAttributeId
    );

    if (nameExists) {
      toast.error(`Attribute dengan nama "${data.name.trim()}" sudah terdaftar.`);
      return;
    }
    
    let valuesToSend = [...data.values];
    if (data.type === "COLOR") {
      const hasCustom = valuesToSend.some(
        (v) => !v.deleted && (v.value.toLowerCase().includes("custom") || v.value.toLowerCase().includes("kustom"))
      );
      if (data.allowCustomColor && !hasCustom) {
        valuesToSend.push({
          value: "Custom Color|#ffffff|cmyk(0,0,0,0)",
          hasSubAttributes: false,
        });
      } else if (!data.allowCustomColor && hasCustom) {
        valuesToSend = valuesToSend.map((v) => {
          if (v.value.toLowerCase().includes("custom") || v.value.toLowerCase().includes("kustom")) {
            if (v.id) {
              return { ...v, deleted: true };
            }
            return null;
          }
          return v;
        }).filter(Boolean);
      }
    }

    const formattedValues = formatValuesRecursive(valuesToSend);
    const activeValues = formattedValues.filter((v) => !v.deleted);
    if (activeValues.length === 0) {
      toast.error("At least one active value is required.");
      return;
    }

    setSubmittingCreate(true);
    try {
      const url = editingAttributeId 
        ? `/product-attributes/${editingAttributeId}`
        : "/product-attributes";
      const method = editingAttributeId ? "PATCH" : "POST";
      
      const payload: any = {
        name: data.name.trim(),
        type: data.type,
        values: formattedValues,
      };
      
      if (!editingAttributeId) {
        payload.productId = productId || undefined;
      }

      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${editingAttributeId ? "update" : "create"} attribute.`);
      }

      const newAttr = await res.json();
      toast.success(`Attribute ${editingAttributeId ? "updated" : "created"} successfully.`);
      
      if (!editingAttributeId && onAttributeCreated) {
        onAttributeCreated(newAttr.id);
      }

      if (!productId) {
        setAvailable((prev) => {
          const exists = prev.some((a) => a.id === newAttr.id);
          if (exists) {
            return prev.map((a) => (a.id === newAttr.id ? newAttr : a));
          }
          return [...prev, newAttr];
        });
      } else {
        await fetchAttributes();
      }
      setIsCreateOpen(false);
      setEditingAttributeId(null);
      localForm.reset({
        name: "",
        type: "TEXT",
        values: [{ value: "", hasSubAttributes: false }],
        allowCustomColor: false,
        allowFullSide: false,
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to ${editingAttributeId ? "update" : "create"} attribute.`);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleCloneAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedCloneId) {
      toast.error("Please select an attribute to clone.");
      return;
    }

    setSubmittingClone(true);
    try {
      let res;
      if (productId) {
        res = await fetchApi("/product-attributes/clone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceAttributeId: selectedCloneId,
            targetProductId: productId,
          }),
        });
      } else {
        const sourceAttr = allAttributes.find((attr) => attr.id === selectedCloneId);
        if (!sourceAttr) {
          throw new Error("Source attribute not found.");
        }
        res = await fetchApi("/product-attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sourceAttr.name,
            type: sourceAttr.type || "TEXT",
            values: sourceAttr.values.map((v) => ({
              value: v.value,
              position: v.position,
            })),
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to clone attribute.");
      }

      const clonedAttr = await res.json();
      toast.success("Attribute cloned successfully.");
      
      if (onAttributeCreated) {
        onAttributeCreated(clonedAttr.id);
      }

      if (!productId) {
        setAvailable((prev) => [...prev, clonedAttr]);
      } else {
        await fetchAttributes();
      }
      setIsCloneOpen(false);
      setSelectedCloneId("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to clone attribute.");
    } finally {
      setSubmittingClone(false);
    }
  };

  const cloneableAttributes = allAttributes.filter((attr) => {
    // Jangan izinkan clone attribute yang sudah ada di 'available' (berdasarkan nama case-insensitive)
    const alreadyExists = available.some(
      (a) => a.name.toLowerCase() === attr.name.toLowerCase()
    );
    return !alreadyExists;
  });

  // --- RENDER ---

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
        <h4 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <ListChecks className="h-5 w-5 text-indigo-600" />
          Product Attributes
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {/* Create Local Attribute Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingAttributeId(null);
              localForm.reset({
                name: "",
                type: "TEXT",
                values: [{ value: "", hasSubAttributes: false }],
                allowCustomColor: false,
                allowFullSide: false,
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Plus className="h-4 w-4" />
                <span>Create Local Attribute</span>
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-md w-full bg-white text-slate-900 border max-h-[85vh] flex flex-col"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  localForm.handleSubmit(onSubmitCreate)(e);
                }}
                className="space-y-4 flex-1 flex flex-col min-h-0"
              >
                <DialogHeader className="shrink-0">
                  <DialogTitle className="text-slate-900">{editingAttributeId ? "Edit Attribute" : "Create Local Attribute"}</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    {editingAttributeId ? "Modify this attribute's details and values. Changes will apply immediately." : "Create an attribute that belongs specifically to this product. This prevents interference with other products."}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-1 py-1 min-h-0">
                  <div>
                    <Label htmlFor="attr-name" className="text-slate-700 text-sm font-semibold">Attribute Name (e.g. Size, Print Area)</Label>
                    <Input
                      id="attr-name"
                      placeholder="e.g. Size, Color, Print Position"
                      {...localForm.register("name")}
                      className="mt-1 border-slate-300 text-slate-800 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="attr-type" className="text-slate-700 text-sm font-semibold">Attribute Type</Label>
                    <Select
                      value={currentLocalType}
                      onValueChange={(val) => localForm.setValue("type", val)}
                    >
                      <SelectTrigger id="attr-type" className="w-full mt-1 border-slate-300 bg-white text-slate-850">
                        <SelectValue placeholder="Choose type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border text-slate-850">
                        <SelectItem value="TEXT" className="hover:bg-slate-50">Text (Default)</SelectItem>
                        <SelectItem value="COLOR" className="hover:bg-slate-50">Color Swatch</SelectItem>
                        <SelectItem value="SIZE" className="hover:bg-slate-50">Size / Capacity</SelectItem>
                        <SelectItem value="MOCKUP_SIDE" className="hover:bg-slate-50">Mockup Side / Print Position</SelectItem>
                        <SelectItem value="MODEL_SHAPE" className="hover:bg-slate-50">Model / Shape</SelectItem>
                        <SelectItem value="PRINT_METHOD" className="hover:bg-slate-50">Printing Method</SelectItem>
                      </SelectContent>
                    </Select>

                    {currentLocalType === "COLOR" && (
                      <div className="flex items-center space-x-2 select-none border border-indigo-100 bg-indigo-50/30 p-2.5 rounded-md mt-2">
                        <Checkbox
                          id="modal-allow-custom-color"
                          checked={localForm.watch("allowCustomColor") || false}
                          onCheckedChange={(checked) => {
                            localForm.setValue("allowCustomColor", !!checked);
                          }}
                        />
                        <label htmlFor="modal-allow-custom-color" className="text-xs font-bold text-indigo-700 cursor-pointer">
                          Aktifkan Pilihan Warna Kustom (Pembeli bebas pilih warna sendiri)
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-slate-700 text-sm font-semibold">Attribute Values</Label>
                    
                    <LocalFieldArrayEditor
                      control={control}
                      localForm={localForm}
                      currentLocalType={currentLocalType}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 shrink-0 pt-2 border-t mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={submittingCreate}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {submittingCreate ? (editingAttributeId ? "Updating..." : "Creating...") : (editingAttributeId ? "Update" : "Create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Clone Attribute Dialog */}
          <Dialog open={isCloneOpen} onOpenChange={(open) => {
            setIsCloneOpen(open);
            if (open) {
              fetchAllAttributesForClone();
            }
          }}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Plus className="h-4 w-4" />
                <span>Clone Attribute</span>
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-md w-full bg-white text-slate-900 border"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <form onSubmit={handleCloneAttribute} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-slate-900">Clone Attribute</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Clone an existing attribute from another product or a global attribute. This creates a local copy for this product.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label htmlFor="clone-select" className="text-slate-700 text-sm font-semibold">Select Attribute to Clone</Label>
                  <Popover open={cloneSelectOpen} onOpenChange={setCloneSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between mt-1 border-slate-300 bg-white text-slate-800 font-normal max-w-full overflow-hidden">
                        <span className="truncate text-left flex-1 min-w-0 pr-2 max-w-[240px] sm:max-w-[340px]">
                          {selectedCloneId
                            ? (() => {
                                const attr = cloneableAttributes.find((a) => a.id === selectedCloneId);
                                return attr ? `${attr.name} (${attr.values.map((v) => v.value).join(", ")})` : "Choose attribute..."
                              })()
                            : "Choose attribute..."}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-60px)] p-0 bg-white border border-stone-250 shadow-md">
                      <Command>
                        <CommandInput placeholder="Cari atribut untuk di-clone..." />
                        <CommandList>
                          <CommandEmpty>Atribut tidak ditemukan.</CommandEmpty>
                          {(() => {
                            // Group cloneableAttributes by type
                            const groups: Record<string, typeof cloneableAttributes> = {};
                            cloneableAttributes.forEach((attr) => {
                              const typeKey = attr.type || "TEXT";
                              if (!groups[typeKey]) groups[typeKey] = [];
                              groups[typeKey].push(attr);
                            });

                            // Helper to get nice human-readable type labels
                            const getTypeLabel = (type: string) => {
                              switch (type) {
                                case "COLOR":
                                  return "Color Swatch";
                                case "SIZE":
                                  return "Size / Capacity";
                                case "MOCKUP_SIDE":
                                  return "Mockup Side / Print Position";
                                case "MODEL_SHAPE":
                                  return "Model / Shape";
                                case "PRINT_METHOD":
                                  return "Printing Method";
                                case "TEXT":
                                  return "Text";
                                default:
                                  return type;
                              }
                            };

                            // Sort types A-Z
                            const sortedTypes = Object.keys(groups).sort((a, b) => 
                              getTypeLabel(a).localeCompare(getTypeLabel(b))
                            );

                            return sortedTypes.map((type) => {
                              const sortedAttrs = [...groups[type]].sort((a, b) =>
                                a.name.localeCompare(b.name)
                              );

                              return (
                                <CommandGroup
                                  key={type}
                                  heading={getTypeLabel(type)}
                                  className="px-1.5 py-1"
                                >
                                  {sortedAttrs.map((attr) => {
                                    const fullText = `${attr.name} (${attr.values.map((v) => v.value).join(", ")})`;
                                    return (
                                      <CommandItem
                                        key={attr.id}
                                        value={`${fullText}-${attr.id}`}
                                        className="text-xs py-1.5 cursor-pointer"
                                        onSelect={() => {
                                          setSelectedCloneId(attr.id);
                                          setCloneSelectOpen(false);
                                        }}>
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            selectedCloneId === attr.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="block truncate max-w-[240px] sm:max-w-[340px]" title={fullText}>
                                          {fullText}
                                        </span>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              );
                            });
                          })()}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCloneOpen(false)}
                    disabled={submittingClone}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingClone || !selectedCloneId}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {submittingClone ? "Cloning..." : "Clone"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Attribute Row Button */}
          <Button type="button" onClick={add} variant="default" size="sm" className="space-x-1 bg-slate-900 hover:bg-slate-800 text-white">
            <Plus className="h-4 w-4" />
            <span>Select/Assign Row</span>
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-sm text-indigo-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading available attributes...</span>
        </div>
      )}

      {/* List Attributes yang Dipilih */}
      <div className="space-y-4">
        {local.map((row, idx) => {
          const attr = available.find((a) => a.id === row.attributeId);
          const unselectedAttributes = getUnselectedAttributes(row.attributeId);

          return (
            <Card
              key={idx}
              className="border-2 shadow-sm hover:border-indigo-300 transition-colors">
              <CardContent className="p-4 space-y-4">
                {/* BAGIAN ATAS: SELECTOR & DELETE */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 w-full">
                    {/* Reordering Controls */}
                    <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 hover:bg-slate-100 rounded-sm cursor-pointer"
                        disabled={idx === 0 || loading}
                        onClick={() => {
                          setLocal((prev) => {
                            const updated = [...prev];
                            const temp = updated[idx];
                            updated[idx] = updated[idx - 1];
                            updated[idx - 1] = temp;
                            return updated;
                          });
                        }}
                      >
                        <ArrowUp className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 hover:bg-slate-100 rounded-sm cursor-pointer"
                        disabled={idx === local.length - 1 || loading}
                        onClick={() => {
                          setLocal((prev) => {
                            const updated = [...prev];
                            const temp = updated[idx];
                            updated[idx] = updated[idx + 1];
                            updated[idx + 1] = temp;
                            return updated;
                          });
                        }}
                      >
                        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        Attribute #{idx + 1}
                        {attr && (
                          <>
                             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              attr.type === "COLOR"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : attr.type === "SIZE"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : attr.type === "MOCKUP_SIDE"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : attr.type === "MODEL_SHAPE"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : attr.type === "PRINT_METHOD"
                                ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                : "bg-stone-50 text-stone-700 border border-stone-200"
                            }`}>
                              {attr.type === "COLOR"
                                ? "Color Swatch"
                                : attr.type === "SIZE"
                                ? "Size / Capacity"
                                : attr.type === "MOCKUP_SIDE"
                                ? "Mockup Side / Print Position"
                                : attr.type === "MODEL_SHAPE"
                                ? "Model / Shape"
                                : attr.type === "PRINT_METHOD"
                                ? "Printing Method"
                                : "Text"}
                            </span>
                            {attr.parentValue && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-750 border border-indigo-200 uppercase tracking-wider">
                                Sub of: {attr.parentValue.value.includes("|") ? attr.parentValue.value.split("|")[0] : attr.parentValue.value}
                              </span>
                            )}
                          </>
                        )}
                      </Label>
                      <div className="flex gap-2 items-center mt-1">
                        <Select
                          value={row.attributeId}
                          onValueChange={(val) => setAttributeId(idx, val)}
                          disabled={loading}>
                          <SelectTrigger className="w-full font-medium">
                            <SelectValue placeholder="Pilih jenis attribute (e.g., Warna, Ukuran)..." />
                          </SelectTrigger>
                          <SelectContent>
                             {(() => {
                               const combined = [...unselectedAttributes];
                               if (attr && !combined.some(c => c.id === attr.id)) {
                                 combined.push(attr);
                               }

                               if (combined.length === 0) {
                                 return (
                                   <SelectItem value="placeholder-empty" disabled className="text-xs text-stone-500 text-center">
                                     Belum ada atribut. Silakan Clone atau Buat Baru terlebih dahulu.
                                   </SelectItem>
                                 );
                               }

                               // Group by type
                               const groups: Record<string, typeof combined> = {};
                               combined.forEach((a) => {
                                 const typeKey = a.type || "TEXT";
                                 if (!groups[typeKey]) groups[typeKey] = [];
                                 groups[typeKey].push(a);
                               });

                               // Helper to get nice human-readable type labels for SelectLabel
                               const getTypeLabel = (type: string) => {
                                 switch (type) {
                                   case "COLOR":
                                     return "Color Swatch";
                                   case "SIZE":
                                     return "Size / Capacity";
                                   case "MOCKUP_SIDE":
                                     return "Mockup Side / Print Position";
                                   case "MODEL_SHAPE":
                                     return "Model / Shape";
                                   case "PRINT_METHOD":
                                     return "Printing Method";
                                   case "TEXT":
                                     return "Text";
                                   default:
                                     return type;
                                 }
                               };

                               // Sort keys (types) A-Z
                               const sortedTypes = Object.keys(groups).sort((a, b) => 
                                 getTypeLabel(a).localeCompare(getTypeLabel(b))
                               );

                               return sortedTypes.map((type) => {
                                 // Sort attributes inside this type A-Z by name
                                 const sortedAttrs = [...groups[type]].sort((a, b) =>
                                   a.name.localeCompare(b.name)
                                 );

                                 return (
                                   <SelectGroup key={type}>
                                     <SelectLabel className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-stone-50 dark:bg-stone-900/50 px-2 py-1 my-1 rounded-sm">
                                       {getTypeLabel(type)}
                                     </SelectLabel>
                                     {sortedAttrs.map((a) => {
                                       const isSelected = attr && a.id === attr.id;
                                       return (
                                         <SelectItem key={a.id} value={a.id}>
                                           {a.name} ({a.values?.length || 0} values){isSelected ? " - Selected" : ""}
                                         </SelectItem>
                                       );
                                     })}
                                   </SelectGroup>
                                 );
                               });
                             })()}
                          </SelectContent>
                        </Select>

                        {attr && (
                          <div className="flex gap-1 shrink-0">
                            {/* Edit Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 border-stone-200 text-stone-600 hover:bg-stone-50"
                              onClick={() => handleOpenEdit(attr)}
                              title="Edit Attribute Definition"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            {/* Delete From DB Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteFromDb(attr.id, idx)}
                              title="Delete Attribute completely from database"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {row.attributeId && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox
                            id={`generate-variants-${idx}`}
                            checked={
                              (attr?.type === "MOCKUP_SIDE" ||
                                attr?.type === "PRINT_METHOD")
                                ? false
                                : row.isVariantGenerator !== false
                            }
                            disabled={
                              attr?.type === "MOCKUP_SIDE" ||
                              attr?.type === "PRINT_METHOD"
                            }
                            onCheckedChange={(checked) => {
                              if (
                                attr?.type === "MOCKUP_SIDE" ||
                                attr?.type === "PRINT_METHOD"
                              )
                                return;
                              setLocal((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, isVariantGenerator: !!checked } : r
                                )
                              );
                            }}
                            className="h-4 w-4 shrink-0"
                          />
                          <label
                            htmlFor={
                              attr?.type === "MOCKUP_SIDE" ||
                              attr?.type === "PRINT_METHOD"
                                ? undefined
                                : `generate-variants-${idx}`
                            }
                            className={`text-xs font-semibold select-none ${
                              attr?.type === "MOCKUP_SIDE" ||
                              attr?.type === "PRINT_METHOD"
                                ? "text-gray-300 cursor-not-allowed italic"
                                : "text-gray-500 cursor-pointer"
                            }`}
                          >
                            Gunakan untuk menghasilkan variasi kombinasi (Stok & SKU){" "}
                            {(attr?.type === "MOCKUP_SIDE" ||
                              attr?.type === "PRINT_METHOD") &&
                              "(Dinonaktifkan untuk Tipe Cetak)"}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tombol Hapus */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mt-6 shrink-0"
                    onClick={() => remove(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* BAGIAN BAWAH: VALUES CHECKBOXES */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold block">
                      Available Values
                    </Label>
                    {attr && attr.values.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllValues(idx, attr.values)}
                        className="h-7 text-xs px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                      >
                        {attr.values.every((v) => row.valueIds.includes(v.id))
                          ? "🚫 Hapus Pilihan Semua"
                          : "✅ Pilih Semua"}
                      </Button>
                    )}
                  </div>

                  {attr ? (
                    attr.values.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-3 gap-x-4">
                        {attr.values.map((val, valIdx) => {
                          const isDragging = draggedAttrId === attr.id && draggedIndex === valIdx;
                          const parsed = parseColorValue(val.value);
                          const isCustomColor = parsed.name.toLowerCase().includes("custom") || parsed.name.toLowerCase().includes("kustom");
                          return (
                            <label
                              key={val.id}
                              draggable={true}
                              onDragStart={() => handleDragStart(attr.id, valIdx)}
                              onDragOver={handleDragOver}
                              onDragEnter={() => handleDragEnter(attr.id, valIdx)}
                              onDragEnd={handleDragEnd}
                              className={`flex flex-col items-stretch gap-2 text-sm cursor-move border p-2 rounded-md transition-all duration-150 select-none ${
                                isDragging
                                  ? "opacity-45 border-dashed border-indigo-400 bg-indigo-50/50 scale-95"
                                  : "hover:bg-gray-100"
                              }`}
                              style={{
                                backgroundColor: !isDragging && row.valueIds.includes(val.id)
                                  ? "#eef2ff"
                                  : "transparent",
                                borderColor: !isDragging && row.valueIds.includes(val.id)
                                  ? "#4f46e5"
                                  : "#e5e7eb",
                              }}>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`attr-val-${val.id}`}
                                  checked={row.valueIds.includes(val.id)}
                                  onCheckedChange={() => toggleValue(idx, val.id)}
                                  onDragStart={(e) => e.stopPropagation()}
                                  className="h-4 w-4 shrink-0 cursor-pointer"
                                />
                                <span className="truncate flex-1 font-medium flex items-center gap-1.5 text-xs text-slate-700">
                                  {attr.type === "COLOR" ? (
                                    <>
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                        style={{
                                          background: isCustomColor
                                            ? "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
                                            : parsed.hex
                                        }}
                                      />
                                      <span className="truncate">
                                        {parsed.name || parsed.hex}
                                      </span>
                                      {!isCustomColor && (
                                        <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                          CMYK({parsed.cmyk.c},{parsed.cmyk.m},{parsed.cmyk.y},{parsed.cmyk.k})
                                        </span>
                                      )}
                                    </>
                                  ) : (attr.type === "MODEL_SHAPE" || attr.type === "SIZE") ? (
                                    <>
                                      {(() => {
                                        const p = val.value.split("|");
                                        const mName = p[0] || "";
                                        const mUrl = p[1] || "";
                                        return (
                                          <>
                                            {mUrl && (
                                              <img
                                                src={mUrl}
                                                alt={mName}
                                                className="w-4 h-4 object-cover rounded-sm border shrink-0 bg-slate-50"
                                              />
                                            )}
                                            <span className="truncate">{mName}</span>
                                          </>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    val.value
                                  )}
                                </span>

                                {/* Reordering Controls for Options */}
                                <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0 hover:bg-slate-200 rounded-sm cursor-pointer"
                                    disabled={valIdx === 0 || loading}
                                    onClick={() => handleMoveValue(attr.id, valIdx, "up")}>
                                    <ArrowUp className="h-3 w-3 text-slate-500" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0 hover:bg-slate-200 rounded-sm cursor-pointer"
                                    disabled={valIdx === attr.values.length - 1 || loading}
                                    onClick={() => handleMoveValue(attr.id, valIdx, "down")}>
                                    <ArrowDown className="h-3 w-3 text-slate-500" />
                                  </Button>
                                </div>
                              </div>

                              {row.valueIds.includes(val.id) && (
                                <div className="flex flex-col gap-1.5 pt-1.5 border-t mt-1" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-gray-500 font-semibold w-12 shrink-0">Price Adj:</span>
                                    <input
                                      type="number"
                                      placeholder="+ Harga"
                                      value={row.priceModifiers?.[val.id] !== undefined ? row.priceModifiers[val.id] : ""}
                                      onChange={(e) => {
                                        updatePriceModifier(idx, val.id, parseFloat(e.target.value) || 0);
                                      }}
                                      className="w-full text-xs border rounded p-1 text-slate-700 bg-white"
                                    />
                                  </div>
                                  {attr.type === "SIZE" && (
                                    <div className="space-y-1 mt-1 border-t pt-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-500 font-semibold w-12 shrink-0">Berat (g):</span>
                                        <input
                                          type="number"
                                          placeholder="Gram"
                                          value={row.weights?.[val.id] !== undefined ? row.weights[val.id] : ""}
                                          onChange={(e) => updateWeight(idx, val.id, parseFloat(e.target.value) || 0)}
                                          className="w-full text-xs border rounded p-1 text-slate-700 bg-white"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-500 font-semibold w-12 shrink-0">P (cm):</span>
                                        <input
                                          type="number"
                                          placeholder="Cm"
                                          value={row.widths?.[val.id] !== undefined ? row.widths[val.id] : ""}
                                          onChange={(e) => updateWidth(idx, val.id, parseFloat(e.target.value) || 0)}
                                          className="w-full text-xs border rounded p-1 text-slate-700 bg-white"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-500 font-semibold w-12 shrink-0">L (cm):</span>
                                        <input
                                          type="number"
                                          placeholder="Cm"
                                          value={row.lengths?.[val.id] !== undefined ? row.lengths[val.id] : ""}
                                          onChange={(e) => updateLength(idx, val.id, parseFloat(e.target.value) || 0)}
                                          className="w-full text-xs border rounded p-1 text-slate-700 bg-white"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-500 font-semibold w-12 shrink-0">T (cm):</span>
                                        <input
                                          type="number"
                                          placeholder="Cm"
                                          value={row.heights?.[val.id] !== undefined ? row.heights[val.id] : ""}
                                          onChange={(e) => updateHeight(idx, val.id, parseFloat(e.target.value) || 0)}
                                          className="w-full text-xs border rounded p-1 text-slate-700 bg-white"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-orange-500 italic">
                        ⚠️ Attribute "{attr.name}" has no values defined.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Silakan pilih attribute di atas untuk melihat nilai
                      (values) yang tersedia.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {local.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-4 border rounded-lg italic">
            No attributes selected yet. Click "Add Attribute Row" to start.
          </p>
        )}
      </div>

      {/* <div className="pt-4 border-t flex justify-end">
        <Button onClick={add} variant="default" size="sm" className="space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Another Attribute Row</span>
        </Button>
      </div> */}
    </div>
  );
}

// ===================== Local Attribute Creator Field Array & Sub-Values Helpers ===================== //

function LocalFieldArrayEditor({
  control,
  localForm,
  currentLocalType,
}: {
  control: any;
  localForm: any;
  currentLocalType: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "values",
  });

  const visibleFields = fields
    .map((field, index) => ({ field, index, item: localForm.watch(`values.${index}`) }))
    .filter((x) => !x.item?.deleted);

  return (
    <div className="space-y-4">
      {(currentLocalType === "MODEL_SHAPE" || currentLocalType === "SIZE") && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Ketentuan Mask Warna ({currentLocalType === "SIZE" ? "Ukuran / Kapasitas" : "Model / Bentuk"}):</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              Mask warna yang diunggah wajib berupa file <strong>PNG dengan outline/latar transparan (transparent outline)</strong>. Area berwarna/outline pada gambar mask ini akan diwarnai secara dinamis saat customer memilih varian warna di katalog.
            </p>
          </div>
        </div>
      )}

      {visibleFields.map(({ field, index }) => {
        const valuePath = `values.${index}`;
        const valValue = localForm.watch(`${valuePath}.value`) || "";

        return (
          <div key={field.id} className="border border-stone-200 p-3 rounded-md bg-stone-50/20 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              {(currentLocalType === "MODEL_SHAPE" || currentLocalType === "SIZE") ? (
                <ModelShapeValueInput
                  value={valValue}
                  onChange={(newVal) => localForm.setValue(`${valuePath}.value`, newVal)}
                  placeholder={currentLocalType === "SIZE" ? "Nama Ukuran (e.g. 500ml, XL)" : "Nama Model / Shape (e.g. Oval, Bulat)"}
                  type={currentLocalType}
                />
              ) : currentLocalType === "COLOR" ? (
                <ColorValueInput
                  value={valValue}
                  onChange={(newVal) => localForm.setValue(`${valuePath}.value`, newVal)}
                />
              ) : (
                <Input
                  placeholder={`Value #${index + 1}`}
                  {...localForm.register(`${valuePath}.value`)}
                  className="flex-1 border-slate-300 text-slate-800 bg-white"
                  required
                />
              )}

              {visibleFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-red-500 hover:text-red-700"
                  onClick={() => {
                    const id = localForm.getValues(`${valuePath}.id`);
                    if (id) {
                      localForm.setValue(`${valuePath}.deleted`, true);
                    } else {
                      remove(index);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1 pl-1 select-none">
              <Checkbox
                id={`has-sub-${field.id}`}
                checked={localForm.watch(`${valuePath}.hasSubAttributes`) || false}
                onCheckedChange={(checked) => {
                  localForm.setValue(`${valuePath}.hasSubAttributes`, !!checked);
                  if (!checked) {
                    localForm.setValue(`${valuePath}.subAttributes`, []);
                  }
                }}
              />
              <label
                htmlFor={`has-sub-${field.id}`}
                className="text-xs font-semibold text-stone-500 cursor-pointer select-none"
              >
                Enable sub-attributes for this value
              </label>
            </div>

            {(localForm.watch(`${valuePath}.hasSubAttributes`) || false) && (
              <LocalSubValuesGroupEditor
                parentPath={valuePath}
                control={control}
                form={localForm}
                level={1}
              />
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: "", hasSubAttributes: false })}
        className="w-full mt-1 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50"
      >
        <Plus className="h-3 w-3 mr-1" /> Add Value
      </Button>
    </div>
  );
}

function LocalSubValuesGroupEditor({
  parentPath,
  control,
  form,
  level = 1,
}: {
  parentPath: string;
  control: any;
  form: any;
  level: number;
}) {
  const parentName = form.watch("name") || "Sub-attribute";
  const parentType = form.watch("type") || "TEXT";

  const subAttributes = form.watch(`${parentPath}.subAttributes`) || [];

  useEffect(() => {
    if (!subAttributes || subAttributes.length === 0) {
      form.setValue(`${parentPath}.subAttributes`, [
        {
          name: parentName,
          type: parentType,
          values: [{ value: "" }],
        },
      ]);
    } else {
      if (subAttributes[0]?.name !== parentName) {
        form.setValue(`${parentPath}.subAttributes.0.name`, parentName);
      }
      if (subAttributes[0]?.type !== parentType) {
        form.setValue(`${parentPath}.subAttributes.0.type`, parentType);
      }
    }
  }, [parentName, parentType, parentPath, form, subAttributes]);

  if (level > 3) return null;

  const subAttrPath = `${parentPath}.subAttributes.0`;

  return (
    <div className="mt-3 pl-4 border-l-2 border-indigo-200 space-y-3 bg-stone-50/40 p-3 rounded-sm">
      <div className="text-[10px] font-bold text-indigo-650 flex items-center gap-1 uppercase tracking-wider">
        <span>Level {level} Sub-Values</span>
      </div>

      <LocalSubValuesEditor
        subAttrPath={subAttrPath}
        control={control}
        form={form}
        type={parentType}
        level={level}
      />
    </div>
  );
}

function LocalSubValuesEditor({
  subAttrPath,
  control,
  form,
  type,
  level,
}: {
  subAttrPath: string;
  control: any;
  form: any;
  type: string;
  level: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${subAttrPath}.values`,
  });

  const visibleFields = fields
    .map((field, index) => ({ field, index, item: form.watch(`${subAttrPath}.values.${index}`) }))
    .filter((x) => !x.item?.deleted);

  return (
    <div className="space-y-2 mt-2">
      <Label className="text-xs font-semibold text-stone-500">Values</Label>

      {(type === "MODEL_SHAPE" || type === "SIZE") && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 mb-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
            Mask warna wajib berupa file <strong>PNG transparent outline</strong> agar warna produk dapat berganti otomatis di katalog.
          </p>
        </div>
      )}
      
      {visibleFields.map(({ field, index }) => {
        const valuePath = `${subAttrPath}.values.${index}`;
        const valValue = form.watch(`${valuePath}.value`) || "";

        return (
          <div key={field.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2">
              {(type === "MODEL_SHAPE" || type === "SIZE") ? (
                <ModelShapeValueInput
                  value={valValue}
                  onChange={(newVal) => form.setValue(`${valuePath}.value`, newVal)}
                  placeholder={type === "SIZE" ? "Nama Ukuran (e.g. 500ml, XL)" : "Nama Model / Shape (e.g. Oval, Bulat)"}
                  type={type}
                />
              ) : type === "COLOR" ? (
                <ColorValueInput
                  value={valValue}
                  onChange={(newVal) => form.setValue(`${valuePath}.value`, newVal)}
                />
              ) : (
                <Input
                  placeholder={`Value #${index + 1}`}
                  {...form.register(`${valuePath}.value`)}
                  className="flex-1 h-9 border-slate-300 bg-white"
                  required
                />
              )}

              {visibleFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-red-500 hover:text-red-700"
                  onClick={() => {
                    const id = form.getValues(`${valuePath}.id`);
                    if (id) {
                      form.setValue(`${valuePath}.deleted`, true);
                    } else {
                      remove(index);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1 pl-1 select-none">
              <Checkbox
                id={`has-sub-${field.id}`}
                checked={form.watch(`${valuePath}.hasSubAttributes`) || false}
                onCheckedChange={(checked) => {
                  form.setValue(`${valuePath}.hasSubAttributes`, !!checked);
                  if (!checked) {
                    form.setValue(`${valuePath}.subAttributes`, []);
                  }
                }}
              />
              <label
                htmlFor={`has-sub-${field.id}`}
                className="text-[11px] font-semibold text-stone-500 cursor-pointer select-none"
              >
                Enable sub-attributes
              </label>
            </div>

            {(form.watch(`${valuePath}.hasSubAttributes`) || false) && (
              <LocalSubValuesGroupEditor
                parentPath={valuePath}
                control={control}
                form={form}
                level={level + 1}
              />
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-[11px] h-6 text-stone-500 hover:text-stone-700"
        onClick={() => append({ value: "" })}
      >
        <Plus className="h-3 w-3 mr-1" /> Add Value Choice
      </Button>
    </div>
  );
}

// ===================== MODEL / SHAPE ATTRIBUTE VALUE IMAGE UPLOADER ===================== //

export interface ModelShapeValueInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "SIZE" | "MODEL_SHAPE" | string;
}

export function ModelShapeValueInput({
  value,
  onChange,
  placeholder = "Nama Opsi (e.g. 500ml, Oval, Bulat)",
  type,
}: ModelShapeValueInputProps) {
  const parts = value ? value.split("|") : [];
  const name = parts[0] || "";
  const imageUrl = parts[1] || "";
  const colorMaskUrl = parts[2] || "";

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMask, setIsUploadingMask] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const CLOUDINARY_CLOUD_NAME = "do9sfnf5k";
      const CLOUDINARY_UPLOAD_PRESET = "ml_default";
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload ke Cloudinary");

      const data = await res.json();
      const newUrl = data.secure_url;
      onChange(`${name}|${newUrl}|${colorMaskUrl}`);
      toast.success("Gambar model berhasil diunggah!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah gambar model");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMaskFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMask(true);
    try {
      const CLOUDINARY_CLOUD_NAME = "do9sfnf5k";
      const CLOUDINARY_UPLOAD_PRESET = "ml_default";
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload ke Cloudinary");

      const data = await res.json();
      const newUrl = data.secure_url;
      onChange(`${name}|${imageUrl}|${newUrl}`);
      toast.success("Mask warna berhasil diunggah!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah mask warna");
    } finally {
      setIsUploadingMask(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onChange(`${newName}|${imageUrl}|${colorMaskUrl}`);
  };

  const handleRemoveImage = () => {
    onChange(`${name}||${colorMaskUrl}`);
  };

  const handleRemoveMask = () => {
    onChange(`${name}|${imageUrl}|`);
  };

  return (
    <div className="flex-1 flex flex-col gap-2.5 p-2.5 bg-stone-100/40 dark:bg-stone-850/40 rounded border border-stone-200/60 dark:border-stone-800">
      <Input
        placeholder={placeholder}
        value={name}
        onChange={handleNameChange}
        className="w-full border-slate-300 text-slate-800 bg-white h-9"
        required
      />

      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Column 1: Gambar Thumbnail */}
        <div className="flex items-center gap-2 shrink-0">
          {imageUrl ? (
            <div className="relative w-9 h-9 border rounded bg-slate-100 flex items-center justify-center overflow-hidden">
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity cursor-pointer"
              >
                Hapus
              </button>
            </div>
          ) : (
            <label className="w-9 h-9 border border-dashed rounded border-slate-300 hover:border-slate-500 bg-white flex items-center justify-center cursor-pointer transition-colors relative">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileChange}
              />
            </label>
          )}
          <div className="flex flex-col max-w-[100px]">
            <span className="text-[10px] text-stone-600 dark:text-stone-300 font-medium leading-tight select-none">
              {imageUrl ? "Gambar Terpilih" : "Unggah Gambar"}
            </span>
            <span className="text-[9px] text-stone-400 leading-tight select-none">
              Preview opsi
            </span>
          </div>
        </div>

        {/* Column 2: Mask Warna */}
        <div className="flex items-center gap-2 shrink-0">
          {colorMaskUrl ? (
            <div className="relative w-9 h-9 border rounded bg-slate-100 flex items-center justify-center overflow-hidden">
              <img src={colorMaskUrl} alt="Mask" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveMask}
                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity cursor-pointer"
              >
                Hapus
              </button>
            </div>
          ) : (
            <label
              title="Unggah file PNG dengan background transparan (transparent outline)"
              className="w-9 h-9 border border-dashed rounded border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 flex items-center justify-center cursor-pointer transition-colors relative"
            >
              {isUploadingMask ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              ) : (
                <div className="flex flex-col items-center justify-center text-indigo-500">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              )}
              <input
                type="file"
                accept="image/png"
                className="hidden"
                disabled={isUploadingMask}
                onChange={handleMaskFileChange}
              />
            </label>
          )}
          <div className="flex flex-col max-w-[130px]">
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold leading-tight select-none">
              {colorMaskUrl ? "Mask Terpilih" : "Upload Mask Warna"}
            </span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium leading-tight select-none">
              Wajib outline transparan (.png)
            </span>
          </div>
        </div>
      </div>

      {/* Information Callout */}
      <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 text-[10px] text-amber-800 dark:text-amber-300 leading-tight">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Ketentuan Mask:</strong> File harus berupa <strong>PNG transparent outline</strong> (latar belakang transparan). Area outline/objek pada gambar ini yang akan diwarnai secara dinamis sesuai pilihan warna produk.
        </span>
      </div>
    </div>
  );
}
