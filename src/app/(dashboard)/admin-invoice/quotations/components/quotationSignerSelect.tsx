"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";

type SignerUser = {
  id: string;
  name: string | null;
  email: string;
  signatureUrl?: string | null;
  role?: {
    name: string;
  } | null;
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  mode: "create" | "edit";
  currentSignerName?: string | null;
};

const DEFAULT_OPTION = "__DEFAULT_SIGNER__";

export default function QuotationSignerSelect({
  value,
  onChange,
  mode,
  currentSignerName,
}: Props) {
  const { data: session } = useSession();
  const { fetchApi, status } = useApi();

  const [users, setUsers] = useState<SignerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isSuperAdmin || status !== "authenticated") {
      return;
    }

    let cancelled = false;

    const fetchSigners = async () => {
      try {
        setLoading(true);
        setLoadError(false);

        const res = await fetchApi("/users");

        if (!res.ok) {
          throw new Error("Gagal mengambil daftar penandatangan.");
        }

        const response = await res.json();

        const list: SignerUser[] = Array.isArray(response)
          ? response
          : Array.isArray(response.data)
            ? response.data
            : [];

        const eligibleUsers = list
          .filter((user) =>
            ["ADMIN_SALES", "SUPER_ADMIN"].includes(user.role?.name ?? ""),
          )
          .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

        if (!cancelled) {
          setUsers(eligibleUsers);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setLoadError(true);
          toast.error("Gagal memuat daftar Admin Sales.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchSigners();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, status, fetchApi]);

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-700">
          Penandatangan Otomatis
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Tanda tangan mengikuti akun pembuat. Hanya Super Admin yang dapat
          menggantinya.
        </p>
      </div>
    );
  }

  const selectedValue = value || DEFAULT_OPTION;

  const currentUserIsMissing =
    Boolean(value) && !users.some((user) => user.id === value);

  const selectedSigner = users.find((user) => user.id === value);

  return (
    <div className="space-y-2">
      <Select
        value={selectedValue}
        onValueChange={(next) => {
          onChange(next === DEFAULT_OPTION ? "" : next);
        }}
        disabled={loading || loadError}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue
            placeholder={
              loading ? "Memuat penandatangan..." : "Pilih penandatangan"
            }
          />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={DEFAULT_OPTION}>
            {mode === "create"
              ? "Otomatis: akun saya"
              : "Tidak mengubah penandatangan"}
          </SelectItem>

          {currentUserIsMissing && (
            <SelectItem value={value!}>
              {currentSignerName || "Penandatangan tersimpan"}
            </SelectItem>
          )}

          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name || user.email}
              {" — "}
              {user.role?.name === "SUPER_ADMIN"
                ? "Super Admin"
                : "Admin Sales"}
              {!user.signatureUrl ? " (Belum ada TTD)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSigner && (
        <div className="rounded-md border bg-slate-50 p-3 space-y-2">
          <div>
            <p className="text-sm font-semibold">{selectedSigner.name}</p>
            <p className="text-xs text-slate-500">{selectedSigner.email}</p>
          </div>

          {selectedSigner.signatureUrl ? (
            <img
              src={selectedSigner.signatureUrl}
              alt={`Tanda tangan ${selectedSigner.name}`}
              className="max-h-20 max-w-48 object-contain"
            />
          ) : (
            <p className="text-xs text-amber-600">
              User belum mengunggah tanda tangan.
            </p>
          )}
        </div>
      )}

      {loadError && (
        <p className="text-xs text-red-600">
          Daftar penandatangan gagal dimuat. Periksa akses API dan coba buka
          ulang form.
        </p>
      )}

      <p className="text-xs text-slate-500">
        {mode === "create"
          ? "Jika tidak dipilih, dokumen ditandatangani oleh akun yang sedang login."
          : "Mengganti penandatangan akan memperbarui snapshot tanda tangan pada quotation ini."}
      </p>
    </div>
  );
}
