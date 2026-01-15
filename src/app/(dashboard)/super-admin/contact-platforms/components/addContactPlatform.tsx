"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContactPlatformForm, {
  ContactPlatformFormValues,
} from "../components/FormContactPlatform";

export default function AddContactPlatform() {
  const router = useRouter();

  const handleAddContactPlatform = async (data: ContactPlatformFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/contact-platforms`, {
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

      toast.success("Contact Platform created successfully!");
      router.push("/super-admin/contact-platforms");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create contact platform"
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
