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
import { ChevronLeft, ClipboardList, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { apiUrl } from "@/helper/apiurl";
import { countries } from "@/lib/countries";

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
    []
  );
  const [departments, setDepartments] = useState<Departement[]>([]);

  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        if (!token) throw new Error("No token found");

        // Fetch purchase channels
        const pcRes = await fetch(`${apiUrl}/purchase-channels/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pcData = await pcRes.json();
        setPurchaseChannels(pcData);

        // Fetch departments
        const depRes = await fetch(`${apiUrl}/departments/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const depData = await depRes.json();
        setDepartments(depData);
      } catch (err) {
        console.error("❌ Failed to fetch master data:", err);
        toast.error("Gagal mengambil data Purchase Channel / Departemen");
      }
    };

    fetchMasterData();
  }, []);

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
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`
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
      setDistrictFn: any
    ) => {
      const city = citiesRef.find((c) => c.name === cityName);
      if (city) {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`
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
      setSubFn: any
    ) => {
      const dist = districtRef.find((d) => d.name === distName);
      if (dist) {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${dist.id}.json`
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    const validation = clientSchema.safeParse({
      type: formData.type,
    });
    if (!validation.success) {
      toast("error");
      return;
    }

    if (!session) {
      toast("Kamu belum login!");
      return;
    }

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const payload =
        clientType === "B2C"
          ? {
              type: "B2C",

              custCode: formData.custCode,

              // === B2C ===
              name: formData.b2c_name,
              prefix: formData.b2c_prefix,
              phone: formData.b2c_phone,

              // ADDRESS
              country: formData.b2c_country,
              province: formData.b2c_province,
              city: formData.b2c_city,
              district: formData.b2c_district,
              subDistrict: formData.b2c_subDistrict,
              postalCode: formData.b2c_postalCode,

              fullAddress: formData.b2c_fullAddressB2C,
              purchaseChannelId: formData.b2c_purchaseChannelIdB2C,
            }
          : {
              type: "B2B",

              custCode: formData.custCode,

              // === B2B ===
              companyName: formData.b2b_companyName,
              departmentId: formData.b2b_departmentId,
              phone: formData.b2b_phone,
              email: formData.b2b_email,
              website: formData.b2b_website,

              // ADDRESS
              country: formData.b2b_country,
              province: formData.b2b_province,
              city: formData.b2b_city,
              district: formData.b2b_district, // kecamatan
              subDistrict: formData.b2b_subDistrict, // kelurahan
              postalCode: formData.b2b_postalCode,

              fullAddress: formData.b2b_fullAddress,
              purchaseChannelId: formData.b2b_purchaseChannelId,

              // MULTIPLE PIC
              pics: formData.b2b_pics.map((pic) => ({
                prefix: pic.prefix,
                name: pic.name,
                email: pic.email,
                phone: pic.phone,
              })),
            };

      await fetch(`${apiUrl}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      toast.success("Client berhasil ditambahkan!");
      router.push("/super-admin/clients");
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengirim data.");
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
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_purchaseChannelId: value,
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Saluran Pembelian" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseChannels.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* DEPARTMENT */}
                  <div className="space-y-2">
                    <Label>Departemen *</Label>
                    <Select
                      value={formData.b2b_departmentId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_departmentId: value,
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Departemen" />
                      </SelectTrigger>
                      <SelectContent aria-required>
                        {departments.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            {dep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2">Alamat</h3>
                {/* === ADDRESS SECTION === */}
                <div className="grid grid-cols-3 gap-4">
                  {/* === COUNTRY === */}
                  <div className="space-y-2">
                    <Label>Negara</Label>
                    <Select
                      value={formData.b2b_country}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_country: value,
                          b2b_province: "",
                          b2b_city: "",
                          b2b_district: "",
                          b2b_subDistrict: "",
                          b2b_postalCode: "",
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

                  {/* === DISTRICT === */}
                  <div className="space-y-2">
                    <Label>Kecamatan </Label>
                    {formData.b2b_country === "Indonesia" ? (
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
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2b_district: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>

                  {/* === SUB-DISTRICT === */}
                  <div className="space-y-2">
                    <Label>Kelurahan </Label>
                    {formData.b2b_country === "Indonesia" ? (
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

                {/* === MULTIPLE PIC === */}
                <h4 className="font-medium mt-8 mb-2 border-b pb-2">
                  PIC (Person In Charge)
                </h4>

                {formData.b2b_pics.map((pic, index) => {
                  const updateField = (
                    field: keyof PICFormData,
                    value: string
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
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2c_purchaseChannelIdB2C: value,
                        }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih saluran pembelian" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchaseChannels?.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}
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

                  {/* DISTRICT */}
                  <div className="space-y-2">
                    <Label>Kecamatan </Label>
                    {formData.b2c_country === "Indonesia" ? (
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
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            b2c_district: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>

                  {/* SUBDISTRICT */}
                  <div className="space-y-2">
                    <Label>Kelurahan </Label>
                    {formData.b2c_country === "Indonesia" ? (
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
    </div>
  );
}
