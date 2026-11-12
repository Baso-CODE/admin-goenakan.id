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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { WaSession, WaTemplate } from "@/types/waPortal.type";
import {
  AlertCircle,
  Check,
  Copy,
  Edit2,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface WaTemplateManagerProps {
  sessions?: WaSession[];
  activeSessionId?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SOP: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  BILLING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SHIPPING: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  GENERAL: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" },
};

const COMMON_VARIABLES = [
  { tag: "{{nama_klien}}", label: "Nama Klien" },
  { tag: "{{no_pesanan}}", label: "No Pesanan" },
  { tag: "{{nama_produk}}", label: "Nama Produk" },
  { tag: "{{tahap}}", label: "Tahap / Event" },
  { tag: "{{status}}", label: "Status" },
  { tag: "{{catatan}}", label: "Catatan" },
  { tag: "{{estimasi}}", label: "Estimasi Waktu" },
  { tag: "{{total_amount}}", label: "Total Biaya" },
  { tag: "{{no_resi}}", label: "No Resi" },
  { tag: "{{kurir}}", label: "Kurir" },
  { tag: "{{link_invoice}}", label: "Link Invoice" },
];

export function WaTemplateManager({ sessions = [], activeSessionId = "" }: WaTemplateManagerProps) {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create / Edit Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WaTemplate | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("SOP");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Test Send Dialog State
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<WaTemplate | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testMediaUrl, setTestMediaUrl] = useState("");
  const [testMediaFilename, setTestMediaFilename] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Delete Confirm State
  const [deletingTemplate, setDeletingTemplate] = useState<WaTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch templates list
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/wa/templates");
      if (!res.ok) {
        toast.error("Gagal memuat daftar template notifikasi");
        return;
      }
      const data = await res.json();
      const items: WaTemplate[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setTemplates(items);
    } catch {
      toast.error("Gagal terhubung ke WhatsApp API");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "ALL" ||
        tpl.category.toUpperCase() === selectedCategory.toUpperCase();
      return matchSearch && matchCat;
    });
  }, [templates, searchQuery, selectedCategory]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormCode("");
    setFormName("");
    setFormCategory("SOP");
    setFormDescription("");
    setFormContent(
      "Halo {{nama_klien}},\n\nUpdate pesanan *{{no_pesanan}}* ({{nama_produk}}):\n*Tahap:* {{tahap}}\n*Catatan:* {{catatan}}\n*Estimasi:* {{estimasi}}\n\nTerima kasih telah mempercayakan goenakan.id!"
    );
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (tpl: WaTemplate) => {
    setEditingTemplate(tpl);
    setFormCode(tpl.code);
    setFormName(tpl.name);
    setFormCategory(tpl.category || "GENERAL");
    setFormDescription(tpl.description || "");
    setFormContent(tpl.content);
    setFormIsActive(tpl.isActive);
    setIsFormOpen(true);
  };

  // Insert variable tag into textarea at cursor position
  const handleInsertVariable = (tag: string) => {
    if (!textareaRef.current) {
      setFormContent((prev) => prev + " " + tag);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = formContent;
    const next = current.substring(0, start) + tag + current.substring(end);
    setFormContent(next);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Save template (Create or Update)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      toast.error("Kode template wajib diisi (huruf kapital dan underscore)");
      return;
    }
    if (!formName.trim()) {
      toast.error("Nama template wajib diisi");
      return;
    }
    if (!formContent.trim()) {
      toast.error("Isi konten template tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      const isEdit = !!editingTemplate;
      const url = isEdit ? `/api/wa/templates/${editingTemplate.id}` : "/api/wa/templates";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory.toUpperCase(),
        description: formDescription.trim() || undefined,
        content: formContent.trim(),
        isActive: formIsActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Gagal menyimpan template");
      }

      toast.success(
        isEdit ? `Template "${formName}" berhasil diperbarui` : `Template "${formName}" berhasil dibuat`
      );
      setIsFormOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (tpl: WaTemplate, nextActive: boolean) => {
    // Optimistic UI update
    setTemplates((prev) =>
      prev.map((t) => (t.id === tpl.id ? { ...t, isActive: nextActive } : t))
    );

    try {
      const res = await fetch(`/api/wa/templates/${tpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        throw new Error("Gagal mengubah status aktif template");
      }
      toast.success(
        nextActive
          ? `Template "${tpl.name}" diaktifkan`
          : `Template "${tpl.name}" dinonaktifkan`
      );
    } catch (err: any) {
      // Revert optimistic update
      setTemplates((prev) =>
        prev.map((t) => (t.id === tpl.id ? { ...t, isActive: !nextActive } : t))
      );
      toast.error(err.message || "Gagal mengubah status template");
    }
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/wa/templates/${deletingTemplate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Gagal menghapus template");
      }
      toast.success(`Template "${deletingTemplate.name}" berhasil dihapus`);
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus template");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Test Send Dialog
  const handleOpenTest = (tpl: WaTemplate) => {
    setTestTemplate(tpl);
    setTestTo("");
    setTestMediaUrl("");
    setTestMediaFilename("");

    // Extract variables from template
    const matches = tpl.content.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    const initialVars: Record<string, string> = {};
    matches.forEach((m) => {
      const key = m.replace(/[\{\}\s]/g, "");
      if (!initialVars[key]) {
        // provide sensible default preview values
        if (key === "nama_klien") initialVars[key] = "Budi Santoso";
        else if (key === "no_pesanan") initialVars[key] = "ORD-2026-001";
        else if (key === "nama_produk") initialVars[key] = "Polo Shirt Custom Bordir";
        else if (key === "tahap") initialVars[key] = "Sablon Selesai & Lolos QC";
        else if (key === "status") initialVars[key] = "Diproses";
        else if (key === "catatan") initialVars[key] = "Sedang tahap packing rapi";
        else if (key === "estimasi") initialVars[key] = "Besok jam 14:00";
        else if (key === "total_amount") initialVars[key] = "Rp 1.500.000";
        else if (key === "no_resi") initialVars[key] = "SPX123456789";
        else if (key === "kurir") initialVars[key] = "J&T Cargo";
        else if (key === "link_invoice") initialVars[key] = "https://goenakan.id/inv/123";
        else initialVars[key] = `Contoh ${key}`;
      }
    });

    setTestVariables(initialVars);
    setIsTestOpen(true);
  };

  // Execute Test Send
  const handleExecuteTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTemplate) return;
    if (!testTo.trim()) {
      toast.error("Nomor tujuan WhatsApp wajib diisi (contoh: 08123456789)");
      return;
    }

    try {
      setIsTesting(true);
      const res = await fetch("/api/wa/templates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testTo.trim(),
          templateCode: testTemplate.code,
          variables: testVariables,
          mediaUrl: testMediaUrl.trim() || undefined,
          mediaFilename: testMediaFilename.trim() || undefined,
          sessionId: activeSessionId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Gagal mengirim pesan uji coba");
      }

      toast.success(
        `Notifikasi berhasil diantrikan ke antrean anti-ban! (ID: ${data.data?.id || "OK"})`
      );
      setIsTestOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim pesan uji coba");
    } finally {
      setIsTesting(false);
    }
  };

  // Copy code to clipboard helper
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info(`Kode template "${code}" disalin ke clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Real-time extracted variables from current editor content
  const detectedVariables = useMemo(() => {
    const matches = formContent.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    const keys = matches.map((m) => m.replace(/[\{\}\s]/g, ""));
    return Array.from(new Set(keys));
  }, [formContent]);

  // Live rendered preview for Edit Dialog (with friendly fallbacks for custom user tags)
  const renderedEditPreview = useMemo(() => {
    let text = formContent;
    text = text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
      const sampleMap: Record<string, string> = {
        nama_klien: "Budi Santoso",
        no_pesanan: "ORD-2026-001",
        nama_produk: "Polo Bordir Custom",
        tahap: "Sablon Selesai & Lolos QC",
        status: "Diproses",
        catatan: "Sedang proses QC akhir",
        estimasi: "Besok jam 14:00",
        total_amount: "Rp 1.500.000",
        total_tagihan: "Rp 2.750.000",
        no_resi: "SPX123456789",
        kurir: "J&T Express",
        link_invoice: "https://goenakan.id/inv/123",
        alamat_tujuan: "Jl. Sudirman No. 45, Jakarta",
        jatuh_tempo: "15 November 2026",
      };
      if (sampleMap[key]) return sampleMap[key];
      // Friendly readable fallback for custom user tags
      const readable = key.replace(/_/g, " ");
      return `[${readable}]`;
    });
    return text;
  }, [formContent]);

  // Live rendered preview for Test Send Dialog
  const renderedTestPreview = useMemo(() => {
    if (!testTemplate) return "";
    let text = testTemplate.content;
    text = text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => {
      return testVariables[key] ?? `[${key}]`;
    });
    return text;
  }, [testTemplate, testVariables]);

  return (
    <div className="space-y-6">
      {/* ── Control Header ── */}
      <Card className="border-stone-200/80 shadow-2xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Template Notifikasi & Otomasi
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 mt-1">
                Kamus template pesan dinamis untuk notifikasi otomatis SOP, billing, dan logistik.
                Tersedia untuk dipanggil melalui API kapan saja oleh modul manapun.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTemplates}
                disabled={isLoading}
                className="text-xs h-9 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Muat Ulang
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Template
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 pt-3 border-t border-stone-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
              <Input
                placeholder="Cari kode, nama, atau isi template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {["ALL", "SOP", "BILLING", "SHIPPING", "GENERAL"].map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] h-7 px-2.5 rounded-full ${
                    selectedCategory === cat
                      ? "bg-stone-900 text-white hover:bg-stone-800"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {cat === "ALL" ? "Semua Kategori" : cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading && templates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              Memuat daftar template...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
              Tidak ada template yang cocok dengan filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200/80">
              <Table>
                <TableHeader className="bg-stone-50/70">
                  <TableRow>
                    <TableHead className="text-xs font-semibold w-[160px]">Kode Template</TableHead>
                    <TableHead className="text-xs font-semibold w-[180px]">Nama & Kategori</TableHead>
                    <TableHead className="text-xs font-semibold">Format Pesan</TableHead>
                    <TableHead className="text-xs font-semibold text-center w-[100px]">Aktif</TableHead>
                    <TableHead className="text-xs font-semibold text-right w-[160px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((tpl) => {
                    const catStyle =
                      CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.GENERAL;
                    return (
                      <TableRow key={tpl.id} className="hover:bg-stone-50/50">
                        {/* Code Column */}
                        <TableCell className="align-top font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                              {tpl.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyCode(tpl.code)}
                              title="Salin kode"
                              className="text-stone-400 hover:text-stone-700 transition"
                            >
                              {copiedCode === tpl.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* Name & Category Column */}
                        <TableCell className="align-top">
                          <div className="font-medium text-xs text-stone-900">{tpl.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {tpl.category}
                            </span>
                          </div>
                          {tpl.description && (
                            <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                              {tpl.description}
                            </p>
                          )}
                        </TableCell>

                        {/* Content Column */}
                        <TableCell className="align-top">
                          <div className="bg-stone-50/90 p-2.5 rounded-md border border-stone-200/60 font-sans text-xs text-stone-700 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                            {tpl.content}
                          </div>
                          {(() => {
                            const tags = (tpl.content.match(/\{\{\s*(\w+)\s*\}\}/g) || []).map((m) =>
                              m.replace(/[\{\}\s]/g, "")
                            );
                            const uniqueTags = Array.from(new Set(tags));
                            if (uniqueTags.length === 0) return null;
                            return (
                              <div className="flex flex-wrap items-center gap-1 mt-2">
                                <span className="text-[10px] font-semibold text-stone-400">Variabel:</span>
                                {uniqueTags.map((v) => (
                                  <span
                                    key={v}
                                    className="text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200/80 px-1.5 py-0.5 rounded font-medium"
                                  >
                                    {`{{${v}}}`}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </TableCell>

                        {/* Is Active Switch */}
                        <TableCell className="align-middle text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={tpl.isActive}
                              onCheckedChange={(checked) => handleToggleActive(tpl, checked)}
                            />
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              title="Uji Coba Kirim"
                              onClick={() => handleOpenTest(tpl)}
                              disabled={!tpl.isActive}
                              className="h-8 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                            >
                              <Play className="w-3.5 h-3.5 mr-1 fill-emerald-600 text-emerald-600" />
                              Uji
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit"
                              onClick={() => handleOpenEdit(tpl)}
                              className="h-8 w-8 p-0 text-stone-600 hover:text-stone-900"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Hapus"
                              onClick={() => setDeletingTemplate(tpl)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* ── Modal: Buat / Edit Template ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "Buat Template Notifikasi Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Gunakan tag placeholder seperti <code className="text-emerald-700 font-mono">{"{{nama_klien}}"}</code> untuk menyisipkan variabel dinamis saat pesan dikirim.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTemplate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Kode Unik Template (UPPERCASE)*</Label>
                <Input
                  placeholder="CONTOH: SOP_PROGRESS_UPDATE"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  required
                  className="font-mono text-xs uppercase"
                />
                <span className="text-[10px] text-stone-400">
                  Kode ini dipakai sebagai pengenal saat memanggil API.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Nama Template*</Label>
                <Input
                  placeholder="Contoh: Notifikasi Progres SOP Sablon"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Kategori</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOP" className="text-xs">SOP & Produksi (SOP)</SelectItem>
                    <SelectItem value="BILLING" className="text-xs">Tagihan & Invoice (BILLING)</SelectItem>
                    <SelectItem value="SHIPPING" className="text-xs">Pengiriman & Logistik (SHIPPING)</SelectItem>
                    <SelectItem value="GENERAL" className="text-xs">Umum & Marketing (GENERAL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Keterangan / Tujuan</Label>
                <Input
                  placeholder="Keterangan singkat kapan template ini dipakai"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Variable Toolbar Helper */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">
                  Pilihan Tag Cepat:
                </Label>
                <span className="text-[10px] text-stone-400">
                  Format: {"{{nama_tag}}"} (Bebas ketik tag kustom apa saja di dalam pesan)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="text-[11px] font-mono bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-2 py-0.5 transition cursor-pointer"
                    title={`Sisipkan ${v.label}`}
                  >
                    + {v.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">Isi Pesan WhatsApp*</Label>
              <Textarea
                ref={textareaRef}
                rows={6}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Tulis format pesan di sini..."
                required
                className="font-sans text-xs leading-relaxed"
              />

              {/* Real-time Detected Active Tags */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-stone-400">
                    Variabel Aktif ({detectedVariables.length}):
                  </span>
                  {detectedVariables.length === 0 ? (
                    <span className="text-[10px] text-stone-400 italic">Belum ada tag</span>
                  ) : (
                    detectedVariables.map((v) => (
                      <span
                        key={v}
                        className="text-[10px] font-mono bg-stone-100 text-stone-800 border border-stone-200 px-1.5 py-0.5 rounded font-medium"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))
                  )}
                </div>
                <span className="text-[10px] text-stone-400 shrink-0">
                  Mendukung format: *tebal*, _miring_, ~coret~
                </span>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-stone-700">Live Preview (Tampilan WhatsApp)</Label>
              <div className="bg-[#efeae2] p-4 rounded-lg border border-stone-200">
                <div className="bg-[#dcf8c6] max-w-md ml-auto rounded-lg rounded-tr-none p-3 shadow-xs text-xs text-stone-900 leading-relaxed whitespace-pre-wrap font-sans border border-[#c1e7a5]">
                  {renderedEditPreview || <span className="text-stone-400 italic">Pesan kosong</span>}
                  <div className="text-[9px] text-stone-500 text-right mt-1.5">14:02 ✓✓</div>
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-stone-800">Status Aktif</Label>
                <p className="text-[11px] text-stone-500">
                  Jika dimatikan, permintaan kirim untuk kode ini akan ditolak API dengan aman.
                </p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>

            <DialogFooter className="pt-4 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingTemplate ? "Simpan Perubahan" : "Buat Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Uji Coba Kirim Notifikasi ── */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Uji Coba Kirim: {testTemplate?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Kirimkan pesan uji coba langsung ke nomor WhatsApp Anda untuk memverifikasi tata letak dan penggantian variabel.
            </DialogDescription>
          </DialogHeader>

          {testTemplate && (
            <form onSubmit={handleExecuteTest} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Nomor WhatsApp Tujuan*</Label>
                <Input
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              {/* Dynamic Variable Inputs */}
              {Object.keys(testVariables).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <Label className="text-xs font-semibold text-stone-700">
                    Nilai Variabel untuk Uji Coba:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-stone-50 p-3 rounded-lg border border-stone-200/70">
                    {Object.keys(testVariables).map((key) => (
                      <div key={key} className="space-y-1">
                        <span className="text-[10px] font-mono font-medium text-stone-600">
                          {`{{${key}}}`}
                        </span>
                        <Input
                          value={testVariables[key] || ""}
                          onChange={(e) =>
                            setTestVariables((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-600">Media URL Uji Coba (Opsional)</Label>
                  <Input
                    placeholder="https://.../foto.png"
                    value={testMediaUrl}
                    onChange={(e) => setTestMediaUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-600">Nama File (Opsional)</Label>
                  <Input
                    placeholder="progres-sablon.png"
                    value={testMediaFilename}
                    onChange={(e) => setTestMediaFilename(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Rendered Live Preview */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold text-stone-700">Tampilan Akhir yang Akan Terkirim</Label>
                <div className="bg-[#efeae2] p-4 rounded-lg border border-stone-200">
                  <div className="bg-[#dcf8c6] max-w-md ml-auto rounded-lg rounded-tr-none p-3 shadow-xs text-xs text-stone-900 leading-relaxed whitespace-pre-wrap font-sans border border-[#c1e7a5]">
                    {renderedTestPreview}
                    <div className="text-[9px] text-stone-500 text-right mt-1.5">Sekarang ✓✓</div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTestOpen(false)}
                  disabled={isTesting}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isTesting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                >
                  {isTesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Kirim Uji Coba Sekarang
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Konfirmasi Hapus ── */}
      <Dialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-red-600">
              Hapus Template Notifikasi?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600 pt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus template{" "}
              <strong>&ldquo;{deletingTemplate?.name}&rdquo;</strong> (<code>{deletingTemplate?.code}</code>)?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingTemplate(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Hapus Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
