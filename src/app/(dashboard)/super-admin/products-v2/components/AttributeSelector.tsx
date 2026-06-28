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
import { ArrowDown, ArrowUp, GripVertical, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

// --- TIPE DATA ---

type AttributeFromServer = {
  id: string;
  name: string;
  values: { id: string; value: string; attributeId?: string }[];
};

type SelectedAttributeRow = {
  attributeId: string;
  valueIds: string[];
  priceModifiers?: Record<string, number>;
  isVariantGenerator?: boolean;
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

  // Inline creation states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValues, setNewValues] = useState<string[]>([""]);
  const [submittingCreate, setSubmittingCreate] = useState(false);

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
    onChange(local, available);
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
    setLocal((prev) => [...prev, { attributeId: "", valueIds: [], priceModifiers: {} }]);
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

  // Filter available attributes that are already selected in other rows
  const getUnselectedAttributes = (currentId: string) => {
    const selectedIds = local
      .filter((row) => row.attributeId !== currentId)
      .map((row) => row.attributeId);
    return available.filter((attr) => !selectedIds.includes(attr.id));
  };

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Attribute name is required.");
      return;
    }
    const filteredValues = newValues.filter((v) => v.trim() !== "");
    if (filteredValues.length === 0) {
      toast.error("At least one value is required.");
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await fetchApi("/product-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          values: filteredValues.map((v) => ({ value: v.trim() })),
          productId: productId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create attribute.");
      }

      toast.success("Attribute created successfully.");
      await fetchAttributes();
      setIsCreateOpen(false);
      setNewName("");
      setNewValues([""]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create attribute.");
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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="space-x-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Plus className="h-4 w-4" />
                <span>Create Local Attribute</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full bg-white text-slate-900 border">
              <form onSubmit={handleCreateAttribute} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-slate-900">Create Local Attribute</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Create an attribute that belongs specifically to this product. This prevents interference with other products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="attr-name" className="text-slate-700 text-sm font-semibold">Attribute Name (e.g. Size, Print Area)</Label>
                    <Input
                      id="attr-name"
                      placeholder="e.g. Size, Color, Print Position"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="mt-1 border-slate-300 text-slate-800 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-semibold">Values</Label>
                    {newValues.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Value #${idx + 1}`}
                          value={val}
                          onChange={(e) => {
                            const updated = [...newValues];
                            updated[idx] = e.target.value;
                            setNewValues(updated);
                          }}
                          className="border-slate-300 text-slate-800 bg-white"
                          required
                        />
                        {newValues.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNewValues(newValues.filter((_, i) => i !== idx));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewValues([...newValues, ""])}
                      className="w-full mt-1 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Value
                    </Button>
                  </div>
                </div>
                <DialogFooter className="gap-2">
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
                    {submittingCreate ? "Creating..." : "Create"}
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
                      <Label className="text-sm font-semibold">
                        Attribute #{idx + 1}
                      </Label>
                      <Select
                        value={row.attributeId}
                        onValueChange={(val) => setAttributeId(idx, val)}
                        disabled={loading}>
                        <SelectTrigger className="mt-1 w-full font-medium">
                          <SelectValue placeholder="Pilih jenis attribute (e.g., Warna, Ukuran)..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Tampilkan attribute yang sudah dipilih + yang belum dipilih lainnya */}
                          {unselectedAttributes.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} ({a.values.length} values)
                            </SelectItem>
                          ))}
                          {attr && (
                            <SelectItem key={attr.id} value={attr.id}>
                              {attr.name} (Currently Selected)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {row.attributeId && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox
                            id={`generate-variants-${idx}`}
                            checked={row.isVariantGenerator !== false}
                            onCheckedChange={(checked) => {
                              setLocal((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, isVariantGenerator: !!checked } : r
                                )
                              );
                            }}
                            className="h-4 w-4 shrink-0"
                          />
                          <label
                            htmlFor={`generate-variants-${idx}`}
                            className="text-xs font-semibold text-gray-500 cursor-pointer select-none"
                          >
                            Gunakan untuk menghasilkan variasi kombinasi (Stok & SKU)
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
                              className={`flex items-center gap-2 text-sm cursor-move border p-2 rounded-md transition-all duration-150 select-none ${
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
                              <Checkbox
                                id={`attr-val-${val.id}`}
                                checked={row.valueIds.includes(val.id)}
                                onCheckedChange={() => toggleValue(idx, val.id)}
                                onDragStart={(e) => e.stopPropagation()}
                                className="h-4 w-4 shrink-0 cursor-pointer"
                              />
                              <span className="truncate flex-1 font-medium">{val.value}</span>

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

                            {row.valueIds.includes(val.id) && (
                              <input
                                type="number"
                                placeholder="+ Harga"
                                value={row.priceModifiers?.[val.id] !== undefined ? row.priceModifiers[val.id] : ""}
                                onChange={(e) => {
                                  updatePriceModifier(idx, val.id, parseFloat(e.target.value) || 0);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 text-xs border rounded p-1 text-slate-700 bg-white"
                              />
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
