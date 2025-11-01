"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";

// === ZOD SCHEMA ===
const clientSchema = z.object({
  custCode: z.string().min(3, "Kode klien wajib diisi"),
  type: z.enum(["B2B", "B2C"]),
});

// === TIPE ===
type ClientType = "B2B" | "B2C" | "";

interface ClientFormData {
  custCode: string;
  type: ClientType;
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
  b2c_prefix: string;
  b2c_name: string;
  b2c_phone: string;
  b2c_fullAddress: string;
  b2c_purchaseChannel: string;
}

const initialFormData: ClientFormData = {
  custCode: "",
  type: "",
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
  b2c_prefix: "",
  b2c_name: "",
  b2c_phone: "",
  b2c_fullAddress: "",
  b2c_purchaseChannel: "",
};

const ClientAddForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const { data: session } = useSession();
  const router = useRouter();

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

  // === HANDLE CHANGE ===
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
      custCode: formData.custCode,
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

      await fetch("http://localhost:8000/clients", {
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
    <div className="w-full max-w-full space-y-6">
      <Link
        href="/client-management/clients"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
      >
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
                <Label htmlFor="custCode">Kode Klien *</Label>
                <Input
                  id="custCode"
                  name="custCode"
                  value={formData.custCode}
                  onChange={handleChange}
                  placeholder="Contoh: CUST-B2B-005"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipe Klien *</Label>
                <Select
                  onValueChange={(value: ClientType) => handleTypeChange(value)}
                  value={clientType}
                >
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
                  Detail Perusahaan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2b_companyName">Nama Perusahaan *</Label>
                    <Input
                      id="b2b_companyName"
                      name="b2b_companyName"
                      value={formData.b2b_companyName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b2b_email">Email *</Label>
                    <Input
                      id="b2b_email"
                      name="b2b_email"
                      type="email"
                      value={formData.b2b_email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b2b_website">Website</Label>
                    <Input
                      id="b2b_website"
                      name="b2b_website"
                      value={formData.b2b_website}
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
                <h4 className="font-medium mt-6">
                  Detail PIC (Person In Charge)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2b_prefix">Prefix (Mr./Ms.)</Label>
                    <Input
                      id="b2b_prefix"
                      name="b2b_prefix"
                      value={formData.b2b_prefix}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="b2b_picName">Nama PIC *</Label>
                    <Input
                      id="b2b_picName"
                      name="b2b_picName"
                      value={formData.b2b_picName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b2b_department">Departemen</Label>
                    <Input
                      id="b2b_department"
                      name="b2b_department"
                      value={formData.b2b_department}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {/* === PILIH PROVINSI DAN KOTA === */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2b_phone">Telepon PIC *</Label>
                    <Input
                      id="b2b_phone"
                      name="b2b_phone"
                      value={formData.b2b_phone}
                      onChange={handleChange}
                      required
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
            )}

            {/* === FORM B2C === */}
            {clientType === "B2C" && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Detail Individu (B2C)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2c_prefix">Prefix (Mr./Ms.)</Label>
                    <Input
                      id="b2c_prefix"
                      name="b2c_prefix"
                      value={formData.b2c_prefix}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="b2c_name">Nama Lengkap *</Label>
                    <Input
                      id="b2c_name"
                      name="b2c_name"
                      value={formData.b2c_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="b2c_phone">Telepon *</Label>
                    <Input
                      id="b2c_phone"
                      name="b2c_phone"
                      value={formData.b2c_phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b2c_purchaseChannel">
                      Saluran Pembelian
                    </Label>
                    <Input
                      id="b2c_purchaseChannel"
                      name="b2c_purchaseChannel"
                      value={formData.b2c_purchaseChannel}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b2c_fullAddress">Alamat Lengkap *</Label>
                  <Textarea
                    id="b2c_fullAddress"
                    name="b2c_fullAddress"
                    value={formData.b2c_fullAddress}
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
            disabled={clientType === ""}
          >
            <ClipboardList className="h-4 w-4 " />
            Simpan Klien Baru
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClientAddForm;
