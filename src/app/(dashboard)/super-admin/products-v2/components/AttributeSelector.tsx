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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";
import { ArrowDown, ArrowUp, GripVertical, ListChecks, Loader2, Plus, Trash2, Pencil } from "lucide-react";
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
  values: { id: string; value: string; attributeId?: string }[];
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
}: {
  productId?: string;
  value?: SelectedAttributeRow[];
  onChange: (v: SelectedAttributeRow[], full: AttributeFromServer[]) => void;
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
    },
  });

  const { control } = localForm;
  const currentLocalType = localForm.watch("type");

  // Cloning states
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [allAttributes, setAllAttributes] = useState<AttributeFromServer[]>([]);
  const [selectedCloneId, setSelectedCloneId] = useState("");
  const [submittingClone, setSubmittingClone] = useState(false);

  // Drag states for option choices
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedAttrId, setDraggedAttrId] = useState<string | null>(null);

  // Sync: Ambil data dari parent saat pertama kali atau saat 'value' berubah
  useEffect(() => {
    if (value) {
      setLocal(value);
    }
  }, [value]);

  // Sync: Beri tahu parent (FormUpdateAttributes) setiap kali 'local' atau 'available' berubah
  useEffect(() => {
    const cleanLocal = local.map((row) => {
      const attr = available.find((a) => a.id === row.attributeId);
      if (attr?.type === "MOCKUP_SIDE" && row.isVariantGenerator !== false) {
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
        : "/product-attributes/list";
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
    localForm.reset({
      name: attr.name,
      type: attr.type || "TEXT",
      values: mapValuesFromApi(attr.values),
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
      await fetchAttributes();
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
    const formattedValues = formatValuesRecursive(data.values);
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

      toast.success(`Attribute ${editingAttributeId ? "updated" : "created"} successfully.`);
      await fetchAttributes();
      setIsCreateOpen(false);
      setEditingAttributeId(null);
      localForm.reset({
        name: "",
        type: "TEXT",
        values: [{ value: "", hasSubAttributes: false }],
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
    if (!selectedCloneId) {
      toast.error("Please select an attribute to clone.");
      return;
    }
    if (!productId) {
      toast.error("Product ID is required for cloning.");
      return;
    }

    setSubmittingClone(true);
    try {
      const res = await fetchApi("/product-attributes/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAttributeId: selectedCloneId,
          targetProductId: productId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to clone attribute.");
      }

      toast.success("Attribute cloned successfully.");
      await fetchAttributes();
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
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Plus className="h-4 w-4" />
                <span>Create Local Attribute</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full bg-white text-slate-900 border max-h-[85vh] flex flex-col">
              <form onSubmit={localForm.handleSubmit(onSubmitCreate)} className="space-y-4 flex-1 flex flex-col min-h-0">
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
                      </SelectContent>
                    </Select>
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
          {productId && (
            <Dialog open={isCloneOpen} onOpenChange={setIsCloneOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <Plus className="h-4 w-4" />
                  <span>Clone Attribute</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full bg-white text-slate-900 border">
                <form onSubmit={handleCloneAttribute} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">Clone Attribute</DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Clone an existing attribute from another product or a global attribute. This creates a local copy for this product.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="clone-select" className="text-slate-700 text-sm font-semibold">Select Attribute to Clone</Label>
                    <Select
                      value={selectedCloneId}
                      onValueChange={setSelectedCloneId}
                    >
                      <SelectTrigger id="clone-select" className="w-full mt-1 border-slate-300 bg-white text-slate-800">
                        <SelectValue placeholder="Choose attribute..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border">
                        {cloneableAttributes.map((attr) => (
                          <SelectItem key={attr.id} value={attr.id} className="hover:bg-slate-50">
                            {attr.name} ({attr.values.map(v => v.value).join(", ")})
                          </SelectItem>
                        ))}
                        {cloneableAttributes.length === 0 && (
                          <p className="p-2 text-xs text-slate-500 text-center">
                            No attributes available to clone.
                          </p>
                        )}
                      </SelectContent>
                    </Select>
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
          )}

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
                                : "bg-stone-50 text-stone-700 border border-stone-200"
                            }`}>
                              {attr.type === "COLOR" ? "Color Swatch" : attr.type === "SIZE" ? "Size / Capacity" : attr.type === "MOCKUP_SIDE" ? "Mockup Side / Print Position" : "Text"}
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
                            {/* Tampilkan attribute yang sudah dipilih + yang belum dipilih lainnya */}
                            {unselectedAttributes.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name} ({a.type === "COLOR" ? "Color" : a.type === "SIZE" ? "Size" : a.type === "MOCKUP_SIDE" ? "Mockup Side" : "Text"} - {a.values.length} values)
                              </SelectItem>
                            ))}
                            {attr && (
                              <SelectItem key={attr.id} value={attr.id}>
                                {attr.name} ({attr.type === "COLOR" ? "Color" : attr.type === "SIZE" ? "Size" : attr.type === "MOCKUP_SIDE" ? "Mockup Side" : "Text"} - Currently Selected)
                              </SelectItem>
                            )}
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
                            checked={attr?.type === "MOCKUP_SIDE" ? false : row.isVariantGenerator !== false}
                            disabled={attr?.type === "MOCKUP_SIDE"}
                            onCheckedChange={(checked) => {
                              if (attr?.type === "MOCKUP_SIDE") return;
                              setLocal((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, isVariantGenerator: !!checked } : r
                                )
                              );
                            }}
                            className="h-4 w-4 shrink-0"
                          />
                          <label
                            htmlFor={attr?.type === "MOCKUP_SIDE" ? undefined : `generate-variants-${idx}`}
                            className={`text-xs font-semibold select-none ${
                              attr?.type === "MOCKUP_SIDE"
                                ? "text-gray-300 cursor-not-allowed italic"
                                : "text-gray-500 cursor-pointer"
                            }`}
                          >
                            Gunakan untuk menghasilkan variasi kombinasi (Stok & SKU) {attr?.type === "MOCKUP_SIDE" && "(Dinonaktifkan untuk Posisi Cetak)"}
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
                  <Label className="text-sm font-semibold mb-2 block">
                    Available Values
                  </Label>

                  {attr ? (
                    attr.values.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-3 gap-x-4">
                        {attr.values.map((val, valIdx) => {
                          const isDragging = draggedAttrId === attr.id && draggedIndex === valIdx;
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
                                    (() => {
                                      const parsed = parseColorValue(val.value);
                                      return (
                                        <>
                                          <span
                                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                            style={{ backgroundColor: parsed.hex }}
                                          />
                                          <span className="truncate">
                                            {parsed.name || parsed.hex}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                            CMYK({parsed.cmyk.c},{parsed.cmyk.m},{parsed.cmyk.y},{parsed.cmyk.k})
                                          </span>
                                        </>
                                      );
                                    })()
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
                                          placeholder="Gr"
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
                                          value={row.lengths?.[val.id] !== undefined ? row.lengths[val.id] : ""}
                                          onChange={(e) => updateLength(idx, val.id, parseFloat(e.target.value) || 0)}
                                          className="w-full text-xs border rounded p-1 text-slate-700 bg-white"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-500 font-semibold w-12 shrink-0">L (cm):</span>
                                        <input
                                          type="number"
                                          placeholder="Cm"
                                          value={row.widths?.[val.id] !== undefined ? row.widths[val.id] : ""}
                                          onChange={(e) => updateWidth(idx, val.id, parseFloat(e.target.value) || 0)}
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
      {visibleFields.map(({ field, index }) => {
        const valuePath = `values.${index}`;
        const valValue = localForm.watch(`${valuePath}.value`) || "";

        return (
          <div key={field.id} className="border border-stone-200 p-3 rounded-md bg-stone-50/20 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              {currentLocalType === "COLOR" ? (
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
      
      {visibleFields.map(({ field, index }) => {
        const valuePath = `${subAttrPath}.values.${index}`;
        const valValue = form.watch(`${valuePath}.value`) || "";

        return (
          <div key={field.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2">
              {type === "COLOR" ? (
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
