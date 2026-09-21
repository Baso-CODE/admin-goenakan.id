"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
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
    <div className="w-full mx-auto space-y-6 pb-10">
      <Link
        href="/super-admin/vendors"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Vendor
      </Link>

      {/* Header Halaman */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase text-slate-800">
            Add Vendor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tambahkan informasi vendor baru ke dalam sistem manajemen.
          </p>
        </div>
      </div>

      {/* Komponen Form Vendor */}
      <AddVendorForm onSubmit={handleAddVendor} isSubmitting={isSubmitting} />
    </div>
  );
}
