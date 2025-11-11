"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import VendorForm, { VendorFormValues } from "../../components/VendorForm";

export default function EditVendorPage() {
  const { id } = useParams();
  const router = useRouter();

  const [vendorData, setVendorData] = useState<VendorFormValues | undefined>();
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

        const data = await res.json();
        console.log("ini adalah data saya🔥🔥🔥🔥🔥🔥", data);

        setVendorData({
          companyName: data.companyName,
          picName: data.picName,
          country: data.country,
          type: "",
          categoryId: "",
          address: data.address,
          isActive: data.isActive,
          itemIds: data.vendorItems?.map((v: any) => v.id) || [],
          platformId: data.contacts?.[0]?.platform?.id || "",
          contactId: data.contacts?.[0]?.contactId || "",
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

  // === HANDLE UPDATE ===
  const handleUpdateVendor = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const payload = {
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
      };

      const res = await fetch(`http://localhost:8000/vendors/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      toast.success("Vendor updated successfully!");
      router.push("/super-admin/vendors");
      router.refresh();
    } catch (err) {
      console.error("❌ Error updating vendor:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update vendor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
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
