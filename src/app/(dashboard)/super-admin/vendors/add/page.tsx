"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import AddVendorForm, {
  AddVendorFormValues,
} from "../components/vendorFormAdd";

export default function AddVendorPage() {
  const { fetchApi, status } = useApi();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const handleAddVendor = async (data: AddVendorFormValues) => {
    setIsSubmitting(true);
    try {
      if (status !== "authenticated") {
        throw new Error("Sesi tidak valid, silakan coba lagi.");
      }

      const res = await fetchApi("/vendors", {
        method: "POST",
        body: JSON.stringify({
          companyName: data.companyName,
          picName: data.picName,
          type: data.type,
          categoryId: data.categoryId,
          country: data.country,
          province: data.province,
          city: data.city,
          district: data.district,
          subDistrict: data.subDistrict,
          postalCode: data.postalCode,
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menambahkan vendor");
      }

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
      <AddVendorForm onSubmit={handleAddVendor} isSubmitting={isSubmitting} />
    </div>
  );
}
