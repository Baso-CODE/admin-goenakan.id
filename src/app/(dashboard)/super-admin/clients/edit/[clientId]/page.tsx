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
  b2c_fullAddressB2C: string;
  b2c_purchaseChannelIdB2C: string;

  // b2b
  b2b_companyName: string;
  b2b_departmentId: string;

  b2b_phone: string;
  b2b_email: string;
  b2b_website: string;
  b2b_province: string;
  b2b_city: string;
  b2b_fullAddress: string;
  b2b_purchaseChannelId: string;
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
  b2c_fullAddressB2C: "",
  b2c_purchaseChannelIdB2C: "",

  // b2b
  b2b_companyName: "",
  b2b_departmentId: "",
  b2b_phone: "",
  b2b_email: "",
  b2b_website: "",
  b2b_province: "",
  b2b_city: "",
  b2b_fullAddress: "",
  b2b_purchaseChannelId: "",

  // MULTIPLE PIC
  b2b_pics: [{ prefix: "", name: "", email: "", phone: "" }],
};

const ClientEditForm: React.FC = () => {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [purchaseChannels, setPurchaseChannels] = useState<PurchaseChannel[]>(
    []
  );
  const [departments, setDepartments] = useState<Departement[]>([]);
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId;

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        if (!token) throw new Error("No token found");

        // Fetch purchase channels
        const pcRes = await fetch(
          "http://localhost:8000/purchase-channels/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const pcData = await pcRes.json();
        setPurchaseChannels(pcData);

        // Fetch departments
        const depRes = await fetch("http://localhost:8000/departments/list", {
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
  // === FETCH PROVINCE ===
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error fetch provinces:", err));
  }, []);

  // === FETCH CITY BERDASARKAN PROVINSI ===
  useEffect(() => {
    if (formData.b2b_province) {
      const prov = provinces.find((p) => p.name === formData.b2b_province);
      if (prov) {
        fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`
        )
          .then((res) => res.json())
          .then((data) => setCities(data))
          .catch((err) => console.error("Error fetch cities:", err));
      }
    } else {
      setCities([]);
    }
  }, [formData.b2b_province, provinces]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`http://localhost:8000/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data klien");

        const data = await res.json();

        setFormData((prev) => ({
          ...initialFormData, // reset form
          custCode: data.custCode || "",
          type: data.type || "",
        }));

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
            b2b_province: data.b2b.province || "",
            b2b_city: data.b2b.city || "",
            b2b_fullAddress: data.b2b.fullAddress || "",
            b2b_purchaseChannelId: data.b2b.purchaseChannel?.id || "",

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
            b2c_fullAddressB2C: data.b2c.fullAddress || "",
            b2c_purchaseChannelIdB2C: data.b2c.purchaseChannel?.id || "",
          });
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
  }, [clientId]);

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

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

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
          province: formData.b2b_province,
          city: formData.b2b_city,
          fullAddress: formData.b2b_fullAddress,
          purchaseChannelId: formData.b2b_purchaseChannelId,
          pics: formData.b2b_pics, // array PIC B2B
        };
      }

      await fetch(`http://localhost:8000/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
          <Label>Saluran Pembelian *</Label>
          <Select
            value={formData.b2b_purchaseChannelId}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                b2b_purchaseChannelId: value,
              }))
            }
          >
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
          <Label>Departemen</Label>
          <Select
            value={formData.b2b_departmentId}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                b2b_departmentId: value,
              }))
            }
          >
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

        {/* ALAMAT */}
        <div className="space-y-2">
          <Label>Alamat Lengkap *</Label>
          <Textarea
            name="b2b_fullAddress"
            value={formData.b2b_fullAddress}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* CONTACT + WEBSITE */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label>Email Kantor *</Label>
          <Input
            name="b2b_email"
            value={formData.b2b_email}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Website</Label>
          <Input
            name="b2b_website"
            value={formData.b2b_website}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* PROVINCE + CITY + PHONE */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="space-y-2">
          <Label>Telepon Kantor</Label>
          <Input
            name="b2b_phone"
            value={formData.b2b_phone}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Provinsi *</Label>
          <Select
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                b2b_province: val,
                b2b_city: "",
              }))
            }
            value={formData.b2b_province}
          >
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
        </div>

        <div className="space-y-2">
          <Label>Kota/Kabupaten *</Label>
          <Select
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, b2b_city: val }))
            }
            value={formData.b2b_city}
            disabled={!formData.b2b_province}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kota" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ========================= */}
      {/* PIC SECTION */}
      {/* ========================= */}
      <h4 className="font-medium mt-8 mb-3">PIC (Person In Charge)</h4>

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
            {/* DELETE BUTTON */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={removePic}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>

            {/* PREFIX */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prefix</Label>
                <Select
                  value={pic.prefix}
                  onValueChange={(value) => updateField("prefix", value)}
                >
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
            </div>

            {/* EMAIL & PHONE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
        }
      >
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
              }
            >
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
            <Label>Telepon *</Label>
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
              }
            >
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
        <div className="space-y-2">
          <Label htmlFor="b2c_fullAddressB2C">Alamat Lengkap *</Label>
          <Textarea
            id="b2c_fullAddressB2C"
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
        href="/super-admin/clients"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
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
                  disabled
                >
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
};

export default ClientEditForm;
