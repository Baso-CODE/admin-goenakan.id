"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import VendorItemForm, {
  VendorItemFormValues,
} from "../components/formItemVendor";

const AddItemVendor = () => {
  const { fetchApi, status } = useApi();

  const router = useRouter();
  const handleAddItemVendor = async (data: VendorItemFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/vendor-items", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error: ${res.statusText}`);
      }

      toast.success("Vendor Item created successfully!");
      router.push("/super-admin/vendor-items");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to create vendor item:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create vendor item",
      );
    }
  };

  return (
    <div className="space-y-4 w-full  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Vendor Item
      </h2>
      <VendorItemForm onSubmit={handleAddItemVendor} />
    </div>
  );
};

export default AddItemVendor;
