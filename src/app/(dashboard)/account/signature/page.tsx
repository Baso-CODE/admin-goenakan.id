"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileSignature,
  ImagePlus,
  Loader2,
  Save,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";

type SignatureProfile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  signatureUrl: string | null;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function MySignaturePage() {
  const { data: session, status: sessionStatus } = useSession();

  const { fetchApi } = useApi();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<SignatureProfile | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const role = session?.user?.role ?? "";

  const canManageSignature = role === "ADMIN_SALES" || role === "SUPER_ADMIN";

  // ==========================================
  // FETCH CURRENT SIGNATURE
  // ==========================================
  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      if (sessionStatus !== "loading") {
        setLoading(false);
      }
      return;
    }

    if (!canManageSignature) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSignature = async () => {
      try {
        setLoading(true);

        const response = await fetchApi("/users/me/signature");

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "Gagal mengambil data tanda tangan.",
          );
        }

        if (!cancelled) {
          setProfile(result.data ?? result);
        }
      } catch (error) {
        console.error("Load signature error:", error);

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat tanda tangan.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSignature();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, canManageSignature, fetchApi]);

  // ==========================================
  // IMAGE PREVIEW
  // ==========================================
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // ==========================================
  // FILE VALIDATION
  // ==========================================
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format harus PNG, JPG, atau WebP.");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran tanda tangan maksimal 2 MB.");

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // ==========================================
  // SAVE SIGNATURE
  // ==========================================
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageSignature || !selectedFile || saving) {
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("signature", selectedFile, selectedFile.name);

      const response = await fetchApi("/users/me/signature", {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Gagal menyimpan tanda tangan.");
      }

      const updated = result?.data ?? result;

      setProfile((current) =>
        current
          ? {
              ...current,
              signatureUrl: updated?.signatureUrl ?? current.signatureUrl,
            }
          : null,
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Tanda tangan berhasil disimpan!");
    } catch (error) {
      console.error("Save signature error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan tanda tangan.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!canManageSignature) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold">Akses Tidak Tersedia</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fitur ini hanya tersedia untuk Admin Sales dan Super Admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSignature = previewUrl || profile?.signatureUrl || null;

  const hasSavedSignature = Boolean(profile?.signatureUrl);

  return (
    <div className="mx-auto w-full space-y-6 py-6">
      {/* PAGE HEADER */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Tanda Tangan Saya
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola tanda tangan untuk Quotation dan Invoice Goenakan Indonesia.
          </p>
        </div>
      </div>

      {/* USER INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSignature className="h-5 w-5 text-blue-600" />
            Informasi Penandatangan
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Nama</p>
              <p className="font-semibold">
                {profile?.name || session?.user?.name || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">
                {profile?.email || session?.user?.email || "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{role.replaceAll("_", " ")}</Badge>

            {hasSavedSignature ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Tanda Tangan Tersimpan
              </Badge>
            ) : (
              <Badge variant="outline">Belum Ada Tanda Tangan</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SIGNATURE FORM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Tanda Tangan</CardTitle>

          <CardDescription>
            Gunakan gambar tanda tangan dengan latar transparan agar hasil PDF
            rapi.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* SIGNATURE PREVIEW */}
            <div className="rounded-xl border bg-slate-50 p-6">
              <p className="mb-4 text-sm font-semibold text-slate-700">
                Preview Tanda Tangan
              </p>

              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-5">
                {currentSignature ? (
                  <img
                    src={currentSignature}
                    alt="Preview tanda tangan"
                    className="max-h-36 max-w-full object-contain"
                  />
                ) : (
                  <>
                    <ImagePlus className="mb-3 h-10 w-10 text-slate-300" />

                    <p className="text-sm text-slate-500">
                      Belum ada tanda tangan
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="font-semibold text-slate-800">
                  {profile?.name || session?.user?.name || "Nama User"}
                </p>

                <p className="text-xs text-slate-500">Goenakan Indonesia</p>
              </div>
            </div>

            {/* FILE INPUT */}
            <div className="space-y-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                disabled={saving}
                className="cursor-pointer"
              />

              <p className="text-xs text-muted-foreground">
                Format PNG, JPG, atau WebP. Maksimal 2 MB. Disarankan PNG dengan
                latar belakang transparan.
              </p>

              {selectedFile && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-blue-800">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-blue-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => {
                      setSelectedFile(null);

                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}>
                    Batal
                  </Button>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Pilih Gambar
              </Button>

              <Button
                type="submit"
                disabled={!selectedFile || saving}
                className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}

                {saving ? "Menyimpan..." : "Simpan Tanda Tangan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* INFO */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Tanda tangan yang tersimpan akan dipakai untuk dokumen baru ketika kamu
        menjadi penandatangan. Dokumen lama tetap menggunakan snapshot tanda
        tangan sebelumnya.
      </div>
    </div>
  );
}
