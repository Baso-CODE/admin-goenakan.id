"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import VendorForm, { VendorFormValues } from "../components/VendorForm";

export default function AddVendorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddVendor = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch("http://localhost:8000/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: data.companyName,
          picName: data.picName,
          phone: data.phone,
          country: data.country,
          address: data.address,
          isActive: data.isActive,
          itemIds: data.itemIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to create vendor");

      toast.success("Vendor created successfully!");
      router.push("/super-admin/vendors");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Vendor
      </h2>
      <VendorForm onSubmit={handleAddVendor} isSubmitting={isSubmitting} />
    </div>
  );
}
