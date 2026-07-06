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
import { useApi } from "@/hooks/useApi";
import { countries } from "@/lib/countries";
import {
  Barcode,
  ChevronLeft,
  ClipboardList,
  Trash2,
  UserRoundPlus,
} from "lucide-react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
  custCode: string;
  type: ClientType;

  // b2c
  b2c_name: string;
  b2c_prefix: string;
  b2c_phone: string;
  b2c_country: string;
  b2c_province: string;
  b2c_city: string;
  b2c_district: string;
  b2c_subDistrict: string;
  b2c_postalCode: string;
  b2c_fullAddressB2C: string;
  b2c_purchaseChannelIdB2C: string;

  // b2b
  b2b_companyName: string;
  b2b_departmentId: string;

  b2b_phone: string;
  b2b_email: string;
  b2b_website: string;
  b2b_country: string;
  b2b_province: string;
  b2b_city: string;
  b2b_district: string;
  b2b_subDistrict: string;
  b2b_postalCode: string;
  b2b_fullAddress: string;
  // MULTIPLE PIC
  b2b_pics: PICFormData[]; // NEW (multiple PICs)
}

const initialFormData: ClientFormData = {
  custCode: "",
  type: "",

  // b2c
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

  // b2b
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

  // MULTIPLE PIC
  b2b_pics: [{ prefix: "", name: "", email: "", phone: "" }],
};

export default function ClientEditForm() {
  const { fetchApi, status } = useApi();

  const [formData, setFormData] = useState<ClientFormData>(initialFormData);

  const [clientType, setClientType] = useState<ClientType>("");
  const [provinces, setProvinces] = useState<any[]>([]);
  // b2b
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
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId;

  const [manualDistrictB2B, setManualDistrictB2B] = useState(false);
  const [manualSubDistrictB2B, setManualSubDistrictB2B] = useState(false);
  const [manualDistrictB2C, setManualDistrictB2C] = useState(false);
  const [manualSubDistrictB2C, setManualSubDistrictB2C] = useState(false);

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
  // === FETCH PROVINCE ===
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

  useEffect(() => {
    const fetchClient = async () => {
      if (status === "loading" || status === "unauthenticated" || !clientId)
        return;

      try {
        const res = await fetchApi(`/clients/${clientId}`);

        if (!res.ok) throw new Error("Gagal mengambil data klien");

        const data = await res.json();

        // === HANDLE B2B ===
        if (data.type === "B2B" && data.b2b) {
          setClientType("B2B");

          setFormData({
            ...initialFormData,
            custCode: data.custCode || "",
            type: "B2B",

            // B2B FIELDS
            b2b_companyName: data.b2b.companyName || "",
            b2b_departmentId: data.b2b.department?.id || "",
            b2b_phone: data.b2b.phone || "",
            b2b_email: data.b2b.email || "",
            b2b_website: data.b2b.website || "",
            b2b_country: data.b2b.country || "",
            b2b_province: data.b2b.province || "",
            b2b_city: data.b2b.city || "",
            b2b_district: data.b2b.district || "",
            b2b_subDistrict: data.b2b.subDistrict || "",
            b2b_postalCode: data.b2b.postalCode || "",
            b2b_fullAddress: data.b2b.fullAddress || "",

            // MULTIPLE PICS
            b2b_pics:
              data.b2b.pics?.length > 0
                ? data.b2b.pics.map((p: any) => ({
                    prefix: p.prefix || "",
                    name: p.name || "",
                    email: p.email || "",
                    phone: p.phone || "",
                  }))
                : [
                    {
                      prefix: "",
                      name: "",
                      email: "",
                      phone: "",
                    },
                  ],
          });
          if (data.b2b.district) setManualDistrictB2B(true);
          if (data.b2b.subDistrict) setManualSubDistrictB2B(true);
        }

        // === HANDLE B2C ===
        else if (data.type === "B2C" && data.b2c) {
          setClientType("B2C");

          setFormData({
            ...initialFormData,

            custCode: data.custCode || "",
            type: "B2C",

            // B2C FIELDS
            b2c_prefix: data.b2c.prefix || "",
            b2c_name: data.b2c.name || "",
            b2c_phone: data.b2c.phone || "",

            b2c_country: data.b2c.country || "",
            b2c_province: data.b2c.province || "",
            b2c_city: data.b2c.city || "",
            b2c_district: data.b2c.district || "",
            b2c_subDistrict: data.b2c.subDistrict || "",
            b2c_postalCode: data.b2c.postalCode || "",

            b2c_fullAddressB2C: data.b2c.fullAddress || "",
            b2c_purchaseChannelIdB2C: data.b2c.purchaseChannel?.id || "",
          });
          if (data.b2c.district) setManualDistrictB2C(true);
          if (data.b2c.subDistrict) setManualSubDistrictB2C(true);
        }

        // === INVALID ===
        else {
          toast.error("Data klien tidak valid atau kosong.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data klien.");
      }
    };

    fetchClient();
  }, [clientId, status, fetchApi]); // Dependensi lengkap

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

    try {
      let payload: any = {
        custCode: formData.custCode,
        type: clientType,
      };

      // === PAYLOAD B2C ===
      if (clientType === "B2C") {
        payload = {
          ...payload,

          prefix: formData.b2c_prefix,
          name: formData.b2c_name,
          phone: formData.b2c_phone,

          country: formData.b2c_country,
          province: formData.b2c_province,
          city: formData.b2c_city,
          district: formData.b2c_district,
          subDistrict: formData.b2c_subDistrict,
          postalCode: formData.b2c_postalCode,

          fullAddress: formData.b2c_fullAddressB2C,
          purchaseChannelId: formData.b2c_purchaseChannelIdB2C,
        };
      }

      // === PAYLOAD B2B ===
      if (clientType === "B2B") {
        payload = {
          ...payload,

          companyName: formData.b2b_companyName,
          departmentId: formData.b2b_departmentId,

          phone: formData.b2b_phone,
          email: formData.b2b_email,
          website: formData.b2b_website,

          country: formData.b2b_country,
          province: formData.b2b_province,
          city: formData.b2b_city,
          district: formData.b2b_district,
          subDistrict: formData.b2b_subDistrict,
          postalCode: formData.b2b_postalCode,

          fullAddress: formData.b2b_fullAddress,

          // STANDARDIZED PIC ARRAY
          pics: formData.b2b_pics.map((pic) => ({
            prefix: pic.prefix,
            name: pic.name,
            email: pic.email,
            phone: pic.phone,
          })),
        };
      }

      const res = await fetchApi(`/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal memperbarui client");
      }

      toast.success("Klien berhasil diperbarui!");
      router.push("/super-admin/clients");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat update data.");
    }
  };

  const B2BFormFields = (
    <>
      <h3 className="text-lg font-semibold border-b pb-2">Detail Perusahaan</h3>

      {/* ========================= */}
      {/* COMPANY GENERAL FIELDS */}
      {/* ========================= */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nama Perusahaan *</Label>
          <Input
            name="b2b_companyName"
            value={formData.b2b_companyName}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Email Kantor </Label>
          <Input
            name="b2b_email"
            value={formData.b2b_email}
            onChange={handleChange}
          />
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
            <SelectContent>
              {departments.map((dep) => (
                <SelectItem key={dep.id} value={dep.id}>
                  {dep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold border-b pb-2">Alamat</h3>
      {/* === ADDRESS SECTION === */}
      <div className="grid grid-cols-3 gap-4">
        {/* === COUNTRY === */}
        <div className="space-y-2">
          <Label>Negara </Label>
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
          <Label>Provinsi </Label>
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
            {formData.b2b_country === "Indonesia" && formData.b2b_city && (
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
                  setManualSubDistrictB2B(false);
                }}>
                {manualDistrictB2B ? "Pilih dari daftar" : "Ketik manual"}
              </button>
            )}
          </div>

          {formData.b2b_country === "Indonesia" && !manualDistrictB2B ? (
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
            {formData.b2b_country === "Indonesia" && formData.b2b_district && (
              <button
                type="button"
                className="text-xs text-blue-500 hover:underline"
                onClick={() => {
                  setManualSubDistrictB2B((prev) => !prev);
                  setFormData((prev) => ({ ...prev, b2b_subDistrict: "" }));
                }}>
                {manualSubDistrictB2B ? "Pilih dari daftar" : "Ketik manual"}
              </button>
            )}
          </div>

          {formData.b2b_country === "Indonesia" && !manualSubDistrictB2B ? (
            <Select
              disabled={!formData.b2b_district}
              value={formData.b2b_subDistrict}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, b2b_subDistrict: val }))
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
      {/* ========================= */}
      {/* PIC SECTION */}
      {/* ========================= */}
      <h4 className="font-medium mt-8 mb-3 border-b pb-2">
        PIC (Person In Charge)
      </h4>

      {formData.b2b_pics.map((pic, index) => {
        const updateField = (field: keyof PICFormData, value: string) => {
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
          <Card key={index} className="p-4 bg-card shadow-sm relative mb-4">
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
                  onValueChange={(value) => updateField("prefix", value)}>
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
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              {/* EMAIL & PHONE */}

              <div className="space-y-2">
                <Label>Email PIC</Label>
                <Input
                  value={pic.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Telepon PIC</Label>
                <Input
                  value={pic.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>
          </Card>
        );
      })}

      {/* ADD PIC */}
      <Button
        variant="secondary"
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
    </>
  );

  const B2CFormFields = (
    <>
      <h3 className="text-lg font-semibold border-b pb-2">Detail Individu</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 space-y-2">
          <div className="space-y-2">
            <Label htmlFor="b2c_prefix">Prefix (Mr./Ms.)</Label>
            <Select
              name="b2c_prefix"
              value={formData.b2c_prefix}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, b2c_prefix: value }))
              }>
              <SelectTrigger id="b2c_prefix">
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
          <div className=" space-y-2">
            <Label>Nama Lengkap *</Label>
            <Input
              name="b2c_name"
              value={formData.b2c_name}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 space-y-2">
          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input
              name="b2c_phone"
              value={formData.b2c_phone}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b2c_purchaseChannelIdB2C">
              Saluran Pembelian *
            </Label>
            <Select
              name="b2c_purchaseChannelIdB2C"
              value={formData.b2c_purchaseChannelIdB2C}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  b2c_purchaseChannelIdB2C: value,
                }))
              }>
              <SelectTrigger id="b2c_purchaseChannelIdB2C">
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
            <Label>Negara *</Label>
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
            <Label>Provinsi *</Label>
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
              {formData.b2c_country === "Indonesia" && formData.b2c_city && (
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
                    setManualSubDistrictB2C(false);
                  }}>
                  {manualDistrictB2C ? "Pilih dari daftar" : "Ketik manual"}
                </button>
              )}
            </div>

            {formData.b2c_country === "Indonesia" && !manualDistrictB2C ? (
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
                      setFormData((prev) => ({ ...prev, b2c_subDistrict: "" }));
                    }}>
                    {manualSubDistrictB2C
                      ? "Pilih dari daftar"
                      : "Ketik manual"}
                  </button>
                )}
            </div>

            {formData.b2c_country === "Indonesia" && !manualSubDistrictB2C ? (
              <Select
                disabled={!formData.b2c_district}
                value={formData.b2c_subDistrict}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, b2c_subDistrict: v }))
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
    </>
  );

  return (
    <div className="space-y-6">
      <Link
        href={`${`/super-admin/clients/detail/${clientId}`}`}
        // href="/super-admin/clients"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Klien
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Klien</CardTitle>
            <CardDescription>
              Perbarui informasi klien sesuai kebutuhan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  Kode Klien
                </Label>
                <Input
                  name="custCode"
                  value={formData.custCode}
                  onChange={handleChange}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserRoundPlus className="h-4 w-4 text-muted-foreground" />
                  Tipe Klien
                </Label>
                <Select
                  value={clientType}
                  onValueChange={handleTypeChange}
                  disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipe Klien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B">B2B</SelectItem>
                    <SelectItem value="B2C">B2C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {clientType === "B2B" && B2BFormFields}
            {clientType === "B2C" && B2CFormFields}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button variant={"success"} className="cursor-pointer" type="submit">
            <ClipboardList className="h-4 w-4 " />
            Update Klien
          </Button>
        </div>
      </form>
    </div>
  );
}
