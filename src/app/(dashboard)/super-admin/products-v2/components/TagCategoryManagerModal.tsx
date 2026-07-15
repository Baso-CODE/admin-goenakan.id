"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { X, Edit2, Trash2, Plus, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TagCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags: { id: string; name: string }[];
  tagCategories: any[];
  onCategoriesChange: (updated: any[]) => void;
  onTagCreated?: (newTag: { id: string; name: string }) => void;
}

export function TagCategoryManagerModal({
  isOpen,
  onClose,
  availableTags = [],
  tagCategories = [],
  onCategoriesChange,
  onTagCreated,
}: TagCategoryManagerModalProps) {
  const { fetchApi } = useApi();
  
  // Navigation states
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchTagQuery, setSearchTagQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleCreateNewTagInline = async () => {
    const newTagName = searchTagQuery.trim();
    if (!newTagName) return;
    
    setIsCreatingTag(true);
    try {
      const res = await fetchApi("/product-tags", {
        method: "POST",
        body: JSON.stringify({ name: newTagName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat tag");
      }

      const newTag = await res.json();
      toast.success(`Tag "${newTagName}" berhasil dibuat!`);
      
      // Notify parent so it updates availableTags list
      if (onTagCreated) {
        onTagCreated(newTag);
      }
      
      // Auto select the new tag
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setSearchTagQuery(""); // clear search
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat tag");
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Reset form when opening/closing or switching screens
  useEffect(() => {
    if (!isOpen) {
      setIsAdding(false);
      setEditingCategoryId(null);
      setName("");
      setSelectedTagIds([]);
      setSearchTagQuery("");
    }
  }, [isOpen]);

  // Load category details when entering edit mode
  useEffect(() => {
    if (editingCategoryId) {
      const category = tagCategories.find((cat) => cat.id === editingCategoryId);
      if (category) {
        setName(category.name);
        setSelectedTagIds(category.tags?.map((t: any) => t.id) || []);
      }
    } else {
      setName("");
      setSelectedTagIds([]);
    }
  }, [editingCategoryId, tagCategories]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi!");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = !!editingCategoryId;
      const url = isEdit
        ? `/product-tags/categories/${editingCategoryId}`
        : "/product-tags/categories";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetchApi(url, {
        method,
        body: JSON.stringify({
          name: name.trim(),
          tagIds: selectedTagIds,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal menyimpan kategori tag");
      }

      const responseData = await res.json();
      
      let updatedCategories = [...tagCategories];
      if (isEdit) {
        updatedCategories = updatedCategories.map((cat) =>
          cat.id === editingCategoryId ? responseData : cat
        );
        toast.success("Kategori tag berhasil diperbarui!");
      } else {
        updatedCategories = [responseData, ...updatedCategories];
        toast.success("Kategori tag berhasil ditambahkan!");
      }

      onCategoriesChange(updatedCategories);
      setIsAdding(false);
      setEditingCategoryId(null);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori tag ini? Tag di dalamnya tidak akan dihapus.")) {
      return;
    }

    try {
      const res = await fetchApi(`/product-tags/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus kategori tag");

      const updated = tagCategories.filter((cat) => cat.id !== id);
      onCategoriesChange(updated);
      toast.success("Kategori tag berhasil dihapus.");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kategori tag");
    }
  };

  // Filter tags based on search input
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTagQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white text-slate-900 border max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0 pb-2 border-b">
          <DialogTitle className="text-slate-900 flex items-center justify-between">
            <span>
              {isAdding
                ? "Tambah Kategori Tag"
                : editingCategoryId
                ? "Edit Kategori Tag"
                : "Kelola Kategori Tag"}
            </span>
            {!isAdding && !editingCategoryId && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 h-8"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Group</span>
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isAdding || editingCategoryId
              ? "Masukkan nama group dan pilih tag yang akan dikelompokkan."
              : "Kelompokkan tag agar dapat dipilih sekaligus pada produk."}
          </DialogDescription>
        </DialogHeader>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {isAdding || editingCategoryId ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="category-name" className="text-slate-700 text-sm font-semibold">
                  Nama Kategori / Group (e.g. Tumbler)
                </Label>
                <Input
                  id="category-name"
                  placeholder="e.g. Tumbler, Kaos Anak"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 border-slate-300 text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 text-sm font-semibold flex justify-between">
                  <span>Pilih Tag Anggota</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {selectedTagIds.length} tag terpilih
                  </span>
                </Label>

                {/* Search Bar inside Selectable Tags */}
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari tag..."
                    value={searchTagQuery}
                    onChange={(e) => setSearchTagQuery(e.target.value)}
                    className="pl-9 border-slate-300 text-slate-800 bg-white h-9 text-xs"
                  />
                </div>

                {searchTagQuery.trim() && !availableTags.some(t => t.name.toLowerCase() === searchTagQuery.trim().toLowerCase()) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCreateNewTagInline}
                    className="w-full text-xs h-8 text-indigo-650 hover:text-indigo-850 hover:bg-indigo-50 border border-dashed border-indigo-200 flex items-center justify-center gap-1.5 mt-1 bg-white"
                    disabled={isCreatingTag}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isCreatingTag ? "Membuat..." : `Buat tag baru: "${searchTagQuery.trim()}"`}</span>
                  </Button>
                )}

                {/* Selectable tags list */}
                <div className="border rounded-md max-h-48 overflow-y-auto p-2 bg-slate-50 mt-2 space-y-1">
                  {filteredTags.map((tag) => {
                    const isChecked = selectedTagIds.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        onClick={() => handleToggleTag(tag.id)}
                        className={cn(
                          "flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition text-xs",
                          isChecked
                            ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-medium"
                            : "hover:bg-slate-200 text-slate-700"
                        )}
                      >
                        <span>{tag.name}</span>
                        {isChecked && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </div>
                    );
                  })}
                  {filteredTags.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Tag tidak ditemukan. Silakan tambahkan tag terlebih dahulu.
                    </p>
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingCategoryId(null);
                  }}
                  className="border-slate-200 text-slate-700"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {Array.isArray(tagCategories) && tagCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 hover:bg-slate-100/80 transition"
                >
                  <div className="space-y-1 pr-4 min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{cat.name}</h4>
                    <div className="flex flex-wrap gap-1">
                      {cat.tags && cat.tags.length > 0 ? (
                        cat.tags.map((t: any) => (
                          <Badge
                            key={t.id}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-white border text-slate-600"
                          >
                            {t.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">Tidak ada tag</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-slate-200 text-slate-605 hover:text-slate-900"
                      onClick={() => setEditingCategoryId(cat.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-100 text-red-500 hover:text-red-700"
                      onClick={(e) => handleDelete(cat.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!Array.isArray(tagCategories) || tagCategories.length === 0) && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Belum ada kategori tag. Klik "+ Tambah Group" untuk membuat.
                </div>
              )}
            </div>
          )}
        </div>

        {!isAdding && !editingCategoryId && (
          <DialogFooter className="border-t pt-3 shrink-0">
            <Button
              type="button"
              onClick={onClose}
              className="bg-stone-900 hover:bg-stone-800 text-white w-full sm:w-auto"
            >
              Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
