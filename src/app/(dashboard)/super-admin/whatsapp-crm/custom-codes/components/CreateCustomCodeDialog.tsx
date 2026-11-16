"use client";

import { Button } from "@/components/ui/button";
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
import { useApi } from "@/hooks/useApi";
import { Copy, Link2, Loader2, Sparkles, UserCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface CreateCustomCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCustomCodeDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomCodeDialogProps) {
  const { fetchApi } = useApi();

  const [codeType, setCodeType] = useState<"LEAD_SOURCE" | "CS_AGENT_CODE">("LEAD_SOURCE");
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [waPhoneNumber, setWaPhoneNumber] = useState("6281234567890"); // Nomor official WA bisnis
  const [customText, setCustomText] = useState("Halo Goenakan, saya ingin konsultasi pesanan custom");

  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto uppercase & dash normalize
  const normalizedCode = code.toUpperCase().replace(/\s+/g, "-");

  // Generate WA click to chat preview URL
  const generatedWaUrl = React.useMemo(() => {
    if (codeType !== "LEAD_SOURCE" || !normalizedCode) return "";
    const cleanPhone = waPhoneNumber.replace(/\D/g, "");
    const fullText = `${customText.trim()} [REF:${normalizedCode}]`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;
  }, [codeType, normalizedCode, waPhoneNumber, customText]);

  useEffect(() => {
    if (open && codeType === "CS_AGENT_CODE" && users.length === 0) {
      const fetchUsers = async () => {
        try {
          setIsLoadingUsers(true);
          const res = await fetchApi("/users");
          if (!res.ok) return;
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || [];
          setUsers(list);
        } catch {
          // ignore
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [open, codeType, users.length, fetchApi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedCode || !label.trim()) {
      toast.error("Kode dan Label wajib diisi");
      return;
    }

    if (codeType === "CS_AGENT_CODE" && !assignedUserId) {
      toast.error("Silakan pilih CS yang ditautkan untuk kode ini");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi("/crm/custom-codes", {
        method: "POST",
        body: JSON.stringify({
          code: normalizedCode,
          label: label.trim(),
          type: codeType,
          leadUrlRef: codeType === "LEAD_SOURCE" ? generatedWaUrl : null,
          assignedUserId: codeType === "CS_AGENT_CODE" ? assignedUserId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal membuat kode kustom");
      }

      toast.success(data.message || "Kode kustom berhasil didaftarkan");
      setCode("");
      setLabel("");
      setAssignedUserId("");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tautan WhatsApp berhasil disalin ke clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Tambah Master Kode Kustom</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Pilih tipe kode untuk pelacakan kampanye prospek client (Opsi A) atau kode akses CS (Opsi B).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {/* Tipe Kode */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipe Kode</Label>
              <Select
                value={codeType}
                onValueChange={(val: any) => setCodeType(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih tipe kode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD_SOURCE" className="text-xs">
                    🎯 Opsi A: Tracking Prospek Client (Web / Iklan / Katalog)
                  </SelectItem>
                  <SelectItem value="CS_AGENT_CODE" className="text-xs">
                    🛡️ Opsi B: Kode Identitas CS (Akses & Proteksi Kunci Chat)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kode Unik */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Kode Unik ({codeType === "LEAD_SOURCE" ? "Contoh: WEB-KATALOG-POLO" : "Contoh: CS-01-SARAH"})
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={codeType === "LEAD_SOURCE" ? "WEB-PROMO-2026" : "CS-01-BUDI"}
                className="h-9 text-xs uppercase font-mono"
                required
              />
            </div>

            {/* Label Deskriptif */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Label Deskripsi</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={codeType === "LEAD_SOURCE" ? "Tombol WhatsApp di Halaman Detail Polo Shirt" : "CS Retail Wilayah Barat - Budi"}
                className="h-9 text-xs"
                required
              />
            </div>

            {/* OPSI A Fields: Click to Chat Generator */}
            {codeType === "LEAD_SOURCE" && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
                <div className="flex items-center gap-1.5 text-stone-700 font-semibold text-xs">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  <span>Generator Tautan WhatsApp Otomatis (Click-to-Chat)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-stone-500">Nomor WA Tujuan</Label>
                    <Input
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      placeholder="6281234567890"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-stone-500">Draft Pesan Pelanggan</Label>
                    <Input
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Halo Goenakan..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {generatedWaUrl && (
                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] text-stone-500">Hasil Tautan (Pasang di Tombol Website Client):</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={generatedWaUrl}
                        className="h-8 text-[11px] font-mono bg-white text-stone-600 select-all"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedWaUrl)}
                        className="h-8 px-2.5 shrink-0 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OPSI B Fields: CS User Mapping */}
            {codeType === "CS_AGENT_CODE" && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-stone-700 font-semibold text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kaitkan ke Akun User CS</span>
                </div>
                <Select
                  value={assignedUserId}
                  onValueChange={setAssignedUserId}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder={isLoadingUsers ? "Memuat daftar user..." : "Pilih akun user CS"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.name || "Tanpa Nama"} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-stone-400">
                  Kode ini akan menjadi identitas resmi CS saat mengambil antrean dan membuka chat terkunci di Tahap 2.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kode</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
