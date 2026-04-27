"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import VendorCategoryForm, {
  VendorCategoryFormValues,
} from "../../components/formCategoryVendor";

const EditCategoryVendor = () => {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const [categoryData, setCategoryData] = useState<
    VendorCategoryFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      setIsLoading(true);
      try {
        const res = await fetchApi(`/vendor-categories/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch category data");
        }

        const data = await res.json();
        setCategoryData({
          name: data.name,
          type: data.type,
          description: data.description,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        setCategoryData(undefined);
        toast.error("Failed to load category data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateCategoryVendor = async (data: VendorCategoryFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/vendor-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal memperbarui kategori");
      }

      toast.success("Vendor Category updated successfully!");
      router.push("/super-admin/vendor-categories");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Vendor Category
      </h2>

      <VendorCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategoryVendor}
        isLoading={isLoading} // Kirim status loading
        isSubmitting={isSubmitting} // Kirim status submitting
      />
    </div>
  );
};

export default EditCategoryVendor;
