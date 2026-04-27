"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import VendorForm, { VendorFormValues } from "../../components/VendorForm";

export default function EditVendorPage() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [vendorData, setVendorData] = useState<VendorFormValues | undefined>();

  // State untuk menyimpan Nama Item (untuk Badge di Form)
  const [existingItems, setExistingItems] = useState<
    { id: string; name: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetchApi(`/vendors/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Vendor not found");
        }
        const data = await res.json();

        // 1. SIAPKAN EXISTING ITEMS (PENTING AGAR BADGE MUNCUL)
        const itemsList =
          data.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
          })) || [];
        setExistingItems(itemsList);

        // 2. Deteksi Category & Type dari item pertama (untuk auto-fill dropdown)
        const firstItem = data.items?.[0];
        const existingCategoryId = firstItem?.category?.id || "";
        const existingType = firstItem?.category?.type || "";

        // 3. Mapping Data ke Form
        setVendorData({
          companyName: data.companyName ?? "",
          picName: data.picName ?? "",

          // Address Fields (Sekarang sudah lengkap dari backend)
          country: data.country ?? "",
          province: data.province ?? "",
          city: data.city ?? "",
          district: data.district ?? "",
          subDistrict: data.subDistrict ?? "",
          postalCode: data.postalCode ?? "",
          address: data.address ?? "",

          isActive: data.isActive ?? true,
          trackingUrl: data.trackingUrl ?? "",

          // Relations
          platformId: data.contacts?.[0]?.platform?.id || "",
          contactId: data.contacts?.[0]?.contactId || "",

          // Item IDs (Hanya butuh array of strings untuk form value)
          itemIds: data.items?.map((v: any) => v.id) || [],

          // Type & Category
          type: existingType,
          categoryId: existingCategoryId,
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

      const payload = {
        ...data,
        contacts: [{ platformId: data.platformId, contactId: data.contactId }],
      };

      const res = await fetchApi(`/vendors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update vendor");
      }

      toast.success("Vendor updated successfully!");
      router.push("/super-admin/vendors");
      router.refresh();
    } catch (err) {
      console.error("❌ Error updating vendor:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update vendor",
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
      {!isLoading && vendorData ? (
        <VendorForm
          initialData={vendorData}
          existingItems={existingItems}
          onSubmit={handleUpdateVendor}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="flex items-center justify-center h-40">
          <span className="text-muted-foreground">Loading form data...</span>
        </div>
      )}
    </div>
  );
}
