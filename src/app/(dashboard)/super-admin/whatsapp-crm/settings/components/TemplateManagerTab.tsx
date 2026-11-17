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
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CrmMessageTemplateItem,
  PRESET_TEMPLATE_CATEGORIES,
} from "../../types/crmTemplate.type";

interface TemplateFormData {
  id?: string;
  title: string;
  content: string;
  category: string;
  shortcut: string;
}

export function TemplateManagerTab() {
  const { fetchApi } = useApi();

  const [templates, setTemplates] = useState<CrmMessageTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Dialog State (Add / Edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<TemplateFormData>({
    title: "",
    content: "",
    category: "Umum",
    shortcut: "",
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<CrmMessageTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Templates
  const loadTemplates = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetchApi("/crm/templates");
      if (res.ok) {
        const json = await res.json();
        setTemplates(Array.isArray(json.data) ? json.data : []);
      } else {
        toast.error("Gagal memuat template pesan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data template");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Open Modal Create
  const handleOpenCreate = () => {
    setDialogMode("create");
    setFormData({
      title: "",
      content: "",
      category: "Umum",
      shortcut: "",
    });
    setDialogOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: CrmMessageTemplateItem) => {
    setDialogMode("edit");
    setFormData({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category || "Umum",
      shortcut: item.shortcut || "",
    });
    setDialogOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Judul template tidak boleh kosong");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Isi pesan template tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      if (dialogMode === "create") {
        const res = await fetchApi("/crm/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category.trim() || "Umum",
            shortcut: formData.shortcut.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal membuat template baru");
        toast.success(`Template "${formData.title}" berhasil ditambahkan`);
      } else {
        const res = await fetchApi(`/crm/templates/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category.trim() || "Umum",
            shortcut: formData.shortcut.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal memperbarui template");
        toast.success(`Template "${formData.title}" berhasil diperbarui`);
      }

      setDialogOpen(false);
      loadTemplates(true);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetchApi(`/crm/templates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus template");
      toast.success(json.message || "Template berhasil dihapus");
      setDeleteTarget(null);
      loadTemplates(true);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus template");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchSearch =
      !searchQuery.trim() ||
      tpl.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      tpl.content.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (tpl.shortcut && tpl.shortcut.toLowerCase().includes(searchQuery.trim().toLowerCase()));

    const matchCategory =
      selectedCategory === "ALL" || (tpl.category || "Umum") === selectedCategory;

    return matchSearch && matchCategory;
  });

  const categories = Array.from(
    new Set(["ALL", ...PRESET_TEMPLATE_CATEGORIES, ...templates.map((t) => t.category || "Umum")])
  );

  return (
    <div className="space-y-6">
      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-stone-900">
                  Template Pesan Cepat (Quick Reply)
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 mt-0.5">
                  Kelola draf pesan standar untuk membalas salam, format pemesanan, informasi rekening, dan katalog secara instan di ruang chat.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadTemplates()}
                disabled={isLoading}
                className="h-8 px-2.5 text-xs text-stone-600 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Template Baru</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors shrink-0 font-medium cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {cat === "ALL" ? "Semua Kategori" : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, shortcut, atau isi..."
                className="h-8 pl-8 text-xs bg-stone-50/50"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <p className="text-xs">Memuat daftar template pesan...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">Template Tidak Ditemukan</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== "ALL"
                  ? "Tidak ada template yang cocok dengan filter atau kata kunci pencarian."
                  : "Belum ada template pesan cepat yang dikonfigurasi."}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Template Pertama</span>
              </Button>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-stone-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] text-center text-xs font-semibold text-stone-600">
                      No
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 min-w-[160px]">
                      Judul & Shortcut
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 w-[110px]">
                      Kategori
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600">
                      Isi Pesan Template
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-stone-600 text-right w-[100px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-stone-50/50">
                      <TableCell className="text-center font-mono text-xs text-stone-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-xs text-stone-900">{item.title}</p>
                          {item.shortcut && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200"
                        >
                          {item.category || "Umum"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-stone-600 line-clamp-2 whitespace-pre-line leading-relaxed">
                          {item.content}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit template"
                            className="h-7 w-7 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus template"
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

      {/* ── Dialog Form Add / Edit Template ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{dialogMode === "create" ? "Tambah Template Pesan Baru" : "Edit Template Pesan"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Buat pesan cepat yang dapat langsung disisipkan ke kotak chat WhatsApp CRM.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Judul Template */}
            <div className="space-y-1.5">
              <Label htmlFor="template-title" className="text-xs font-semibold text-stone-700">
                Judul Template <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="template-title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Contoh: Format Pemesanan, Salam Pembuka, Info Rekening"
                required
                className="text-xs"
              />
            </div>

            {/* Kategori & Shortcut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="template-cat" className="text-xs font-semibold text-stone-700">
                  Kategori
                </Label>
                <Input
                  id="template-cat"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Salam, Pemesanan, Katalog..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="template-shortcut" className="text-xs font-semibold text-stone-700">
                  Shortcut Cepat (Opsional)
                </Label>
                <Input
                  id="template-shortcut"
                  value={formData.shortcut}
                  onChange={(e) => setFormData((p) => ({ ...p, shortcut: e.target.value }))}
                  placeholder="Contoh: /salam, /format"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Isi Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-content" className="text-xs font-semibold text-stone-700">
                  Isi Pesan Template <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-stone-400 font-mono">
                  {formData.content.length} karakter
                </span>
              </div>
              <Textarea
                id="template-content"
                value={formData.content}
                onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                placeholder="Ketik isi pesan WhatsApp di sini..."
                rows={5}
                required
                className="text-xs leading-relaxed"
              />
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
                    <span>{dialogMode === "create" ? "Buat Template" : "Simpan Perubahan"}</span>
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
              <span>Hapus Template Pesan?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 pt-1">
              Apakah Anda yakin ingin menghapus template pesan{" "}
              <strong className="text-stone-800">&quot;{deleteTarget?.title}&quot;</strong>?
              Tindakan ini tidak dapat dibatalkan.
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
                  <span>Ya, Hapus Template</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
