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
import { ChevronLeft, ClipboardList, UserRoundPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
type ClientType = "B2B" | "B2C" | "";

interface ClientFormData {
  custCode: string;
  type: ClientType;
  b2c_prefix: string;
  b2c_name: string;
  b2c_phone: string;
  b2c_fullAddress: string;
  b2c_purchaseChannel: string;
  b2b_companyName: string;
  b2b_department: string;
  b2b_prefix: string;
  b2b_picName: string;
  b2b_phone: string;
  b2b_email: string;
  b2b_website: string;
  b2b_province: string;
  b2b_city: string;
  b2b_purchaseChannel: string;
}

const initialFormData: ClientFormData = {
  custCode: "",
  type: "",
  b2c_prefix: "",
  b2c_name: "",
  b2c_phone: "",
  b2c_fullAddress: "",
  b2c_purchaseChannel: "",
  b2b_companyName: "",
  b2b_department: "",
  b2b_prefix: "",
  b2b_picName: "",
  b2b_phone: "",
  b2b_email: "",
  b2b_website: "",
  b2b_province: "",
  b2b_city: "",
  b2b_purchaseChannel: "",
};

const ClientEditForm: React.FC = () => {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId;

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Gagal mengambil data klien");

        const data = await res.json();

        if (data.type === "B2B" && data.b2b) {
          setClientType("B2B");
          setFormData({
            ...initialFormData,
            custCode: data.custCode || "",
            type: "B2B",
            b2b_companyName: data.b2b.companyName || "",
            b2b_department: data.b2b.department || "",
            b2b_prefix: data.b2b.prefix || "",
            b2b_picName: data.b2b.picName || "",
            b2b_phone: data.b2b.phone || "",
            b2b_email: data.b2b.email || "",
            b2b_website: data.b2b.website || "",
            b2b_province: data.b2b.province || "",
            b2b_city: data.b2b.city || "",
            b2b_purchaseChannel: data.b2b.purchaseChannel || "",
          });
        } else if (data.type === "B2C" && data.b2c) {
          setClientType("B2C");
          setFormData({
            ...initialFormData,
            custCode: data.custCode || "",
            type: "B2C",
            b2c_prefix: data.b2c.prefix || "",
            b2c_name: data.b2c.name || "",
            b2c_phone: data.b2c.phone || "",
            b2c_fullAddress: data.b2c.fullAddress || "",
            b2c_purchaseChannel: data.b2c.purchaseChannel || "",
          });
        } else {
          toast.error("Data klien tidak valid atau kosong.");
        }
      } catch (error) {
        console.error(error);
        toast("Gagal memuat data klien.");
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
      const payload =
        clientType === "B2C"
          ? {
              type: "B2C",
              custCode: formData.custCode,
              prefix: formData.b2c_prefix,
              name: formData.b2c_name,
              phone: formData.b2c_phone,
              fullAddress: formData.b2c_fullAddress,
              purchaseChannel: formData.b2c_purchaseChannel,
            }
          : {
              type: "B2B",
              custCode: formData.custCode,
              companyName: formData.b2b_companyName,
              department: formData.b2b_department,
              prefix: formData.b2b_prefix,
              picName: formData.b2b_picName,
              phone: formData.b2b_phone,
              email: formData.b2b_email,
              website: formData.b2b_website,
              province: formData.b2b_province,
              city: formData.b2b_city,
              purchaseChannel: formData.b2b_purchaseChannel,
            };

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
  // --- BAGIAN FORM (SAMA SEPERTI ADD) ---
  const B2BFormFields = (
    <>
      <h3 className="text-lg font-semibold border-b pb-2">Detail Perusahaan</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4 space-y-2">
          <div className="space-y-2">
            <Label>Nama Perusahaan *</Label>
            <Input
              name="b2b_companyName"
              value={formData.b2b_companyName}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Saluran Pembelian</Label>
            <Input
              name="b2b_purchaseChannel"
              value={formData.b2b_purchaseChannel}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 space-y-2">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              name="b2b_email"
              value={formData.b2b_email}
              onChange={handleChange}
            />
          </div>
          <div className=" space-y-2">
            <Label>Website</Label>
            <Input
              name="b2b_website"
              value={formData.b2b_website}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nama PIC *</Label>
          <Input
            name="b2b_picName"
            value={formData.b2b_picName}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input
              name="b2b_phone"
              value={formData.b2b_phone}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b2b_province" className="w-full">
              Provinsi *
            </Label>
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
              <SelectTrigger id="b2b_province">
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
            <Label htmlFor="b2b_city">Kota/Kabupaten *</Label>
            <Select
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, b2b_city: val }))
              }
              value={formData.b2b_city}
              disabled={!formData.b2b_province}
            >
              <SelectTrigger id="b2b_city">
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
      </div>
    </>
  );

  const B2CFormFields = (
    <>
      <h3 className="text-lg font-semibold border-b pb-2">Detail Individu</h3>
      <div className="space-y-4">
        <div className=" space-y-2">
          <Label>Nama Lengkap *</Label>
          <Input
            name="b2c_name"
            value={formData.b2c_name}
            onChange={handleChange}
          />
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
            <Label>Saluran Pembelian</Label>
            <Input
              name="b2c_purchaseChannel"
              value={formData.b2c_purchaseChannel}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Alamat Lengkap *</Label>
          <Textarea
            name="b2c_fullAddress"
            value={formData.b2c_fullAddress}
            onChange={handleChange}
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
                <Label>Kode Klien</Label>
                <Input
                  name="custCode"
                  value={formData.custCode}
                  onChange={handleChange}
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
