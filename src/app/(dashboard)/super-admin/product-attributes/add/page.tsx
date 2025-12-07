"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AttributeForm, {
  AttributeFormValues,
} from "../components/FormAttributes";

export default function AddAttributePage() {
  const router = useRouter();

  const handleAddAttribute = async (data: AttributeFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const payload = {
        name: data.name,
        values: data.values.map((v) => ({ value: v.value })),
      };

      const res = await fetch("http://localhost:8000/product-attributes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Attribute created successfully!");
      router.push("/super-admin/product-attributes");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create attribute"
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
