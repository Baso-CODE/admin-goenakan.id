"use client";

import { useApi } from "@/hooks/useApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import VendorForm, { VendorFormValues } from "../../components/VendorForm";

//  1. IMPORT KOMPONEN SKELETON SHADCN
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditVendorPage() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [vendorData, setVendorData] = useState<VendorFormValues | undefined>();
  const [existingItems, setExistingItems] = useState<
    { id: string; name: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;

      setIsLoading(true);
      try {
        const res = await fetchApi(`/vendors/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Vendor not found");
        }
        const data = await res.json();

        const itemsList =
          data.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
          })) || [];
        setExistingItems(itemsList);

        const existingCategoryId = data.categoryId || "";
        const existingType = data.type || "";

        setVendorData({
          companyName: data.companyName ?? "",
          picName: data.picName ?? "",
          country: data.country ?? "",
          province: data.province ?? "",
          city: data.city ?? "",
          district: data.district ?? "",
          subDistrict: data.subDistrict ?? "",
          postalCode: data.postalCode ?? "",
          address: data.address ?? "",

          isActive: data.isActive ?? true,
          trackingUrl: data.trackingUrl ?? "",

          platformId: data.contacts?.[0]?.platform?.id || "",
          contactId: data.contacts?.[0]?.contactId || "",

          itemIds: data.items?.map((v: any) => v.id) || [],

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

    if (id && status === "authenticated") {
      fetchData();
    }
  }, [id, status, fetchApi]);

  const handleUpdateVendor = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      if (status !== "authenticated") {
        throw new Error("Sesi tidak valid, silakan coba lagi.");
      }

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
            Edit Vendor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Perbarui informasi data vendor sesuai kebutuhan.
          </p>
        </div>
      </div>

      {/* Form Edit atau Tampilan Skeleton Loading */}
      {!isLoading && vendorData ? (
        <VendorForm
          initialData={vendorData}
          existingItems={existingItems}
          onSubmit={handleUpdateVendor}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
        />
      ) : (
        /*  2. SKELETON LOADING UI */
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Field 1 & 2 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Field 3 & 4 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Tracking Link (Full Width) */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Area & Lokasi Box */}
              <div className="col-span-1 md:col-span-2 space-y-4 border p-4 rounded-lg bg-slate-50/50">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              {/* Full Address */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Type & Category */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="flex justify-end pt-4">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
