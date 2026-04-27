"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContactPlatformForm, {
  ContactPlatformFormValues,
} from "../components/FormContactPlatform";

export default function AddContactPlatform() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  const handleAddContactPlatform = async (data: ContactPlatformFormValues) => {
    try {
      // ✨ Gunakan fetchApi (Otomatis menangani Base URL, Token, dan JSON Content-Type)
      const res = await fetchApi("/contact-platforms", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Contact Platform created successfully!");
      router.push("/super-admin/contact-platforms");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create contact platform",
      );
    }
  };

  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Contact Platform
      </h2>
      <ContactPlatformForm onSubmit={handleAddContactPlatform} />
    </div>
  );
}
