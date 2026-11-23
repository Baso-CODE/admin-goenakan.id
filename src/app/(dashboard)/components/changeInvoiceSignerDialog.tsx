"use client";

import { Loader2, PenLine } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type SignerUser = {
  id: string;
  name: string | null;
  email: string;
  signatureUrl: string | null;
  role: {
    name: string;
  };
};

type Props = {
  invoiceId: number;
  currentSignerUserId?: string | null;
  currentSignerName?: string | null;
  invoiceStatus: string;
  onSaved: () => Promise<void> | void;
};

export default function ChangeInvoiceSignerDialog({
  invoiceId,
  currentSignerUserId,
  currentSignerName,
  invoiceStatus,
  onSaved,
}: Props) {
  const { data: session } = useSession();
  const { fetchApi, status } = useApi();

  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<SignerUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!open || !isSuperAdmin || status !== "authenticated") {
      return;
    }

    let cancelled = false;

    setSelectedUserId("");
    setReason("");
    setUsers([]);

    const loadUsers = async () => {
      try {
        setLoading(true);

        const res = await fetchApi("/users");

        const result = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            result?.message || "Gagal memuat daftar Admin Sales.",
          );
        }

        const list: SignerUser[] = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        const allowed = list.filter((user) =>
          ["ADMIN_SALES", "SUPER_ADMIN"].includes(user.role?.name ?? ""),
        );

        if (!cancelled) {
          setUsers(allowed);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          toast.error("Gagal memuat daftar penandatangan.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, isSuperAdmin, status, fetchApi]);

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const canSave =
    !saving &&
    !loading &&
    selectedUserId.length > 0 &&
    selectedUserId !== currentSignerUserId &&
    Boolean(selectedUser?.signatureUrl) &&
    reason.trim().length >= 10 &&
    reason.trim().length <= 500;

  const handleSave = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      const res = await fetchApi(`/invoices/${invoiceId}/signer`, {
        method: "PATCH",
        body: JSON.stringify({
          signerUserId: selectedUserId,
          reason: reason.trim(),
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          result?.message || "Gagal mengganti penandatangan Invoice.",
        );
      }

      await onSaved();

      toast.success("Penandatangan Invoice berhasil diganti.");

      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan perubahan.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={invoiceStatus === "CANCELLED"}>
          <PenLine className="mr-2 h-4 w-4" />
          Ganti Penandatangan
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ganti Penandatangan Invoice</DialogTitle>

          <DialogDescription>
            Ubah nama dan tanda tangan yang tercetak pada Invoice ini. Identitas
            pembuat tidak berubah.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">
              Penandatangan Saat Ini
            </p>
            <p className="font-semibold">
              {currentSignerName || "Belum ditentukan"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Penandatangan Baru</Label>

            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loading || saving}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? "Memuat Admin Sales..." : "Pilih Admin Sales"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {users.map((user) => (
                  <SelectItem
                    key={user.id}
                    value={user.id}
                    disabled={
                      !user.signatureUrl || user.id === currentSignerUserId
                    }>
                    {user.name || user.email}
                    {" — "}
                    {user.role.name === "SUPER_ADMIN"
                      ? "Super Admin"
                      : "Admin Sales"}
                    {!user.signatureUrl ? " (Belum ada TTD)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs text-muted-foreground">
                Preview Tanda Tangan Baru
              </p>

              {selectedUser.signatureUrl ? (
                <img
                  src={selectedUser.signatureUrl}
                  alt={`Tanda tangan ${selectedUser.name}`}
                  className="h-24 w-full object-contain"
                />
              ) : (
                <p className="text-sm text-amber-600">
                  User belum memiliki tanda tangan.
                </p>
              )}

              <p className="mt-2 text-center text-sm font-semibold">
                {selectedUser.name}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Alasan Penggantian</Label>

            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Contoh: Penandatangan dialihkan kepada Sales B sesuai penanggung jawab client."
              maxLength={500}
              rows={3}
              disabled={saving}
            />

            <p className="text-xs text-muted-foreground">
              Minimal 10 karakter. Alasan disimpan pada histori perubahan
              Invoice.
            </p>
          </div>

          {["PAID", "UNPAID", "OVERDUE"].includes(invoiceStatus) && (
            <p className="text-xs text-amber-700">
              Invoice ini mungkin sudah diterbitkan. Pastikan perubahan telah
              disetujui dan client menerima revisi yang benar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}>
            Batal
          </Button>

          <Button onClick={handleSave} disabled={!canSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan Penandatangan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
