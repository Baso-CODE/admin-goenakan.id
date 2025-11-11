"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ContactPlatformForm, {
  ContactPlatformFormValues,
} from "../../components/FormContactPlatform";

export default function EditContactPlatform() {
  const { id } = useParams();
  const router = useRouter();

  const [platformData, setPlatformData] = useState<
    ContactPlatformFormValues | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(
          `http://localhost:8000/contact-platforms/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch platform data");

        const data = await res.json();
        setPlatformData({
          name: data.name,
          slug: data.slug,
          icon: data.icon,
          isActive: data.isActive,
        });
      } catch (err) {
        toast.error("Failed to load platform data.");
        setPlatformData(undefined);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleUpdateContactPlatform = async (
    data: ContactPlatformFormValues
  ) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`http://localhost:8000/contact-platforms/${id}`, {
        method: "PATCH",
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

      toast.success("Contact Platform updated successfully!");
      router.push("/super-admin/contact-platforms");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update contact platform"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Contact Platform
      </h2>
      <ContactPlatformForm
        initialData={platformData}
        onSubmit={handleUpdateContactPlatform}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
