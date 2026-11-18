"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import UserForm, { UserFormValues } from "./userForm";

export default function AddUser() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const [isResending, setIsResending] = useState(false);
  const submittingRef = useRef(false);

  const handleAddUser = async (data: UserFormValues, file?: File) => {
    // Cegah double submit.
    if (submittingRef.current || createdUserId) {
      return;
    }

    if (status !== "authenticated") {
      toast.error("Silakan login kembali.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("name", data.name.trim());
      formData.append("email", data.email.trim().toLowerCase());
      formData.append("roleId", data.roleId);

      // Password tidak dikirim saat Create.
      // Pengguna membuat password sendiri lewat email.

      if (file) {
        formData.append("image", file);
      }

      const res = await fetchApi("/users", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Gagal membuat akun pengguna.");
      }

      setCreatedUserId(result.id);

      if (result.invitationEmailSent === true) {
        toast.success("Akun berhasil dibuat! Email aktivasi telah dikirim.");

        router.push("/super-admin/users");
        router.refresh();
        return;
      }

      toast.warning(
        "Akun berhasil dibuat, tetapi email gagal dikirim. Klik Kirim Ulang Undangan di bawah.",
        { duration: 8000 },
      );
    } catch (error) {
      console.error("Create User failed:", error);

      toast.error(
        error instanceof Error ? error.message : "Gagal membuat akun.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!createdUserId || isResending) {
      return;
    }

    setIsResending(true);

    try {
      const res = await fetchApi(`/users/${createdUserId}/resend-invitation`, {
        method: "POST",
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Gagal mengirim ulang undangan.");
      }

      toast.success("Email undangan berhasil dikirim ulang!");

      router.push("/super-admin/users");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengirim ulang undangan.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold uppercase tracking-tight">
          Add New User
        </h2>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Buat akun pengguna dan tentukan role. Pengguna akan menerima email
        aktivasi untuk membuat password sendiri.
      </p>

      {createdUserId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">Akun berhasil dibuat</h3>

          <p className="mt-2 text-sm text-amber-800">
            Email aktivasi belum berhasil dikirim. Jangan membuat akun lagi
            menggunakan email yang sama.
          </p>

          <button
            type="button"
            onClick={handleResendInvitation}
            disabled={isResending}
            className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isResending ? "Mengirim Undangan..." : "Kirim Ulang Undangan"}
          </button>
        </div>
      ) : (
        <UserForm onSubmit={handleAddUser} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
