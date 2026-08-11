"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import UserForm, { UserFormValues } from "./userForm";

export default function AddUser() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUser = async (data: UserFormValues, file?: File) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Menggunakan FormData karena kita mengirim file gambar
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("roleId", data.roleId);

      if (file) {
        formData.append("image", file);
      }

      const res = await fetchApi("/users", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create user");
      }

      toast.success("User created successfully!");
      router.push("/super-admin/users");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4  mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight uppercase">
          Add New User
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Tambahkan pengguna baru ke dalam sistem dan tentukan hak akses (Role)
        mereka.
      </p>

      {/* Render komponen Form */}
      <UserForm onSubmit={handleAddUser} isSubmitting={isSubmitting} />
    </div>
  );
}
