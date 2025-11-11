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
      const tokenJson = await tokenRes.json();
      const token = tokenJson?.token;

      console.log("🔑 Token result:", token);
      console.log("📦 Data to send:", data);

      const res = await fetch("http://localhost:8000/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: data.companyName,
          picName: data.picName,
          country: data.country,
          address: data.address,
          isActive: data.isActive,
          itemIds: data.itemIds,
          contacts: [
            {
              platformId: data.platformId,
              contactId: data.contactId,
            },
          ],
        }),
      });

      const text = await res.text();
      console.log("🧾 Backend response:", res.status, text);

      if (!res.ok) throw new Error(`Failed: ${res.status} ${text}`);

      toast.success("Vendor created successfully!");
      router.push("/super-admin/vendors");
      router.refresh();
    } catch (err) {
      console.error("❌ Error add vendor:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full  space-y-6">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Vendor
      </h2>
      <VendorForm onSubmit={handleAddVendor} isSubmitting={isSubmitting} />
    </div>
  );
}
