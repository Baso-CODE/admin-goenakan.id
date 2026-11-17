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
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import {
  CheckCheck,
  Copy,
  Edit3,
  Link2,
  Loader2,
  MessageSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomCodeItem, MEDIA_CHANNELS } from "../types/customCode.type";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface EditCustomCodeDialogProps {
  item: CustomCodeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCustomCodeDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: EditCustomCodeDialogProps) {
  const { fetchApi } = useApi();

  const [label, setLabel] = useState("");
  const [channel, setChannel] = useState<string>("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [waPhoneNumber, setWaPhoneNumber] = useState("6282387902238");
  const [customText, setCustomText] = useState(
    "Halo Goenakan, saya ingin konsultasi pesanan custom.\nBisa tolong kirimkan katalog dan pricelist terbarunya?"
  );

  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse existing item data whenever item changes or dialog opens
  useEffect(() => {
    if (item && open) {
      setLabel(item.label || "");
      setChannel(item.channel || "Website / Katalog");
      setAssignedUserId(item.assignedUserId || "");

      if (item.leadUrlRef) {
        try {
          const url = new URL(item.leadUrlRef);
          const phone = url.pathname.replace(/^\//, "");
          if (phone) setWaPhoneNumber(phone);
          const textParam = url.searchParams.get("text") || "";
          // Strip [REF:XXX]
          const cleanedText = textParam.replace(/\s*\[REF:[^\]]+\]\s*$/i, "").trim();
          if (cleanedText) setCustomText(cleanedText);
        } catch {
          // If URL parsing fails, keep defaults
        }
      }
    }
  }, [item, open]);

  // Load CS Users if item is CS_AGENT_CODE
  useEffect(() => {
    if (open && item?.type === "CS_AGENT_CODE" && users.length === 0) {
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
  }, [open, item?.type, users.length, fetchApi]);

  // Generate WA click-to-chat preview URL
  const generatedWaUrl = React.useMemo(() => {
    if (!item || item.type !== "LEAD_SOURCE") return "";
    const cleanPhone = waPhoneNumber.replace(/\D/g, "");
    const fullText = `${customText.trim()} [REF:${item.code}]`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;
  }, [item, waPhoneNumber, customText]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tautan WhatsApp berhasil disalin!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!label.trim()) {
      toast.error("Label deskripsi wajib diisi");
      return;
    }

    if (item.type === "CS_AGENT_CODE" && !assignedUserId) {
      toast.error("Silakan pilih akun user CS");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi(`/crm/custom-codes/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          label: label.trim(),
          channel: item.type === "LEAD_SOURCE" ? channel : null,
          leadUrlRef: item.type === "LEAD_SOURCE" ? generatedWaUrl : null,
          assignedUserId: item.type === "CS_AGENT_CODE" ? assignedUserId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui master kode");
      }

      toast.success("Master kode berhasil diperbarui");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-stone-900">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              <span>Edit Master Kode</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Perbarui konfigurasi label, saluran media, draf pesan WhatsApp, atau penugasan akun CS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {/* Kode Unik (Read Only) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-600">Kode Unik (Permanen)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={item.code}
                  readOnly
                  disabled
                  className="h-9 text-xs font-mono font-bold bg-stone-100 text-stone-800 cursor-not-allowed select-all"
                />
                <span className="text-[11px] text-stone-400 shrink-0">
                  {item.type === "LEAD_SOURCE" ? "Tracking Client" : "Kode CS"}
                </span>
              </div>
            </div>

            {/* Label Deskripsi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Label Deskripsi</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Contoh: Tombol WhatsApp Detail Polo Shirt"
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Saluran Media (Only for LEAD_SOURCE) */}
            {item.type === "LEAD_SOURCE" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Saluran Media / Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Pilih saluran penempatan kode" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value} className="text-xs">
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Form Fields: Click-to-Chat Generator & Multiline Message Template (LEAD_SOURCE) */}
            {item.type === "LEAD_SOURCE" && (
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-3.5">
                <div className="flex items-center gap-1.5 text-stone-800 font-semibold text-xs border-b border-stone-200/80 pb-2">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  <span>Generator Tautan WhatsApp & Template Pesan</span>
                </div>

                {/* Nomor WA Bisnis Tujuan */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Nomor WhatsApp Bisnis Tujuan</Label>
                  <Input
                    value={waPhoneNumber}
                    onChange={(e) => setWaPhoneNumber(e.target.value)}
                    placeholder="6282387902238"
                    className="h-8 text-xs font-mono bg-white"
                  />
                  <p className="text-[10px] text-stone-400">
                    Nomor WhatsApp resmi yang akan menerima pesan dari tautan ini.
                  </p>
                </div>

                {/* Template Pesan Pelanggan (Wider Textarea) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-stone-700">
                      Draft Pesan Pelanggan (Dapat Multi-Baris)
                    </Label>
                    <span className="text-[10px] text-stone-400">Mendukung Enter / Baris Baru</span>
                  </div>
                  <Textarea
                    rows={3}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Tulis draf pesan pembuka pelanggan..."
                    className="text-xs bg-white resize-y min-h-[75px] leading-relaxed"
                  />
                  <p className="text-[10px] text-stone-400">
                    Pesan ini otomatis terisi di chat WhatsApp pelanggan saat tombol diklik.
                  </p>
                </div>

                {/* Live WhatsApp Bubble Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pratinjau Pesan di Aplikasi WhatsApp:</span>
                  </div>
                  <div className="bg-[#EFEAE2] p-3 rounded-lg border border-stone-200/90 shadow-2xs">
                    <div className="bg-white rounded-lg p-2.5 max-w-[85%] ml-auto text-xs text-stone-800 shadow-2xs border border-stone-200/60 space-y-1.5">
                      <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-stone-800">
                        {customText.trim() || "Halo Goenakan..."}
                      </p>
                      <div className="pt-0.5 border-t border-stone-100 flex items-center justify-between gap-2 text-[10px]">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          [REF:{item.code}]
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-stone-400 text-[9px]">
                          <span>12:00</span>
                          <CheckCheck className="w-3 h-3 text-sky-500" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resulting URL */}
                {generatedWaUrl && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold text-stone-700">
                      Hasil Tautan Click-to-Chat (Pasang di Website / Iklan):
                    </Label>
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
                        className="h-8 px-2.5 shrink-0 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Fields: CS User Mapping (CS_AGENT_CODE) */}
            {item.type === "CS_AGENT_CODE" && (
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-stone-800 font-semibold text-xs border-b border-stone-200/80 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kaitkan ke Akun User CS</span>
                </div>
                <Select
                  value={assignedUserId}
                  onValueChange={setAssignedUserId}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder={isLoadingUsers ? "Memuat user..." : "Pilih akun user CS"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.name || "Tanpa Nama"} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <span>Simpan Perubahan</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
