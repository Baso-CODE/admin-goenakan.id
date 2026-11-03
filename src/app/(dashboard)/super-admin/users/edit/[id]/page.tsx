"use client";

import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import UserForm, { UserFormValues } from "../../components/userForm";

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  roleId: string;
}

export default function EditUser() {
  const { fetchApi, status } = useApi();

  const router = useRouter();
  const params = useParams();

  const userId = String(params.id);

  const [user, setUser] = useState<UserData | null>(null);

  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // GET USER BY ID
  // ==========================================

  const fetchUser = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);

      const res = await fetchApi(`/users/${userId}`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data user");
      }

      const result = await res.json();

      setUser(result.data || result);
    } catch (error) {
      console.error(error);

      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  }, [fetchApi, status, userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ==========================================
  // UPDATE USER
  // ==========================================

  const handleUpdateUser = async (data: UserFormValues, file?: File) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("name", data.name);

      formData.append("email", data.email);

      formData.append("roleId", data.roleId);

      // Password hanya dikirim jika diisi.
      // Kosong berarti password lama dipertahankan.

      if (data.password?.trim()) {
        formData.append("password", data.password);
      }

      if (file) {
        formData.append("image", file);
      }

      const res = await fetchApi(`/users/${userId}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));

        throw new Error(errData.message || "Failed to update user");
      }

      toast.success("User updated successfully!");

      router.push("/super-admin/users");

      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to update user",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading || status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">User tidak ditemukan.</p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-4 mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight uppercase">
          Edit User
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Perbarui informasi pengguna, role, password, dan foto profil.
      </p>

      <UserForm
        onSubmit={handleUpdateUser}
        isSubmitting={isSubmitting}
        initialData={{
          name: user.name,
          email: user.email,
          password: "",
          roleId: user.roleId,
          image: user.image,
        }}
        isEdit
      />
    </div>
  );
}
