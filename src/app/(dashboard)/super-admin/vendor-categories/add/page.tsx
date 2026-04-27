"use client";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import VendorCategoryForm, {
  VendorCategoryFormValues,
} from "../components/formCategoryVendor";

const AddCategoryVendor = () => {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddCategoryVendor = async (data: VendorCategoryFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/vendor-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat kategori vendor");
      }

      toast.success("Vendor Category created successfully!");
      router.push("/super-admin/vendor-categories");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create vendor category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    }
  };

  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Category Vendor
      </h2>
      <VendorCategoryForm onSubmit={handleAddCategoryVendor} />
    </div>
  );
};

export default AddCategoryVendor;
