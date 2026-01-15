"use client";

import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DepartmentForm, {
  DepartmentFormValues,
} from "../components/formDepartment";

export default function AddDepartment() {
  const router = useRouter();

  const handleAddDepartment = async (data: DepartmentFormValues) => {
    try {
      // === GET TOKEN ===
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // === POST TO BACKEND ===
      const res = await fetch(`${apiUrl}/departments`, {
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

      toast.success("Department created successfully!");
      router.push("/super-admin/departments");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create department"
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Department
      </h2>

      <DepartmentForm onSubmit={handleAddDepartment} />
    </div>
  );
}
