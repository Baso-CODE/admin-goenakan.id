"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProductTagForm, {
  ProductTagFormValues,
} from "../components/formTagProduct";

const AddProductTag = () => {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddProductTag = async (data: ProductTagFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/product-tags", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // Parsing error secara aman
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create tag");
      }

      toast.success("Product Tag created successfully!");
      router.push("/super-admin/product-tags");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Create Tag Error:", err);
      toast.error(err.message || "Failed to create tag");
    }
  };
  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Product Tag
      </h2>
      <ProductTagForm onSubmit={handleAddProductTag} />
    </div>
  );
};

export default AddProductTag;
