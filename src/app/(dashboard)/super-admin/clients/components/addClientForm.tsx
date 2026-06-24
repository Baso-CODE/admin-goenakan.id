"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import { ChevronLeft, ClipboardList, ImagePlus, Trash2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import DepartmentForm, {
  DepartmentFormValues,
} from "../../departments/components/formDepartment";
import AddressField from "./addressField";

const clientSchema = z.object({
  type: z.enum(["B2B", "B2C"]),
});

type ClientType = "B2B" | "B2C" | "";

interface Departement {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PICFormData {
  prefix: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ClientFormData {
  type: ClientType;
  custCode?: string;

  // B2B
  b2b_brandName?: string;
  b2b_brandWebsiteUrl?: string;
  b2b_brandLogoFile?: File | null;
  b2b_companyName?: string;
  b2b_departmentId?: string;
  b2b_phone?: string;
  b2b_email?: string;
  b2b_website?: string;
  b2b_country?: string;
  b2b_province?: string;
  b2b_city?: string;
  b2b_district?: string;
  b2b_subDistrict?: string;
  b2b_postalCode?: string;
  b2b_fullAddress?: string;
  b2b_purchaseChannelId?: string;
  b2b_pics: PICFormData[];

  // B2C
  b2c_name?: string;
  b2c_prefix?: string;
  b2c_phone?: string;
  b2c_country?: string;
  b2c_province?: string;
  b2c_city?: string;
  b2c_district?: string;
  b2c_subDistrict?: string;
  b2c_postalCode?: string;
  b2c_fullAddressB2C?: string;
  b2c_purchaseChannelIdB2C?: string;
}

const initialFormData: ClientFormData = {
  type: "",
  custCode: "",
  b2b_brandName: "",
  b2b_brandWebsiteUrl: "",
  b2b_brandLogoFile: null,
  b2b_companyName: "",
  b2b_departmentId: "",
  b2b_phone: "",
  b2b_email: "",
  b2b_website: "",
  b2b_country: "",
  b2b_province: "",
  b2b_city: "",
  b2b_district: "",
  b2b_subDistrict: "",
  b2b_postalCode: "",
  b2b_fullAddress: "",
  b2b_purchaseChannelId: "",
  b2b_pics: [{ prefix: "", name: "", email: "", phone: "" }],
  b2c_name: "",
  b2c_prefix: "",
  b2c_phone: "",
  b2c_country: "",
  b2c_province: "",
  b2c_city: "",
  b2c_district: "",
  b2c_subDistrict: "",
  b2c_postalCode: "",
  b2c_fullAddressB2C: "",
  b2c_purchaseChannelIdB2C: "",
};

export default function ClientAddForm() {
  const { fetchApi, status } = useApi();
  const [formData, setFormData] = useState(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");
  const [departments, setDepartments] = useState<Departement[]>([]);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // ==========================================
  // FETCH DEPARTMENTS
  // ==========================================
  useEffect(() => {
    const fetchMasterData = async () => {
      if (status === "loading" || status === "unauthenticated") return;
      try {
        const depRes = await fetchApi("/departments/list");
        if (depRes.ok) {
          const depData = await depRes.json();
          setDepartments(depData);
        }
      } catch (err) {
        console.error("Failed to fetch master data:", err);
      }
    };
    fetchMasterData();
  }, [status, fetchApi]);

  const handleAddDepartment = async (data: DepartmentFormValues) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat departemen");
      const newDep = await res.json();
      setDepartments((prev) => [...prev, newDep]);
      setFormData((prev) => ({ ...prev, b2b_departmentId: newDep.id }));
      toast.success("Departemen berhasil ditambahkan!");
      setIsDepModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menambahkan data");
    }
  };

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: ClientType) => {
    setClientType(value);
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = clientSchema.safeParse({ type: formData.type });
    if (!validation.success) {
      toast.error("Pilih tipe klien terlebih dahulu!");
      return;
    }
    if (!session) {
      toast.error("Kamu belum login!");
      return;
    }
    if (clientType === "B2B") {
      if (!formData.b2b_companyName)
        return toast.error("Nama perusahaan wajib diisi");
      if (!formData.b2b_departmentId)
        return toast.error("Departemen wajib dipilih");
      if (formData.b2b_brandName && !formData.b2b_brandLogoFile)
        return toast.error("File Logo wajib diunggah jika Nama Brand diisi!");
    }
    if (clientType === "B2C") {
      if (!formData.b2c_name) return toast.error("Nama lengkap wajib diisi");
    }

    try {
      if (status !== "authenticated") {
        toast.error("Sesi berakhir, silakan login kembali.");
        return;
      }

      const formDataPayload = new FormData();
      formDataPayload.append("type", clientType);

      if (clientType === "B2B") {
        formDataPayload.append("companyName", formData.b2b_companyName || "");
        formDataPayload.append("departmentId", formData.b2b_departmentId || "");
        formDataPayload.append(
          "purchaseChannelId",
          formData.b2b_purchaseChannelId || "",
        );
        if (formData.b2b_phone)
          formDataPayload.append("phone", formData.b2b_phone);
        if (formData.b2b_email)
          formDataPayload.append("email", formData.b2b_email);
        if (formData.b2b_website)
          formDataPayload.append("website", formData.b2b_website);
        if (formData.b2b_country)
          formDataPayload.append("country", formData.b2b_country);
        if (formData.b2b_province)
          formDataPayload.append("province", formData.b2b_province);
        if (formData.b2b_city)
          formDataPayload.append("city", formData.b2b_city);
        if (formData.b2b_district)
          formDataPayload.append("district", formData.b2b_district);
        if (formData.b2b_subDistrict)
          formDataPayload.append("subDistrict", formData.b2b_subDistrict);
        if (formData.b2b_postalCode)
          formDataPayload.append("postalCode", formData.b2b_postalCode);
        if (formData.b2b_fullAddress)
          formDataPayload.append("fullAddress", formData.b2b_fullAddress);
        formDataPayload.append(
          "pics",
          JSON.stringify(
            formData.b2b_pics.map((pic) => ({
              prefix: pic.prefix,
              name: pic.name,
              email: pic.email,
              phone: pic.phone,
            })),
          ),
        );
        if (formData.b2b_brandName)
          formDataPayload.append("brandName", formData.b2b_brandName);
        if (formData.b2b_brandWebsiteUrl)
          formDataPayload.append(
            "brandWebsiteUrl",
            formData.b2b_brandWebsiteUrl,
          );
        if (formData.b2b_brandLogoFile)
          formDataPayload.append("logoFile", formData.b2b_brandLogoFile);
      } else {
        formDataPayload.append("name", formData.b2c_name || "");
        if (formData.b2c_prefix)
          formDataPayload.append("prefix", formData.b2c_prefix);
        if (formData.b2c_phone)
          formDataPayload.append("phone", formData.b2c_phone);
        if (formData.b2c_country)
          formDataPayload.append("countryB2C", formData.b2c_country);
        if (formData.b2c_province)
          formDataPayload.append("provinceB2C", formData.b2c_province);
        if (formData.b2c_city)
          formDataPayload.append("cityB2C", formData.b2c_city);
        if (formData.b2c_district)
          formDataPayload.append("districtB2C", formData.b2c_district);
        if (formData.b2c_subDistrict)
          formDataPayload.append("subDistrictB2C", formData.b2c_subDistrict);
        if (formData.b2c_postalCode)
          formDataPayload.append("postalCodeB2C", formData.b2c_postalCode);
        if (formData.b2c_fullAddressB2C)
          formDataPayload.append("fullAddressB2C", formData.b2c_fullAddressB2C);
      }

      const res = await fetchApi("/clients", {
        method: "POST",
        body: formDataPayload,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(
          `Gagal menyimpan: ${errData.message || "Terjadi kesalahan server"}`,
        );
        return;
      }

      toast.success("Client berhasil ditambahkan!");
      router.push("/super-admin/clients");
      router.refresh();
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi ke server.");
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-full">
      <Link
        href="/super-admin/clients"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Klien
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tambah Klien Baru</CardTitle>
            <CardDescription>
              Pilih tipe klien (B2B atau B2C) untuk menampilkan form yang
              relevan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Klien *</Label>
                <Select onValueChange={handleTypeChange} value={clientType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Pilih Tipe Klien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B">B2B (Business)</SelectItem>
                    <SelectItem value="B2C">B2C (Personal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ================================================== */}
            {/* FORM B2B */}
            {/* ================================================== */}
            {clientType === "B2B" && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detail Perusahaan (B2B)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Perusahaan *</Label>
                    <Input
                      name="b2b_companyName"
                      value={formData.b2b_companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Kantor</Label>
                    <Input
                      name="b2b_email"
                      type="email"
                      value={formData.b2b_email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telepon Kantor</Label>
                    <Input
                      name="b2b_phone"
                      value={formData.b2b_phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website *</Label>
                    <Input
                      name="b2b_website"
                      value={formData.b2b_website}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departemen *</Label>
                    <Select
                      value={formData.b2b_departmentId}
                      onValueChange={(value) => {
                        if (value === "ADD_NEW_DEP") {
                          setIsDepModalOpen(true);
                          return;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          b2b_departmentId: value,
                        }));
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            {dep.name}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_DEP"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Departemen Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 mt-6">
                  Alamat Perusahaan
                </h3>

                <AddressField
                  value={{
                    country: formData.b2b_country || "",
                    province: formData.b2b_province || "",
                    city: formData.b2b_city || "",
                    district: formData.b2b_district || "",
                    subDistrict: formData.b2b_subDistrict || "",
                    postalCode: formData.b2b_postalCode || "",
                  }}
                  onChange={(updated) =>
                    setFormData((prev) => ({
                      ...prev,
                      b2b_country: updated.country ?? prev.b2b_country,
                      b2b_province: updated.province ?? prev.b2b_province,
                      b2b_city: updated.city ?? prev.b2b_city,
                      b2b_district: updated.district ?? prev.b2b_district,
                      b2b_subDistrict:
                        updated.subDistrict ?? prev.b2b_subDistrict,
                      b2b_postalCode: updated.postalCode ?? prev.b2b_postalCode,
                    }))
                  }
                />

                <div className="space-y-2 mt-4">
                  <Label>Alamat Lengkap</Label>
                  <Textarea
                    name="b2b_fullAddress"
                    value={formData.b2b_fullAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <h4 className="font-medium mt-8 mb-2 border-b pb-2">
                  Brand Client (Opsional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Brand</Label>
                    <Input
                      name="b2b_brandName"
                      placeholder="Contoh: Chitato, Indomie..."
                      value={formData.b2b_brandName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website Brand</Label>
                    <Input
                      name="b2b_brandWebsiteUrl"
                      placeholder="https://brand-website.com"
                      value={formData.b2b_brandWebsiteUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Logo Brand</Label>
                    {formData.b2b_brandLogoFile ? (
                      <div className="relative w-40 h-40 rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
                        <img
                          src={URL.createObjectURL(formData.b2b_brandLogoFile)}
                          alt="Preview Logo"
                          className="w-full h-full object-contain bg-white p-2"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                b2b_brandLogoFile: null,
                              }))
                            }
                            className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg transform hover:scale-110">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full max-w-md">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 hover:border-primary transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                              <ImagePlus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="mb-1 text-sm text-gray-600">
                              <span className="font-semibold text-primary">
                                Klik untuk unggah
                              </span>{" "}
                              gambar
                            </p>
                            <p className="text-xs text-gray-400">
                              SVG, PNG, JPG atau WEBP
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                b2b_brandLogoFile: e.target.files?.[0] || null,
                              }))
                            }
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="font-medium mt-8 mb-2 border-b pb-2">
                  PIC (Person In Charge)
                </h4>
                {formData.b2b_pics.map((pic, index) => {
                  const updateField = (
                    field: keyof PICFormData,
                    value: string,
                  ) => {
                    const updated = [...formData.b2b_pics];
                    updated[index] = { ...updated[index], [field]: value };
                    setFormData((prev) => ({ ...prev, b2b_pics: updated }));
                  };
                  return (
                    <Card
                      key={index}
                      className="p-4 bg-card shadow-sm relative mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              b2b_pics: prev.b2b_pics.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-2">
                          <Label>Prefix</Label>
                          <Select
                            value={pic.prefix}
                            onValueChange={(value) =>
                              updateField("prefix", value)
                            }>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select prefix" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr.">Mr.</SelectItem>
                              <SelectItem value="Ms.">Ms.</SelectItem>
                              <SelectItem value="Mrs.">Mrs.</SelectItem>
                              <SelectItem value="Bpk.">Bpk.</SelectItem>
                              <SelectItem value="Ibu.">Ibu.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nama PIC *</Label>
                          <Input
                            required
                            value={pic.name}
                            onChange={(e) =>
                              updateField("name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email PIC</Label>
                          <Input
                            value={pic.email}
                            onChange={(e) =>
                              updateField("email", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telepon PIC</Label>
                          <Input
                            value={pic.phone}
                            onChange={(e) =>
                              updateField("phone", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
                <Button
                  variant="secondary"
                  type="button"
                  className="mt-2"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      b2b_pics: [
                        ...prev.b2b_pics,
                        { prefix: "", name: "", email: "", phone: "" },
                      ],
                    }))
                  }>
                  + Tambah PIC
                </Button>
              </div>
            )}

            {/* ================================================== */}
            {/* FORM B2C */}
            {/* ================================================== */}
            {clientType === "B2C" && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detail Individu (B2C)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Prefix (Mr./Ms.)</Label>
                    <Select
                      value={formData.b2c_prefix}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, b2c_prefix: value }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prefix" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr.">Mr.</SelectItem>
                        <SelectItem value="Ms.">Ms.</SelectItem>
                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                        <SelectItem value="Bpk.">Bpk.</SelectItem>
                        <SelectItem value="Ibu.">Ibu.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nama Lengkap *</Label>
                    <Input
                      value={formData.b2c_name}
                      name="b2c_name"
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telepon</Label>
                    <Input
                      name="b2c_phone"
                      value={formData.b2c_phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 mt-6">
                  Alamat
                </h3>

                <AddressField
                  value={{
                    country: formData.b2c_country || "",
                    province: formData.b2c_province || "",
                    city: formData.b2c_city || "",
                    district: formData.b2c_district || "",
                    subDistrict: formData.b2c_subDistrict || "",
                    postalCode: formData.b2c_postalCode || "",
                  }}
                  onChange={(updated) =>
                    setFormData((prev) => ({
                      ...prev,
                      b2c_country: updated.country ?? prev.b2c_country,
                      b2c_province: updated.province ?? prev.b2c_province,
                      b2c_city: updated.city ?? prev.b2c_city,
                      b2c_district: updated.district ?? prev.b2c_district,
                      b2c_subDistrict:
                        updated.subDistrict ?? prev.b2c_subDistrict,
                      b2c_postalCode: updated.postalCode ?? prev.b2c_postalCode,
                    }))
                  }
                />

                <div className="space-y-2 mt-4">
                  <Label>Alamat Lengkap</Label>
                  <Textarea
                    name="b2c_fullAddressB2C"
                    value={formData.b2c_fullAddressB2C}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={clientType === ""}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Simpan Klien Baru
          </Button>
        </div>
      </form>

      {/* MODAL DEPARTEMEN */}
      <Dialog open={isDepModalOpen} onOpenChange={setIsDepModalOpen}>
        <DialogContent className="sm:max-w-135">
          <DialogHeader>
            <DialogTitle>Tambah Departemen</DialogTitle>
          </DialogHeader>
          <DepartmentForm onSubmit={handleAddDepartment} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
