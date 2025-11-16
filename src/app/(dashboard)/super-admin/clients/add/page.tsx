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
import { ChevronLeft, ClipboardList, DeleteIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";

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

  // ============================
  // B2B FIELDS
  // ============================
  b2b_companyName?: string;
  b2b_departmentId?: string; // updated
  b2b_phone?: string;
  b2b_email?: string;
  b2b_website?: string;
  b2b_province?: string;
  b2b_city?: string;
  b2b_fullAddress?: string;
  b2b_purchaseChannelId?: string; // updated

  // MULTIPLE PIC
  b2b_pics: PICFormData[]; // NEW (multiple PICs)

  // ============================
  // B2C FIELDS
  // ============================
  b2c_name?: string;
  b2c_prefix?: string;
  b2c_phone?: string;
  b2c_fullAddressB2C?: string; // updated
  b2c_purchaseChannelIdB2C?: string; // updated
}

const initialFormData: ClientFormData = {
  type: "",

  custCode: "",

  // ============================
  // B2B FIELD
  // ============================
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
  b2b_pics: [
    {
      prefix: "",
      name: "",
      email: "",
      phone: "",
    },
  ],

  // ============================
  // B2C FIELD
  // ============================
  b2c_name: "",
  b2c_prefix: "",
  b2c_phone: "",
  b2c_fullAddressB2C: "",
  b2c_purchaseChannelIdB2C: "",
};

const ClientAddForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [clientType, setClientType] = useState<ClientType>("");
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
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

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error fetch provinces:", err));
  }, []);

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
              fullAddressB2C: formData.b2c_fullAddressB2C,
              purchaseChannelIdB2C: formData.b2c_purchaseChannelIdB2C,
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
              province: formData.b2b_province,
              city: formData.b2b_city,
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
                    <Label>Email Kantor *</Label>
                    <Input
                      name="b2b_email"
                      type="email"
                      value={formData.b2b_email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Telepon Kantor *</Label>
                    <Input
                      name="b2b_phone"
                      value={formData.b2b_phone}
                      onChange={handleChange}
                      required
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
                </div>

                {/* === ADDRESS COMPANY === */}
                <div className="space-y-2 mt-4">
                  <Label>Alamat Lengkap *</Label>
                  <Textarea
                    name="b2b_fullAddress"
                    value={formData.b2b_fullAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* === PROVINCE & CITY === */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Provinsi *</Label>
                    <Select
                      value={formData.b2b_province}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          b2b_province: value,
                          b2b_city: "",
                        }))
                      }
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
                    <Label>Kota *</Label>
                    <Select
                      disabled={!formData.b2b_province}
                      value={formData.b2b_city}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, b2b_city: val }))
                      }
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

                {/* === MULTIPLE PIC === */}
                <h4 className="font-medium mt-8 mb-2">
                  PIC (Person In Charge)
                </h4>

                {formData.b2b_pics.map((pic, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-lg space-y-4 bg-muted/40"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* PREFIX PIC */}
                      <div className="space-y-2">
                        <Label>Prefix (Mr./Ms.)</Label>
                        <Select
                          value={pic.prefix}
                          onValueChange={(value) => {
                            const updated = [...formData.b2b_pics];
                            updated[index].prefix = value;
                            setFormData((prev) => ({
                              ...prev,
                              b2b_pics: updated,
                            }));
                          }}
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

                      {/* NAMA PIC */}
                      <div className="space-y-2">
                        <Label>Nama PIC *</Label>
                        <Input
                          value={pic.name}
                          onChange={(e) => {
                            const updated = [...formData.b2b_pics];
                            updated[index].name = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              b2b_pics: updated,
                            }));
                          }}
                          required
                        />
                      </div>

                      {/* EMAIL PIC */}
                      <div className="space-y-2">
                        <Label>Email PIC</Label>
                        <Input
                          value={pic.email}
                          onChange={(e) => {
                            const updated = [...formData.b2b_pics];
                            updated[index].email = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              b2b_pics: updated,
                            }));
                          }}
                        />
                      </div>

                      {/* TELEPON PIC */}
                      <div className="space-y-2">
                        <Label>Telepon PIC</Label>
                        <Input
                          value={pic.phone}
                          onChange={(e) => {
                            const updated = [...formData.b2b_pics];
                            updated[index].phone = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              b2b_pics: updated,
                            }));
                          }}
                        />
                      </div>
                    </div>

                    {/* DELETE PIC BUTTON */}
                    {formData.b2b_pics.length > 1 && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const updated = formData.b2b_pics.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            b2b_pics: updated,
                          }));
                        }}
                      >
                        <DeleteIcon />
                      </Button>
                    )}
                  </div>
                ))}

                {/* ADD NEW PIC */}
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
                  }
                >
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

                {/* PHONE + PURCHASE CHANNEL */}
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

                  {/* PURCHASE CHANNEL DROPDOWN (DB) */}
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

                {/* FULL ADDRESS */}
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
