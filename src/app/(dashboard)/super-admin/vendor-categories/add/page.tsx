"use client";
import { apiUrl } from "@/helper/apiurl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import VendorCategoryForm, {
  VendorCategoryFormValues,
} from "../components/formCategoryVendor";

const AddCategoryVendor = () => {
  const router = useRouter();

  const handleAddCategoryVendor = async (data: VendorCategoryFormValues) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // 2️⃣ Kirim data ke backend Express
      const res = await fetch(`${apiUrl}/vendor-categories`, {
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

      toast.success("Vendor Category created successfully!");
      router.push("/super-admin/vendor-categories");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error || "Failed to create category");
    }
  };
  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Category Vendor
      </h2>
      <VendorCategoryForm onSubmit={handleAddCategoryVendor} />
    </div>
  );
};

export default AddCategoryVendor;
