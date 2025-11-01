"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import VendorForm, { VendorFormValues } from "../../components/VendorForm";

export default function EditVendorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vendorData, setVendorData] = useState<VendorFormValues | undefined>();
  console.log("ini adalah data dari vendor", vendorData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`http://localhost:8000/vendors/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch vendor data");

        const data = await res.json();
        setVendorData({
          companyName: data.companyName,
          picName: data.picName,
          phone: data.phone,
          country: data.country,
          address: data.address,
          isActive: data.isActive,
          itemIds: data.vendorItems?.map((v: any) => v.item.id) || [],
        });
      } catch (err) {
        console.error("❌ Error fetching vendor data:", err);
        toast.error("Failed to load vendor data");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleUpdateVendor = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`http://localhost:8000/vendors/${id}`, {
        method: "PATCH",
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

      if (!res.ok) throw new Error("Failed to update vendor");

      toast.success("Vendor updated successfully!");
      router.push("/super-admin/vendors");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update vendor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-[1100px]">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Vendor
      </h2>
      <VendorForm
        initialData={vendorData}
        onSubmit={handleUpdateVendor}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
