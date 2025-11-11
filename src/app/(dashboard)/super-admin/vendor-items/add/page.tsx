"use client";

import React from "react";
import VendorItemForm, {
  VendorItemFormValues,
} from "../components/formItemVendor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AddItemVendor = () => {
  const router = useRouter();

  const handleAddItemVendor = async (data: VendorItemFormValues) => {
    try {
      // Ambil token login
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // Kirim data ke backend Express
      const res = await fetch("http://localhost:8000/vendor-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Vendor Item created successfully!");
      router.push("/super-admin/vendor-items");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create vendor item:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create vendor item"
      );
    }
  };

  return (
    <div className="space-y-4 w-full  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Vendor Item
      </h2>
      <VendorItemForm onSubmit={handleAddItemVendor} />
    </div>
  );
};

export default AddItemVendor;
