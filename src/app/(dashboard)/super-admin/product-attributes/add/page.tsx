"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AttributeForm, {
  AttributeFormValues,
} from "../components/FormAttributes";

export default function AddAttributePage() {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddAttribute = async (data: AttributeFormValues) => {
    if (status !== "authenticated") return;

    try {
      const payload = {
        name: data.name,
        values: data.values.map((v) => ({ value: v.value })),
      };

      const res = await fetchApi("/product-attributes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Parsing error secara aman
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create attribute");
      }

      toast.success("Attribute created successfully!");
      router.push("/super-admin/product-attributes");
      router.refresh();
    } catch (error) {
      console.error("❌ Create Attribute Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create attribute",
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Attribute
      </h2>

      <AttributeForm onSubmit={handleAddAttribute} />
    </div>
  );
}
