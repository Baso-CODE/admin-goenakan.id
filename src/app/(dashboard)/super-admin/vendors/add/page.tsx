"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import AddVendorForm, {
  AddVendorFormValues,
} from "../components/vendorFormAdd";

export default function AddVendorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const handleAddVendor = async (data: AddVendorFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const tokenJson = await tokenRes.json();
      const token = tokenJson?.token;

      const res = await fetch(`${apiUrl}/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: data.companyName,
          picName: data.picName,
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

      toast.success("Vendor created successfully!");
      router.push("/super-admin/vendors");
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
