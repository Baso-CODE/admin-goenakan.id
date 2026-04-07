"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProductTagForm, {
  ProductTagFormValues,
} from "../components/formTagProduct";

const AddProductTag = () => {
  const router = useRouter();

  const handleAddProductTag = async (data: ProductTagFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // Sesuaikan URL endpoint ini dengan backend Anda
      const res = await fetch(`${apiUrl}/product-tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Product Tag created successfully!");
      router.push("/super-admin/product-tags");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error || "Failed to create tag");
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
