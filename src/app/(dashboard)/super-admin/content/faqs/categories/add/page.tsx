"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FaqCategoryForm, {
  FaqCategoryFormValues,
} from "../component/formFaqCategories";

export default function AddFaqCategory() {
  const router = useRouter();

  const handleAddCategory = async (data: FaqCategoryFormValues) => {
    try {
      // === GET TOKEN ===
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // === POST TO BACKEND ===
      const res = await fetch(`${apiUrl}/content/faqs/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        // Coba parse JSON error jika ada message
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message || errText);
        } catch {
          throw new Error(errText);
        }
      }

      toast.success("FAQ Category created successfully!");
      router.push("/super-admin/faqs/categories");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    }
  };

  return (
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add FAQ Category
      </h2>

      <FaqCategoryForm onSubmit={handleAddCategory} />
    </div>
  );
}
