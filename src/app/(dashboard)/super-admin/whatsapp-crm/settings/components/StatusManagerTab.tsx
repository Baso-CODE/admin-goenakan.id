"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useApi } from "@/hooks/useApi";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  Kanban,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CrmStatusConfigItem, PRESET_STATUS_COLORS } from "../../types/crmStatus.type";

interface StatusFormData {
  id?: string;
  label: string;
  key: string;
  color: string;
  isWon: boolean;
  isLost: boolean;
  isDefault: boolean;
}

export function StatusManagerTab() {
  const { fetchApi } = useApi();

  const [statuses, setStatuses] = useState<CrmStatusConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Dialog State (Add / Edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<StatusFormData>({
    label: "",
    key: "",
    color: "#2563eb",
    isWon: false,
    isLost: false,
    isDefault: false,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CrmStatusConfigItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Statuses
  const loadStatuses = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetchApi("/crm/statuses");
      if (res.ok) {
        const json = await res.json();
        setStatuses(Array.isArray(json.data) ? json.data : []);
      } else {
        toast.error("Gagal memuat daftar status prospek");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data status");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  // Helper Auto-generate Key from Label
  const handleLabelChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, label: val };
      if (dialogMode === "create") {
        updated.key = val
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      }
      return updated;
    });
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setDialogMode("create");
    setFormData({
      label: "",
      key: "",
      color: "#2563eb",
      isWon: false,
      isLost: false,
      isDefault: false,
    });
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: CrmStatusConfigItem) => {
    setDialogMode("edit");
    setFormData({
      id: item.id,
      label: item.label,
      key: item.key,
      color: item.color,
      isWon: item.isWon,
      isLost: item.isLost,
      isDefault: item.isDefault,
    });
    setDialogOpen(true);
  };

  // Save Status (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      toast.error("Nama label status wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      if (dialogMode === "create") {
        const res = await fetchApi("/crm/statuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: formData.label.trim(),
            key: formData.key.trim() || undefined,
            color: formData.color,
            isWon: formData.isWon,
            isLost: formData.isLost,
            isDefault: formData.isDefault,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal membuat status");

        toast.success("Status baru berhasil ditambahkan!");
      } else {
        const res = await fetchApi(`/crm/statuses/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: formData.label.trim(),
            color: formData.color,
            isWon: formData.isWon,
            isLost: formData.isLost,
            isDefault: formData.isDefault,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal memperbarui status");

        toast.success("Status berhasil diperbarui!");
      }

      setDialogOpen(false);
      loadStatuses(true);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Status
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetchApi(`/crm/statuses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus status");

      toast.success(json.message || "Status berhasil dihapus!");
      setDeleteTarget(null);
      loadStatuses(true);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus status");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reorder Item (Up / Down)
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= statuses.length) return;

    const reordered = [...statuses];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistic UI update
    setStatuses(reordered);

    try {
      setIsReordering(true);
      const statusIds = reordered.map((s) => s.id);
      const res = await fetchApi("/crm/statuses/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusIds }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan urutan status");
      toast.success("Urutan status berhasil disimpan");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan urutan");
      loadStatuses(true);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Status Management Card ── */}
      <Card className="border-stone-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                <Kanban className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-stone-900">
                  Daftar Status & Tahapan Prospek
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 mt-0.5">
                  Atur alur tahapan prospek (*sales pipeline*) secara dinamis. Anda dapat menambah status baru, mengganti warna badge, dan mengurutkan tahapan proses sales.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadStatuses(false)}
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
                <span>Tambah Status Baru</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <p className="text-xs">Memuat konfigurasi status...</p>
            </div>
          ) : statuses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                <Kanban className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">Belum Ada Status Dikonfigurasi</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Atur tahapan prospek pertama untuk mulai memantau alur penjualan di CRM.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Status Pertama</span>
              </Button>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-stone-50/80">
                  <TableRow className="border-stone-200">
                    <TableHead className="w-16 text-center text-xs font-semibold text-stone-600">Urutan</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 min-w-[200px]">Nama Status & Badge</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600">Kode Key</TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600">Kategori / Tipe</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-stone-600">Lead Aktif</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-stone-600 pr-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((item, index) => {
                    const leadCount = item._count?.leads || 0;
                    const isProtected = item.isDefault || item.key === "NEW";

                    return (
                      <TableRow key={item.id} className="border-stone-100 hover:bg-stone-50/60 transition-colors">
                        {/* Order & Reorder Controls */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-mono font-semibold text-stone-400 w-4">
                              {index + 1}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={index === 0 || isReordering}
                                onClick={() => handleMoveOrder(index, "up")}
                                className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20 disabled:hover:text-stone-400 transition-colors"
                                title="Pindah ke atas"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === statuses.length - 1 || isReordering}
                                onClick={() => handleMoveOrder(index, "down")}
                                className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20 disabled:hover:text-stone-400 transition-colors"
                                title="Pindah ke bawah"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        {/* Status Label & Color Badge Preview */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-black/10"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2.5 py-0.5 rounded-md border shadow-2xs"
                                style={{
                                  backgroundColor: `${item.color}15`,
                                  color: item.color,
                                  borderColor: `${item.color}40`,
                                }}
                              >
                                {item.label}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* Status Key */}
                        <TableCell>
                          <code className="text-[11px] font-mono px-2 py-0.5 bg-stone-100 text-stone-700 rounded border border-stone-200">
                            {item.key}
                          </code>
                        </TableCell>

                        {/* Status Type Tag */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.isDefault && (
                              <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 gap-1 font-medium">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Default Masuk</span>
                              </Badge>
                            )}
                            {item.isWon && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-medium">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Closing (Won)</span>
                              </Badge>
                            )}
                            {item.isLost && (
                              <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 gap-1 font-medium">
                                <XCircle className="w-2.5 h-2.5" />
                                <span>Batal (Lost)</span>
                              </Badge>
                            )}
                            {!item.isWon && !item.isLost && !item.isDefault && (
                              <span className="text-[11px] text-stone-400">Dalam Proses</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Lead Count */}
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full ${
                              leadCount > 0 ? "bg-stone-100 text-stone-800 border border-stone-200" : "text-stone-400"
                            }`}
                          >
                            {leadCount}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="h-7 w-7 p-0 text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                              title="Edit status"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isProtected || leadCount > 0}
                              onClick={() => setDeleteTarget(item)}
                              className="h-7 w-7 p-0 text-stone-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:text-stone-400"
                              title={
                                isProtected
                                  ? "Status default tidak dapat dihapus"
                                  : leadCount > 0
                                  ? `Masih digunakan oleh ${leadCount} lead`
                                  : "Hapus status"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal Add / Edit Status ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-white border-stone-200 text-stone-900">
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Kanban className="w-4 h-4 text-emerald-600" />
                <span>{dialogMode === "create" ? "Tambah Status Prospek Baru" : "Edit Status Prospek"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                {dialogMode === "create"
                  ? "Tentukan label, warna badge, dan tipe tahapan untuk prospek WhatsApp."
                  : "Sesuaikan label dan warna untuk tahapan ini."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Nama Label */}
              <div className="space-y-1.5">
                <Label htmlFor="status-label" className="text-xs font-semibold text-stone-700">
                  Nama Label Status <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="status-label"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Contoh: Kirim Sampel, Nego Harga, Menunggu DP"
                  className="text-xs h-9 bg-white"
                  required
                />
              </div>

              {/* Kode Key */}
              <div className="space-y-1.5">
                <Label htmlFor="status-key" className="text-xs font-semibold text-stone-700">
                  Kode Key (Identitas Database) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="status-key"
                  value={formData.key}
                  disabled={dialogMode === "edit"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                    }))
                  }
                  placeholder="Contoh: KIRIM_SAMPEL"
                  className="text-xs h-9 font-mono bg-stone-50 disabled:opacity-70"
                  required
                />
                <p className="text-[10px] text-stone-400">
                  {dialogMode === "create"
                    ? "Digenerate otomatis dari nama label (hanya huruf kapital, angka, dan underscore)."
                    : "Kode key bersifat unik dan tidak dapat diubah setelah dibuat."}
                </p>
              </div>

              {/* Pilihan Warna */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-stone-700">Pilihan Warna Badge</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_STATUS_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color: c.hex }))}
                      className={`h-8 rounded-lg flex items-center justify-center transition-all border ${
                        formData.color === c.hex
                          ? "ring-2 ring-emerald-500 ring-offset-1 scale-105 border-transparent shadow-xs"
                          : "border-stone-200 hover:scale-102"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {formData.color === c.hex && (
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Hex Picker Input */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-stone-500">Kustom HEX:</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-7 h-7 rounded border border-stone-200 cursor-pointer p-0 bg-transparent"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="text-xs h-7 font-mono w-24 bg-white"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Tipe Status Checkboxes */}
              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isWon"
                    checked={formData.isWon}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isWon: !!checked,
                        isLost: checked ? false : prev.isLost,
                      }))
                    }
                  />
                  <Label htmlFor="isWon" className="text-xs text-stone-700 font-medium cursor-pointer">
                    Tandai status ini sebagai <strong className="text-emerald-700">Closing / Berhasil (Deal Won)</strong>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isLost"
                    checked={formData.isLost}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isLost: !!checked,
                        isWon: checked ? false : prev.isWon,
                      }))
                    }
                  />
                  <Label htmlFor="isLost" className="text-xs text-stone-700 font-medium cursor-pointer">
                    Tandai status ini sebagai <strong className="text-rose-700">Batal / Gagal (Lost)</strong>
                  </Label>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1.5">
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                  Pratinjau Tampilan Badge
                </span>
                <div>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border shadow-2xs"
                    style={{
                      backgroundColor: `${formData.color}15`,
                      color: formData.color,
                      borderColor: `${formData.color}40`,
                    }}
                  >
                    {formData.label || "Contoh Status"}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="h-8 text-xs text-stone-600 hover:text-stone-900"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                <span>{dialogMode === "create" ? "Simpan Status Baru" : "Simpan Perubahan"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Confirm Delete ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm p-5 bg-white border-stone-200 text-stone-900">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-stone-900 flex items-center gap-2 text-rose-600">
              <Trash2 className="w-4 h-4" />
              <span>Hapus Status Prospek?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 pt-1">
              Apakah Anda yakin ingin menghapus status{" "}
              <strong className="text-stone-800 font-semibold">"{deleteTarget?.label}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="h-8 text-xs text-stone-600"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              <span>Hapus Status</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
