"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApi } from "@/hooks/useApi";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import DepartmentForm, {
  DepartmentFormValues,
} from "../../departments/components/formDepartment";
import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../../purchase-channel/components/formPurchaseChannel";

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

  // COMMON
  custCode?: string;

  // ======================================================
  // ========================== B2B ========================
  // ======================================================
  b2b_brandName?: string;
  b2b_brandWebsiteUrl?: string;
  b2b_brandLogoFile?: File | null;
  b2b_companyName?: string;
  b2b_departmentId?: string;
  b2b_phone?: string;
  b2b_email?: string;
  b2b_website?: string;

  // ----------- B2B ADDRESS -----------
  b2b_country?: string;
  b2b_province?: string;
  b2b_city?: string;
  b2b_district?: string; // Kecamatan
  b2b_subDistrict?: string; // Kelurahan
  b2b_postalCode?: string;
  b2b_fullAddress?: string;

  b2b_purchaseChannelId?: string;

  // MULTIPLE PIC
  b2b_pics: PICFormData[];

  // ======================================================
  // ========================== B2C ========================
  // ======================================================

  b2c_name?: string;
  b2c_prefix?: string;
  b2c_phone?: string;

  // ----------- B2C ADDRESS -----------
  b2c_country?: string;
  b2c_province?: string;
  b2c_city?: string;
  b2c_district?: string; // Kecamatan
  b2c_subDistrict?: string; // Kelurahan
  b2c_postalCode?: string;
  b2c_fullAddressB2C?: string;

  b2c_purchaseChannelIdB2C?: string;
}

const initialFormData: ClientFormData = {
  type: "",

  custCode: "",

  // ============================
  // B2B FIELDS
  // ============================
  b2b_brandName: "",
  b2b_brandWebsiteUrl: "",
  b2b_brandLogoFile: null,
  b2b_companyName: "",
  b2b_departmentId: "",

  b2b_phone: "",
  b2b_email: "",
  b2b_website: "",

  // ADDRESS STRUCTURE
  b2b_country: "",
  b2b_province: "",
  b2b_city: "",
  b2b_district: "", // kecamatan
  b2b_subDistrict: "", // kelurahan
  b2b_postalCode: "",

  b2b_fullAddress: "",

  b2b_purchaseChannelId: "",

  // MULTIPLE PIC
  b2b_pics: [
    {
      prefix: "",
      name: "",
      email: "",
      phone: "",
    },
  ],

  // ============================
  // B2C FIELDS
  // ============================
  b2c_name: "",
  b2c_prefix: "",
  b2c_phone: "",

  // ADDRESS STRUCTURE
  b2c_country: "",
  b2c_province: "",
  b2c_city: "", // kabupaten/kota
  b2c_district: "", // kecamatan
  b2c_subDistrict: "", // kelurahan
  b2c_postalCode: "",

  b2c_fullAddressB2C: "",
  b2c_purchaseChannelIdB2C: "",
};

export default function ClientAddForm() {
  const { fetchApi, status } = useApi();
  const [formData, setFormData] = useState(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");
  const [provinces, setProvinces] = useState<any[]>([]);

  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistrict] = useState<any[]>([]);

  // STATE WILAYAH B2C
  const [citiesB2C, setCitiesB2C] = useState<any[]>([]);
  const [districtsB2C, setDistrictsB2C] = useState<any[]>([]);
  const [subDistrictB2C, setSubDistrictB2C] = useState<any[]>([]);

  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    [],
  );
  const [departments, setDepartments] = useState<Departement[]>([]);
  const [openB2BCountry, setOpenB2BCountry] = useState(false);

  const [manualDistrictB2B, setManualDistrictB2B] = useState(false);
  const [manualSubDistrictB2B, setManualSubDistrictB2B] = useState(false);
  const [manualDistrictB2C, setManualDistrictB2C] = useState(false);
  const [manualSubDistrictB2C, setManualSubDistrictB2C] = useState(false);

  // ✨ STATE UNTUK MODAL TAMBAH BARU
  const [isPcModalOpen, setIsPcModalOpen] = useState(false);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  // Track dari mana modal PC dipanggil agar saat success bisa auto-select field yang tepat
  const [pcModalTrigger, setPcModalTrigger] = useState<"B2B" | "B2C" | null>(
    null,
  );

  const { data: session } = useSession();
  const router = useRouter();

  // ==================================================
  // === HANDLERS UNTUK SUBMIT DARI DALAM MODAL
  // ==================================================
  const handleAddPurchaseChannel = async (data: PurchaseChannelFormValues) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/purchase-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat purchase channel");
      }

      const newPc = await res.json();

      // Update state dropdown
      setPurchaseChannels((prev) => [...prev, newPc]);

      // Auto-select field yang memicu modal
      if (pcModalTrigger === "B2B") {
        setFormData((prev) => ({ ...prev, b2b_purchaseChannelId: newPc.id }));
      } else if (pcModalTrigger === "B2C") {
        setFormData((prev) => ({
          ...prev,
          b2c_purchaseChannelIdB2C: newPc.id,
        }));
      }

      toast.success("Saluran Pembelian berhasil ditambahkan!");
      setIsPcModalOpen(false); // Tutup modal
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menambahkan data");
    }
  };

  const handleAddDepartment = async (data: DepartmentFormValues) => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal membuat departemen");
      }

      const newDep = await res.json();

      // Update state dropdown & auto-select
      setDepartments((prev) => [...prev, newDep]);
      setFormData((prev) => ({ ...prev, b2b_departmentId: newDep.id }));

      toast.success("Departemen berhasil ditambahkan!");
      setIsDepModalOpen(false); // Tutup modal
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menambahkan data");
    }
  };

  useEffect(() => {
    const fetchMasterData = async () => {
      if (status === "loading" || status === "unauthenticated") return;

      try {
        const [pcRes, depRes] = await Promise.all([
          fetchApi("/purchase-channels/list"),
          fetchApi("/departments/list"),
        ]);

        if (!pcRes.ok || !depRes.ok) throw new Error("Failed to fetch data");

        const pcData = await pcRes.json();
        const depData = await depRes.json();

        setPurchaseChannels(pcData);
        setDepartments(depData);
      } catch (err) {
        console.error("❌ Failed to fetch master data:", err);
        toast.error("Gagal mengambil data Purchase Channel / Departemen");
      }
    };

    fetchMasterData();
  }, [status, fetchApi]);
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error fetch provinces:", err));
  }, []);

  // city / kabupaten
  useEffect(() => {
    const handler = async (provinceName: string, setCitiesFn: any) => {
      const prov = provinces.find((p) => p.name === provinceName);
      if (prov) {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`,
        );
        const data = await res.json();
        setCitiesFn(data);
      } else {
        setCitiesFn([]);
      }
    };

    // B2B
    if (formData.b2b_country === "Indonesia" && formData.b2b_province) {
      handler(formData.b2b_province, setCities);
    }

    // B2C
    if (formData.b2c_country === "Indonesia" && formData.b2c_province) {
      handler(formData.b2c_province, setCitiesB2C);
    }
  }, [
    formData.b2b_province,
    formData.b2c_province,
    formData.b2b_country,
    formData.b2c_country,
    provinces,
  ]);

  // kecamatan
  useEffect(() => {
    const handler = async (
      cityName: string,
      citiesRef: any[],
      setDistrictFn: any,
    ) => {
      const city = citiesRef.find((c) => c.name === cityName);
      if (city) {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`,
        );
        const data = await res.json();
        setDistrictFn(data);
      } else {
        setDistrictFn([]);
      }
    };

    // B2B
    if (formData.b2b_country === "Indonesia" && formData.b2b_city) {
      handler(formData.b2b_city, cities, setDistricts);
    }

    // B2C
    if (formData.b2c_country === "Indonesia" && formData.b2c_city) {
      handler(formData.b2c_city, citiesB2C, setDistrictsB2C);
    }
  }, [
    formData.b2b_city,
    formData.b2c_city,
    formData.b2b_country,
    formData.b2c_country,
    cities,
    citiesB2C,
  ]);

  // kelurahan
  useEffect(() => {
    const handler = async (
      distName: string,
      districtRef: any[],
      setSubFn: any,
    ) => {
      const dist = districtRef.find((d) => d.name === distName);
      if (dist) {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${dist.id}.json`,
        );
        const data = await res.json();
        setSubFn(data);
      } else {
        setSubFn([]);
      }
    };

    // B2B
    if (formData.b2b_country === "Indonesia" && formData.b2b_district) {
      handler(formData.b2b_district, districts, setSubDistrict);
    }

    // B2C
    if (formData.b2c_country === "Indonesia" && formData.b2c_district) {
      handler(formData.b2c_district, districtsB2C, setSubDistrictB2C);
    }
  }, [
    formData.b2b_district,
    formData.b2c_district,
    formData.b2b_country,
    formData.b2c_country,
    districts,
    districtsB2C,
  ]);

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
      if (!formData.b2b_purchaseChannelId)
        return toast.error("Saluran pembelian wajib dipilih");
      // Validasi logo jika nama brand diisi
      if (formData.b2b_brandName && !formData.b2b_brandLogoFile) {
        return toast.error("File Logo wajib diunggah jika Nama Brand diisi!");
      }
    }

    if (clientType === "B2C") {
      if (!formData.b2c_name) return toast.error("Nama lengkap wajib diisi");
      if (!formData.b2c_purchaseChannelIdB2C)
        return toast.error("Saluran pembelian wajib dipilih");
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

        // Kirim array PIC sebagai string JSON
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

        if (formData.b2b_brandName) {
          formDataPayload.append("brandName", formData.b2b_brandName);
        }
        if (formData.b2b_brandWebsiteUrl) {
          formDataPayload.append(
            "brandWebsiteUrl",
            formData.b2b_brandWebsiteUrl,
          );
        }
        if (formData.b2b_brandLogoFile) {
          formDataPayload.append("logoFile", formData.b2b_brandLogoFile);
        }
      } else {
        // ... (B2C Payload Append Logic)
        formDataPayload.append("name", formData.b2c_name || "");
        formDataPayload.append(
          "purchaseChannelIdB2C",
          formData.b2c_purchaseChannelIdB2C || "",
        );
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
        href="/client-management/clients"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
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
            {/* === FIELD DASAR === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Klien *</Label>
                <Select
                  onValueChange={(value: ClientType) => handleTypeChange(value)}
                  value={clientType}>
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

            {/* === FORM B2B === */}
            {clientType === "B2B" && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detail Perusahaan (B2B)
                </h3>

                {/* === COMPANY CONTACT === */}
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
                    <Label>Email Kantor </Label>
                    <Input
                      name="b2b_email"
                      type="email"
                      value={formData.b2b_email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Telepon Kantor </Label>
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

                  {/* PURCHASE CHANNEL */}
                  <div className="space-y-2">
                    <Label>Saluran Pembelian *</Label>
                    <Select
                      value={formData.b2b_purchaseChannelId}
                      onValueChange={(value) => {
                        if (value === "ADD_NEW_PC") {
                          setPcModalTrigger("B2B");
                          setIsPcModalOpen(true);
                          return;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          b2b_purchaseChannelId: value,
                        }));
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Saluran Pembelian" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {purchaseChannels.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_PC"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Saluran Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* DEPARTMENT */}
                  <div className="space-y-2">
                    <Label>Departemen *</Label>
                    <Select
                      value={formData.b2b_departmentId}
                      onValueChange={(value) => {
                        // ✨ TRIGGER MODAL JIKA "ADD_NEW_DEP" DIPILIH
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
                      <SelectContent aria-required>
                        {departments.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            {dep.name}
                          </SelectItem>
                        ))}
                        {/* ✨ TOMBOL TAMBAH DI DALAM DROPDOWN */}
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

                <h3 className="text-lg font-semibold border-b pb-2">Alamat</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 flex flex-col">
                    <Label>Negara</Label>
                    <Popover
                      open={openB2BCountry}
                      onOpenChange={setOpenB2BCountry}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openB2BCountry}
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
                                  onSelect={(currentValue) => {
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

                  {/* === PROVINCE === */}
                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    {formData.b2b_country === "Indonesia" ? (
                      <Select
                        value={formData.b2b_province}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_province: value,
                            b2b_city: "",
                            b2b_district: "",
                            b2b_subDistrict: "",
                            b2b_postalCode: "",
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((prov) => (
                            <SelectItem key={prov.id} value={prov.name}>
                              {prov.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>

                  {/* === CITY === */}
                  <div className="space-y-2">
                    <Label>Kota / Kabupaten </Label>
                    {formData.b2b_country === "Indonesia" ? (
                      <Select
                        disabled={!formData.b2b_province}
                        value={formData.b2b_city}
                        onValueChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_city: val,
                            b2b_district: "",
                            b2b_subDistrict: "",
                            b2b_postalCode: "",
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kota / Kabupaten" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>

                  {/* === DISTRICT B2B === */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Kecamatan</Label>
                      {formData.b2b_country === "Indonesia" &&
                        formData.b2b_city && (
                          <button
                            type="button"
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => {
                              setManualDistrictB2B((prev) => !prev);
                              setFormData((prev) => ({
                                ...prev,
                                b2b_district: "",
                                b2b_subDistrict: "",
                              }));
                            }}>
                            {manualDistrictB2B
                              ? "Pilih dari daftar"
                              : "Ketik manual"}
                          </button>
                        )}
                    </div>

                    {formData.b2b_country === "Indonesia" &&
                    !manualDistrictB2B ? (
                      <Select
                        disabled={!formData.b2b_city}
                        value={formData.b2b_district}
                        onValueChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_district: val,
                            b2b_subDistrict: "",
                            b2b_postalCode: "",
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kecamatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((d) => (
                            <SelectItem key={d.id} value={d.name}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Masukkan Kecamatan"
                        value={formData.b2b_district}
                        disabled={!formData.b2b_city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_district: e.target.value,
                            b2b_subDistrict: "",
                          }))
                        }
                      />
                    )}
                  </div>

                  {/* === SUB-DISTRICT B2B === */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Kelurahan</Label>
                      {formData.b2b_country === "Indonesia" &&
                        formData.b2b_district && (
                          <button
                            type="button"
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => {
                              setManualSubDistrictB2B((prev) => !prev);
                              setFormData((prev) => ({
                                ...prev,
                                b2b_subDistrict: "",
                              }));
                            }}>
                            {manualSubDistrictB2B
                              ? "Pilih dari daftar"
                              : "Ketik manual"}
                          </button>
                        )}
                    </div>

                    {formData.b2b_country === "Indonesia" &&
                    !manualSubDistrictB2B ? (
                      <Select
                        disabled={!formData.b2b_district}
                        value={formData.b2b_subDistrict}
                        onValueChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_subDistrict: val,
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kelurahan" />
                        </SelectTrigger>
                        <SelectContent>
                          {subDistricts.map((v) => (
                            <SelectItem key={v.id} value={v.name}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Masukkan Kelurahan"
                        value={formData.b2b_subDistrict}
                        disabled={!formData.b2b_district}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_subDistrict: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>

                  {/* === POSTAL CODE === */}
                  <div className="space-y-2">
                    <Label>Kode Pos </Label>
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

                {/* === ADDRESS COMPANY === */}
                <div className="space-y-2 mt-4">
                  <Label>Alamat Lengkap </Label>
                  <Textarea
                    name="b2b_fullAddress"
                    value={formData.b2b_fullAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* === BRAND CLIENT (OPSIONAL) === */}
                <h4 className="font-medium mt-8 mb-2 border-b pb-2">
                  Brand Client (Opsional)
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Isi bagian ini jika perusahaan ini memiliki brand spesifik
                  yang ingin ditampilkan logonya.
                </p>

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
                      // === TAMPILAN PREVIEW GAMBAR ===
                      <div className="relative w-40 h-40 rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
                        {/* Generate URL sementara untuk preview */}
                        <img
                          src={URL.createObjectURL(formData.b2b_brandLogoFile)}
                          alt="Preview Logo"
                          className="w-full h-full object-contain bg-white p-2"
                        />
                        {/* Tombol Hapus (Muncul saat di-hover) */}
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
                      // === TAMPILAN AREA UPLOAD ===
                      <div className="flex items-center justify-center w-full max-w-md">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 border-gray-300 hover:border-primary transition-all">
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
                          {/* Input file disembunyikan */}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setFormData((prev) => ({
                                ...prev,
                                b2b_brandLogoFile: file,
                              }));
                            }}
                          />
                        </label>
                      </div>
                    )}

                    {/* Validasi Peringatan */}
                    {formData.b2b_brandName && !formData.b2b_brandLogoFile && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        ⚠️ Logo wajib diunggah karena Anda mengisi Nama Brand.
                      </p>
                    )}
                  </div>
                </div>

                {/* === MULTIPLE PIC === */}
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

                  const removePic = () => {
                    setFormData((prev) => ({
                      ...prev,
                      b2b_pics: prev.b2b_pics.filter((_, i) => i !== index),
                    }));
                  };

                  return (
                    <Card
                      key={index}
                      className="p-4 bg-card shadow-sm relative mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* DELETE BUTTON */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={removePic}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>

                        {/* PREFIX */}

                        <div className="space-y-2">
                          <Label>Prefix</Label>
                          <Select
                            value={pic.prefix}
                            onValueChange={(value) =>
                              updateField("prefix", value)
                            }>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder="Select prefix"
                                className="w-full"
                              />
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

                        {/* EMAIL & PHONE */}

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

            {/* === FORM B2C === */}
            {clientType === "B2C" && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detail Individu (B2C)
                </h3>

                {/* PREFIX + NAME */}
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

                {/* PHONE + PURCHASE CHANNEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telepon</Label>
                    <Input
                      name="b2c_phone"
                      value={formData.b2c_phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Saluran Pembelian *</Label>
                    <Select
                      value={formData.b2c_purchaseChannelIdB2C}
                      onValueChange={(value) => {
                        // ✨ TRIGGER MODAL JIKA "ADD_NEW_PC" DIPILIH
                        if (value === "ADD_NEW_PC") {
                          setPcModalTrigger("B2C");
                          setIsPcModalOpen(true);
                          return;
                        }
                        setFormData((prev) => ({
                          ...prev,
                          b2c_purchaseChannelIdB2C: value,
                        }));
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih saluran pembelian" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseChannels?.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}
                        {/* ✨ TOMBOL TAMBAH DI DALAM DROPDOWN */}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_PC"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Saluran Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* === ADDRESS ====================== */}
                <h3 className="text-lg font-semibold border-b pb-2">Alamat</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* COUNTRY */}
                  <div className="space-y-2">
                    <Label>Negara </Label>
                    <Select
                      value={formData.b2c_country}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_country: value,
                          b2c_province: "",
                          b2c_city: "",
                          b2c_district: "",
                          b2c_subDistrict: "",
                          b2c_postalCode: "",
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Negara" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span> {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* PROVINCE */}
                  <div className="space-y-2">
                    <Label>Provinsi </Label>
                    {formData.b2c_country === "Indonesia" ? (
                      <Select
                        value={formData.b2c_province}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_province: v,
                            b2c_city: "",
                            b2c_district: "",
                            b2c_subDistrict: "",
                            b2c_postalCode: "",
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((prov) => (
                            <SelectItem key={prov.id} value={prov.name}>
                              {prov.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>
                  {/* CITY */}
                  <div className="space-y-2">
                    <Label>Kota / Kabupaten </Label>
                    {formData.b2c_country === "Indonesia" ? (
                      <Select
                        disabled={!formData.b2c_province}
                        value={formData.b2c_city}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_city: v,
                            b2c_district: "",
                            b2c_subDistrict: "",
                            b2c_postalCode: "",
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kota / Kabupaten" />
                        </SelectTrigger>
                        <SelectContent>
                          {citiesB2C.map((city) => (
                            <SelectItem key={city.id} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>
                  {/* === DISTRICT B2C === */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Kecamatan</Label>
                      {formData.b2c_country === "Indonesia" &&
                        formData.b2c_city && (
                          <button
                            type="button"
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => {
                              setManualDistrictB2C((prev) => !prev);
                              setFormData((prev) => ({
                                ...prev,
                                b2c_district: "",
                                b2c_subDistrict: "",
                              }));
                            }}>
                            {manualDistrictB2C
                              ? "Pilih dari daftar"
                              : "Ketik manual"}
                          </button>
                        )}
                    </div>

                    {formData.b2c_country === "Indonesia" &&
                    !manualDistrictB2C ? (
                      <Select
                        disabled={!formData.b2c_city}
                        value={formData.b2c_district}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_district: v,
                            b2c_subDistrict: "",
                            b2c_postalCode: "",
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kecamatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {districtsB2C.map((d) => (
                            <SelectItem key={d.id} value={d.name}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Masukkan Kecamatan"
                        value={formData.b2c_district}
                        disabled={!formData.b2c_city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_district: e.target.value,
                            b2c_subDistrict: "",
                          }))
                        }
                      />
                    )}
                  </div>
                  {/* === SUBDISTRICT B2C === */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Kelurahan</Label>
                      {formData.b2c_country === "Indonesia" &&
                        formData.b2c_district && (
                          <button
                            type="button"
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => {
                              setManualSubDistrictB2C((prev) => !prev);
                              setFormData((prev) => ({
                                ...prev,
                                b2c_subDistrict: "",
                              }));
                            }}>
                            {manualSubDistrictB2C
                              ? "Pilih dari daftar"
                              : "Ketik manual"}
                          </button>
                        )}
                    </div>

                    {formData.b2c_country === "Indonesia" &&
                    !manualSubDistrictB2C ? (
                      <Select
                        disabled={!formData.b2c_district}
                        value={formData.b2c_subDistrict}
                        onValueChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_subDistrict: v,
                          }))
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kelurahan" />
                        </SelectTrigger>
                        <SelectContent>
                          {subDistrictB2C.map((v) => (
                            <SelectItem key={v.id} value={v.name}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Masukkan Kelurahan"
                        value={formData.b2c_subDistrict}
                        disabled={!formData.b2c_district}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_subDistrict: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                  {/* POSTAL CODE */}
                  <div className="space-y-2">
                    <Label>Kode Pos </Label>
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

                {/* FULL ADDRESS */}
                <div className="space-y-2">
                  <Label>Alamat Lengkap </Label>
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
            variant="success"
            disabled={clientType === ""}>
            <ClipboardList className="h-4 w-4 " />
            Simpan Klien Baru
          </Button>
        </div>
      </form>

      <Dialog open={isPcModalOpen} onOpenChange={setIsPcModalOpen}>
        <DialogContent className="sm:max-w-135">
          <DialogHeader>
            <DialogTitle>Tambah Saluran Pembelian</DialogTitle>
          </DialogHeader>
          <PurchaseChannelForm onSubmit={handleAddPurchaseChannel} />
        </DialogContent>
      </Dialog>

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
