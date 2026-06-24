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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronsUpDown,
  ClipboardList,
  ImagePlus,
  Trash2,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import DepartmentForm, {
  DepartmentFormValues,
} from "../../departments/components/formDepartment";

const WILAYAH_API = "https://wilayah.web.id/api";

const clientSchema = z.object({
  type: z.enum(["B2B", "B2C"]),
});

type ClientType = "B2B" | "B2C" | "";

interface PurchaseChannel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
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

  // B2B FIELDS
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

  // B2C FIELDS
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

// ==========================================
// REUSABLE COMBOBOX UNTUK REGION
// ==========================================
function RegionCombobox({
  label,
  value,
  list,
  placeholder,
  disabled,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  list: any[];
  placeholder: string;
  disabled: boolean;
  loading?: boolean;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              "w-full justify-between h-10 font-normal",
              !value && "text-muted-foreground",
            )}>
            <span className="truncate">
              {loading ? "Loading..." : value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start">
          <Command>
            <CommandInput placeholder={`Cari ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading..." : "Tidak ditemukan"}
              </CommandEmpty>
              <CommandGroup>
                {list.map((item) => (
                  <CommandItem
                    key={item.code}
                    value={item.name}
                    onSelect={() => {
                      onChange(item.name);
                      setOpen(false);
                    }}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function ClientAddForm() {
  const { fetchApi, status } = useApi();
  const [formData, setFormData] = useState(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");

  // STATE WILAYAH SHARED PROVINCES
  const [provinces, setProvinces] = useState<any[]>([]);

  // STATE WILAYAH B2B
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);

  // STATE WILAYAH B2C
  const [citiesB2C, setCitiesB2C] = useState<any[]>([]);
  const [districtsB2C, setDistrictsB2C] = useState<any[]>([]);
  const [subDistrictsB2C, setSubDistrictsB2C] = useState<any[]>([]);

  const [departments, setDepartments] = useState<Departement[]>([]);
  const [openB2BCountry, setOpenB2BCountry] = useState(false);

  const [isDepModalOpen, setIsDepModalOpen] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  // ==========================================
  // FETCH DEPARTMENTS & PURCHASE CHANNELS
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
  // FETCH WILAYAH API (PROVINCES)
  // ==========================================
  useEffect(() => {
    fetch(`${WILAYAH_API}/provinces`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") setProvinces(json.data);
      })
      .catch((err) => console.error("Error fetch provinces:", err));
  }, []);

  // ==========================================
  // FETCH WILAYAH API (CITIES)
  // ==========================================
  useEffect(() => {
    // B2B City
    const provB2B = provinces.find((p) => p.name === formData.b2b_province);
    if (provB2B && formData.b2b_country === "Indonesia") {
      fetch(`${WILAYAH_API}/regencies/${provB2B.code}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") setCities(json.data);
        });
    } else {
      setCities([]);
    }

    // B2C City
    const provB2C = provinces.find((p) => p.name === formData.b2c_province);
    if (provB2C && formData.b2c_country === "Indonesia") {
      fetch(`${WILAYAH_API}/regencies/${provB2C.code}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") setCitiesB2C(json.data);
        });
    } else {
      setCitiesB2C([]);
    }
  }, [
    formData.b2b_province,
    formData.b2c_province,
    formData.b2b_country,
    formData.b2c_country,
    provinces,
  ]);

  // ==========================================
  // FETCH WILAYAH API (DISTRICTS)
  // ==========================================
  useEffect(() => {
    // B2B District
    const cityB2B = cities.find((c) => c.name === formData.b2b_city);
    if (cityB2B && formData.b2b_country === "Indonesia") {
      fetch(`${WILAYAH_API}/districts/${cityB2B.code}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") setDistricts(json.data);
        });
    } else {
      setDistricts([]);
    }

    // B2C District
    const cityB2C = citiesB2C.find((c) => c.name === formData.b2c_city);
    if (cityB2C && formData.b2c_country === "Indonesia") {
      fetch(`${WILAYAH_API}/districts/${cityB2C.code}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") setDistrictsB2C(json.data);
        });
    } else {
      setDistrictsB2C([]);
    }
  }, [
    formData.b2b_city,
    formData.b2c_city,
    formData.b2b_country,
    formData.b2c_country,
    cities,
    citiesB2C,
  ]);

  // ==========================================
  // FETCH WILAYAH API (SUB-DISTRICTS/VILLAGES)
  // ==========================================
  useEffect(() => {
    // B2B SubDistrict
    const distB2B = districts.find((d) => d.name === formData.b2b_district);
    if (distB2B && formData.b2b_country === "Indonesia") {
      fetch(`${WILAYAH_API}/villages/${distB2B.code}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") setSubDistricts(json.data);
        });
    } else {
      setSubDistricts([]);
    }

    // B2C SubDistrict
    const distB2C = districtsB2C.find((d) => d.name === formData.b2c_district);
    if (distB2C && formData.b2c_country === "Indonesia") {
      fetch(`${WILAYAH_API}/villages/${distB2C.code}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.status === "success") setSubDistrictsB2C(json.data);
        });
    } else {
      setSubDistrictsB2C([]);
    }
  }, [
    formData.b2b_district,
    formData.b2c_district,
    formData.b2b_country,
    formData.b2c_country,
    districts,
    districtsB2C,
  ]);

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
      if (formData.b2b_brandName && !formData.b2b_brandLogoFile) {
        return toast.error("File Logo wajib diunggah jika Nama Brand diisi!");
      }
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* COUNTRY B2B */}
                  <div className="space-y-2 flex flex-col">
                    <Label>Negara</Label>
                    <Popover
                      open={openB2BCountry}
                      onOpenChange={setOpenB2BCountry}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between pl-3 font-normal",
                            !formData.b2b_country && "text-muted-foreground",
                          )}>
                          {formData.b2b_country ? (
                            <span className="flex items-center gap-2 truncate">
                              <span>
                                {
                                  countries.find(
                                    (c) => c.name === formData.b2b_country,
                                  )?.flag
                                }
                              </span>
                              {formData.b2b_country}
                            </span>
                          ) : (
                            "Pilih Negara"
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-75 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari negara..." />
                          <CommandList>
                            <CommandEmpty>Negara tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={c.name}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      b2b_country: c.name,
                                      b2b_province: "",
                                      b2b_city: "",
                                      b2b_district: "",
                                      b2b_subDistrict: "",
                                      b2b_postalCode: "",
                                    }));
                                    setOpenB2BCountry(false);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.b2b_country === c.name
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span>
                                    {c.flag} {c.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* PROVINCE B2B */}
                  {formData.b2b_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Provinsi"
                      placeholder="Pilih Provinsi"
                      list={provinces}
                      value={formData.b2b_province || ""}
                      disabled={!formData.b2b_country}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_province: val,
                          b2b_city: "",
                          b2b_district: "",
                          b2b_subDistrict: "",
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Provinsi</Label>
                      <Input
                        placeholder="Masukkan Provinsi"
                        value={formData.b2b_province}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_province: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* CITY B2B */}
                  {formData.b2b_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Kota / Kabupaten"
                      placeholder="Pilih Kota / Kabupaten"
                      list={cities}
                      value={formData.b2b_city || ""}
                      disabled={!formData.b2b_province}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_city: val,
                          b2b_district: "",
                          b2b_subDistrict: "",
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Kota / Kabupaten</Label>
                      <Input
                        placeholder="Masukkan Kota"
                        value={formData.b2b_city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_city: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* DISTRICT B2B */}
                  {formData.b2b_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Kecamatan"
                      placeholder="Pilih Kecamatan"
                      list={districts}
                      value={formData.b2b_district || ""}
                      disabled={!formData.b2b_city}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_district: val,
                          b2b_subDistrict: "",
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Kecamatan</Label>
                      <Input
                        placeholder="Masukkan Kecamatan"
                        value={formData.b2b_district}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_district: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* SUBDISTRICT B2B */}
                  {formData.b2b_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Kelurahan"
                      placeholder="Pilih Kelurahan"
                      list={subDistricts}
                      value={formData.b2b_subDistrict || ""}
                      disabled={!formData.b2b_district}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_subDistrict: val,
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Kelurahan</Label>
                      <Input
                        placeholder="Masukkan Kelurahan"
                        value={formData.b2b_subDistrict}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_subDistrict: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Kode Pos</Label>
                    <Input
                      placeholder="Kode Pos"
                      value={formData.b2b_postalCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_postalCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* COUNTRY B2C */}
                  <div className="space-y-2 flex flex-col">
                    <Label>Negara</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between pl-3 font-normal",
                            !formData.b2c_country && "text-muted-foreground",
                          )}>
                          {formData.b2c_country ? (
                            <span className="flex items-center gap-2 truncate">
                              <span>
                                {
                                  countries.find(
                                    (c) => c.name === formData.b2c_country,
                                  )?.flag
                                }
                              </span>
                              {formData.b2c_country}
                            </span>
                          ) : (
                            "Pilih Negara"
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-75 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari negara..." />
                          <CommandList>
                            <CommandEmpty>Negara tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={c.name}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      b2c_country: c.name,
                                      b2c_province: "",
                                      b2c_city: "",
                                      b2c_district: "",
                                      b2c_subDistrict: "",
                                      b2c_postalCode: "",
                                    }));
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.b2c_country === c.name
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span>
                                    {c.flag} {c.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* PROVINCE B2C */}
                  {formData.b2c_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Provinsi"
                      placeholder="Pilih Provinsi"
                      list={provinces}
                      value={formData.b2c_province || ""}
                      disabled={!formData.b2c_country}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_province: val,
                          b2c_city: "",
                          b2c_district: "",
                          b2c_subDistrict: "",
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Provinsi</Label>
                      <Input
                        placeholder="Masukkan Provinsi"
                        value={formData.b2c_province}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_province: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* CITY B2C */}
                  {formData.b2c_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Kota / Kabupaten"
                      placeholder="Pilih Kota / Kabupaten"
                      list={citiesB2C}
                      value={formData.b2c_city || ""}
                      disabled={!formData.b2c_province}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_city: val,
                          b2c_district: "",
                          b2c_subDistrict: "",
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Kota / Kabupaten</Label>
                      <Input
                        placeholder="Masukkan Kota"
                        value={formData.b2c_city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_city: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* DISTRICT B2C */}
                  {formData.b2c_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Kecamatan"
                      placeholder="Pilih Kecamatan"
                      list={districtsB2C}
                      value={formData.b2c_district || ""}
                      disabled={!formData.b2c_city}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_district: val,
                          b2c_subDistrict: "",
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Kecamatan</Label>
                      <Input
                        placeholder="Masukkan Kecamatan"
                        value={formData.b2c_district}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_district: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* SUBDISTRICT B2C */}
                  {formData.b2c_country === "Indonesia" ? (
                    <RegionCombobox
                      label="Kelurahan"
                      placeholder="Pilih Kelurahan"
                      list={subDistrictsB2C}
                      value={formData.b2c_subDistrict || ""}
                      disabled={!formData.b2c_district}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_subDistrict: val,
                        }))
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label>Kelurahan</Label>
                      <Input
                        placeholder="Masukkan Kelurahan"
                        value={formData.b2c_subDistrict}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_subDistrict: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Kode Pos</Label>
                    <Input
                      placeholder="Kode Pos"
                      value={formData.b2c_postalCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_postalCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

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
