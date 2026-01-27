"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FaqItemForm, { FaqItemFormValues } from "../../components/faqItemForm";

export default function AddFaqItem() {
  const router = useRouter();

  const handleAddFaq = async (data: FaqItemFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/content/faqs/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        try {
          const errJson = JSON.parse(errText);
          throw new Error(errJson.message || errText);
        } catch {
          throw new Error(errText);
        }
      }

      toast.success("FAQ Item created successfully!");
      router.push("/super-admin/content/faqs");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create FAQ item",
      );
    }
  };

  return (
    <div className="space-y-4  mx-auto">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add FAQ Item
      </h2>
      <FaqItemForm onSubmit={handleAddFaq} />
    </div>
  );
}
