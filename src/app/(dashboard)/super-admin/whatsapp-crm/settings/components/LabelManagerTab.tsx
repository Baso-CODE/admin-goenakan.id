"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import {
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CrmLabelConfigItem, PRESET_LABEL_COLORS } from "../../types/crmLabel.type";

interface LabelFormData {
  id?: string;
  name: string;
  color: string;
  description: string;
}

export function LabelManagerTab() {
  const { fetchApi } = useApi();

  const [labels, setLabels] = useState<CrmLabelConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog State (Add / Edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<LabelFormData>({
    name: "",
    color: "#059669",
    description: "",
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CrmLabelConfigItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Labels
  const loadLabels = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetchApi("/crm/labels");
      if (res.ok) {
        const json = await res.json();
        setLabels(Array.isArray(json.data) ? json.data : []);
      } else {
        toast.error("Gagal memuat daftar label prospek");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data label");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  // Open Modal Create
  const handleOpenCreate = () => {
    setDialogMode("create");
    setFormData({
      name: "",
      color: "#059669",
      description: "",
    });
    setDialogOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: CrmLabelConfigItem) => {
    setDialogMode("edit");
    setFormData({
      id: item.id,
      name: item.name,
      color: item.color || "#059669",
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama label tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      if (dialogMode === "create") {
        const res = await fetchApi("/crm/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal membuat label baru");
        toast.success(`Label "${formData.name}" berhasil ditambahkan`);
      } else {
        const res = await fetchApi(`/crm/labels/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal memperbarui label");
        toast.success(`Label "${formData.name}" berhasil diperbarui`);
      }

      setDialogOpen(false);
      loadLabels(true);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan label");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetchApi(`/crm/labels/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus label");
      toast.success(json.message || "Label berhasil dihapus");
      setDeleteTarget(null);
      loadLabels(true);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus label");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLabels = labels.filter((lbl) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lbl.name.toLowerCase().includes(q) ||
      (lbl.description && lbl.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-stone-900">
                  Label & Tagging Prospek
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 mt-0.5">
                  Kelola kategori label untuk menandai karakteristik, skala proyek, atau preferensi leads WhatsApp.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadLabels()}
                disabled={isLoading}
                className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Label Baru</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-stone-500">
              Total <strong>{labels.length}</strong> label terdaftar
            </p>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama label atau deskripsi..."
                className="h-8 pl-8 text-xs bg-stone-50/50"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <p className="text-xs">Memuat daftar label...</p>
            </div>
          ) : filteredLabels.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">Label Tidak Ditemukan</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Tidak ada label yang cocok dengan kata kunci pencarian."
                  : "Tambahkan label pertama untuk mulai mengelompokkan prospek pelanggan berdasarkan kriteria tertentu."}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{searchQuery ? "Tambah Label Baru" : "Buat Label Pertama"}</span>
              </Button>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-stone-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px] text-center text-xs font-semibold text-stone-600">
                      No
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 min-w-[180px]">
                      Label & Tag
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600">
                      Deskripsi / Kegunaan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 text-center w-[130px]">
                      Penggunaan
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 text-right w-[110px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLabels.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-stone-50/50">
                      <TableCell className="text-center font-mono text-xs text-stone-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-2xs"
                            style={{
                              backgroundColor: `${item.color}15`,
                              color: item.color,
                              borderColor: `${item.color}40`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-stone-500">
                        {item.description || (
                          <span className="text-stone-300 italic">Tanpa deskripsi</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-mono bg-stone-50 text-stone-600 border-stone-200"
                        >
                          {item.leadCount ?? 0} prospek
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit label"
                            className="h-7 w-7 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus label"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog Form Add / Edit Label ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>{dialogMode === "create" ? "Tambah Label Baru" : "Edit Label Prospek"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              {dialogMode === "create"
                ? "Tentukan nama label dan warna penanda untuk prospek CRM."
                : "Ubah nama, warna, atau deskripsi label ini."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Input Nama Label */}
            <div className="space-y-1.5">
              <Label htmlFor="label-name" className="text-xs font-semibold text-stone-700">
                Nama Label <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="label-name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: B2B Corporate, Urgent Deadline, Reseller"
                required
                className="text-xs"
              />
            </div>

            {/* Warna Label */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">
                  Warna Label
                </Label>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="font-mono text-[11px] text-stone-500">{formData.color}</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {PRESET_LABEL_COLORS.map((p) => {
                  const isSelected = formData.color.toLowerCase() === p.color.toLowerCase();
                  return (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color: p.color }))}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "border-stone-900 bg-stone-100 ring-1 ring-stone-900 font-bold"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-7 h-7 rounded border border-stone-300 p-0.5 cursor-pointer"
                  title="Pilih warna bebas"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="#059669"
                  className="text-xs font-mono h-7 flex-1"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label htmlFor="label-desc" className="text-xs font-semibold text-stone-700">
                Deskripsi / Keterangan (Opsional)
              </Label>
              <Textarea
                id="label-desc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Keterangan singkat mengenai tipe prospek ini..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Preview Badge */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">Pratinjau Label:</span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border shadow-2xs"
                style={{
                  backgroundColor: `${formData.color}15`,
                  color: formData.color,
                  borderColor: `${formData.color}40`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: formData.color }}
                />
                <span>{formData.name || "Nama Label"}</span>
              </span>
            </div>

            <DialogFooter className="pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{dialogMode === "create" ? "Buat Label" : "Simpan Perubahan"}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Konfirmasi Hapus ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2 text-rose-600">
              <Trash2 className="w-4 h-4" />
              <span>Hapus Label Prospek?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 pt-1">
              Apakah Anda yakin ingin menghapus label{" "}
              <strong className="text-stone-800">&quot;{deleteTarget?.name}&quot;</strong>?
              {deleteTarget?.leadCount && deleteTarget.leadCount > 0 ? (
                <span className="block mt-1 text-rose-600 font-medium">
                  Saat ini terdapat {deleteTarget.leadCount} prospek yang memiliki label ini.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Label</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
