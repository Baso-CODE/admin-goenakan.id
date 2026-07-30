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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import {
  Barcode,
  ChevronLeft,
  ClipboardList,
  Loader2,
  Trash2,
  UserRoundPlus,
} from "lucide-react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AddressField from "./addressField";

export default function ClientEditForm() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId;

  // --- STATES ---
  const [formData, setFormData] = useState<any>(null);
  const [clientType, setClientType] = useState<string>("");
  const [clientStatus, setClientStatus] = useState<"POTENTIAL" | "OFFICIAL">(
    "OFFICIAL",
  );
  const [activeTab, setActiveTab] = useState("info-dasar");

  // Master Data
  const [purchaseChannels, setPurchaseChannels] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);

  // ==========================================
  // 1. FETCH MASTER DATA (Channels & Departments)
  // ==========================================
  useEffect(() => {
    const fetchMasterData = async () => {
      if (status === "loading" || status === "unauthenticated") return;
      try {
        const [pcRes, depRes] = await Promise.all([
          fetchApi("/purchase-channels/list"),
          fetchApi("/departments/list"),
        ]);
        if (!pcRes.ok || !depRes.ok) throw new Error("Failed to fetch data");

        setPurchaseChannels(await pcRes.json());
        setDepartments(await depRes.json());
      } catch (err) {
        console.error("❌ Failed to fetch master data:", err);
      }
    };
    fetchMasterData();
  }, [status, fetchApi]);

  // ==========================================
  // 2. FETCH CLIENT DETAIL
  // ==========================================
  useEffect(() => {
    const fetchClient = async () => {
      if (status === "loading" || status === "unauthenticated" || !clientId)
        return;

      try {
        const res = await fetchApi(`/clients/${clientId}`);
        if (!res.ok) throw new Error("Gagal mengambil data klien");

        const data = await res.json();
        setClientStatus(data.status || "OFFICIAL");

        if (data.type === "B2B" && data.b2b) {
          setClientType("B2B");
          setFormData({
            custCode: data.custCode || "",
            type: "B2B",
            joinedDate: data.joinedDate ? new Date(data.joinedDate) : undefined,

            // B2B FIELDS
            b2b_companyName: data.b2b.companyName || "",
            b2b_departmentId: data.b2b.department?.id || "",
            b2b_phone: data.b2b.phone || "",
            b2b_email: data.b2b.email || "",
            b2b_website: data.b2b.website || "",

            // Address B2B
            b2b_country: data.b2b.country || "Indonesia",
            b2b_province: data.b2b.province || "",
            b2b_city: data.b2b.city || "",
            b2b_district: data.b2b.district || "",
            b2b_subDistrict: data.b2b.subDistrict || "",
            b2b_postalCode: data.b2b.postalCode || "",
            b2b_fullAddress: data.b2b.fullAddress || "",

            // PICS
            b2b_pics:
              data.b2b.pics?.length > 0
                ? data.b2b.pics.map((p: any) => ({
                    prefix: p.prefix || "",
                    name: p.name || "",
                    email: p.email || "",
                    phone: p.phone || "",
                  }))
                : [{ prefix: "", name: "", email: "", phone: "" }],
          });
        } else if (data.type === "B2C" && data.b2c) {
          setClientType("B2C");
          setFormData({
            custCode: data.custCode || "",
            type: "B2C",
            joinedDate: data.joinedDate ? new Date(data.joinedDate) : undefined,

            // B2C FIELDS
            b2c_prefix: data.b2c.prefix || "",
            b2c_name: data.b2c.name || "",
            b2c_phone: data.b2c.phone || "",

            // Address B2C
            b2c_country: data.b2c.country || "Indonesia",
            b2c_province: data.b2c.province || "",
            b2c_city: data.b2c.city || "",
            b2c_district: data.b2c.district || "",
            b2c_subDistrict: data.b2c.subDistrict || "",
            b2c_postalCode: data.b2c.postalCode || "",
            b2c_fullAddressB2C: data.b2c.fullAddress || "",
          });
        } else {
          toast.error("Data klien tidak valid atau kosong.");
        }
      } catch (err) {
        toast.error("Gagal memuat data klien.");
      }
    };
    fetchClient();
  }, [clientId, status, fetchApi]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload: any = {
        custCode: formData.custCode,
        type: clientType,
        status: clientStatus,
      };

      if (formData.joinedDate) {
        payload.joinedDate = format(formData.joinedDate, "yyyy-MM-dd");
      }

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
        };
      }

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
          pics: formData.b2b_pics.map((pic: any) => ({
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

      if (!res.ok) throw new Error("Gagal memperbarui client");

      toast.success("Klien berhasil diperbarui!");
      router.push("/super-admin/clients");
      router.refresh();
    } catch (error) {
      toast.error("Terjadi kesalahan saat update data.");
    }
  };

  // Tampilkan loading jika data belum siap
  if (!formData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      <Link
        href={`/super-admin/clients/detail/${clientId}`}
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Detail Klien
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Klien</CardTitle>
            <CardDescription>
              Perbarui informasi klien di setiap tab.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="info-dasar">Info Dasar</TabsTrigger>
                <TabsTrigger value="detail">Detail</TabsTrigger>
                <TabsTrigger value="alamat">Alamat</TabsTrigger>
                <TabsTrigger value="pic" disabled={clientType !== "B2B"}>
                  PIC
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: INFO DASAR */}
              <TabsContent value="info-dasar" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      Kode Klien
                    </Label>
                    <Input value={formData.custCode} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <UserRoundPlus className="h-4 w-4 text-muted-foreground" />
                      Tipe Klien
                    </Label>
                    <Input
                      value={
                        clientType === "B2B"
                          ? "B2B (Business)"
                          : "B2C (Personal)"
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Status Klien</Label>
                  <Tabs
                    value={clientStatus}
                    onValueChange={(val) =>
                      setClientStatus(val as "POTENTIAL" | "OFFICIAL")
                    }
                    className="w-fit">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="OFFICIAL"
                        className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                        Official
                      </TabsTrigger>
                      <TabsTrigger
                        value="POTENTIAL"
                        className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                        Potential
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </TabsContent>

              {/* TAB 2: DETAIL */}
              <TabsContent value="detail" className="space-y-6">
                {clientType === "B2B" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
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
                      <div className="space-y-2 flex flex-col justify-end">
                        <Label>Tanggal Bergabung</Label>
                        <DatePickerHelper
                          date={formData.joinedDate}
                          setDate={(date) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              joinedDate: date,
                            }))
                          }
                          placeholder="Pilih Tanggal"
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
                            if (value === "ADD_NEW_DEP")
                              return setIsDepModalOpen(true);
                            setFormData((prev: any) => ({
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
                  </div>
                )}

                {clientType === "B2C" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Detail Individu (B2C)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Prefix</Label>
                        <Select
                          value={formData.b2c_prefix}
                          onValueChange={(val) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              b2c_prefix: val,
                            }))
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Prefix" />
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
                          name="b2c_name"
                          value={formData.b2c_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Telepon</Label>
                        <Input
                          name="b2c_phone"
                          value={formData.b2c_phone}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2 flex flex-col justify-end">
                        <Label>Tanggal Bergabung</Label>
                        <DatePickerHelper
                          date={formData.joinedDate}
                          setDate={(date) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              joinedDate: date,
                            }))
                          }
                          placeholder="Pilih Tanggal"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: ALAMAT */}
              <TabsContent value="alamat" className="space-y-6">
                <h3 className="text-lg font-semibold">Alamat</h3>

                {clientType === "B2B" && (
                  <AddressField
                    value={{
                      country: formData.b2b_country,
                      province: formData.b2b_province,
                      city: formData.b2b_city,
                      district: formData.b2b_district,
                      subDistrict: formData.b2b_subDistrict,
                      postalCode: formData.b2b_postalCode,
                    }}
                    onChange={(updated) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        b2b_country: updated.country ?? prev.b2b_country,
                        b2b_province: updated.province ?? prev.b2b_province,
                        b2b_city: updated.city ?? prev.b2b_city,
                        b2b_district: updated.district ?? prev.b2b_district,
                        b2b_subDistrict:
                          updated.subDistrict ?? prev.b2b_subDistrict,
                        b2b_postalCode:
                          updated.postalCode ?? prev.b2b_postalCode,
                      }))
                    }
                  />
                )}

                {clientType === "B2C" && (
                  <AddressField
                    value={{
                      country: formData.b2c_country,
                      province: formData.b2c_province,
                      city: formData.b2c_city,
                      district: formData.b2c_district,
                      subDistrict: formData.b2c_subDistrict,
                      postalCode: formData.b2c_postalCode,
                    }}
                    onChange={(updated) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        b2c_country: updated.country ?? prev.b2c_country,
                        b2c_province: updated.province ?? prev.b2c_province,
                        b2c_city: updated.city ?? prev.b2c_city,
                        b2c_district: updated.district ?? prev.b2c_district,
                        b2c_subDistrict:
                          updated.subDistrict ?? prev.b2c_subDistrict,
                        b2c_postalCode:
                          updated.postalCode ?? prev.b2c_postalCode,
                      }))
                    }
                  />
                )}

                <div className="space-y-2 mt-6">
                  <Label>
                    Alamat Lengkap{" "}
                    {clientType === "B2B" ? "(Perusahaan)" : "(Tempat Tinggal)"}
                  </Label>
                  <Textarea
                    name={
                      clientType === "B2B"
                        ? "b2b_fullAddress"
                        : "b2c_fullAddressB2C"
                    }
                    value={
                      clientType === "B2B"
                        ? formData.b2b_fullAddress
                        : formData.b2c_fullAddressB2C
                    }
                    onChange={handleChange}
                    required
                  />
                </div>
              </TabsContent>

              {/* TAB 4: PIC (B2B Only) */}
              <TabsContent value="pic" className="space-y-6">
                <h3 className="text-lg font-semibold">
                  PIC (Person In Charge)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Perbarui kontak person in charge dari klien perusahaan ini
                </p>

                {formData.b2b_pics?.map((pic: any, index: number) => {
                  const updateField = (field: string, value: string) => {
                    const updated = [...formData.b2b_pics];
                    updated[index] = { ...updated[index], [field]: value };
                    setFormData((prev: any) => ({
                      ...prev,
                      b2b_pics: updated,
                    }));
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
                            setFormData((prev: any) => ({
                              ...prev,
                              b2b_pics: prev.b2b_pics.filter(
                                (_: any, i: number) => i !== index,
                              ),
                            }))
                          }>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-2">
                          <Label>Prefix</Label>
                          <Select
                            value={pic.prefix}
                            onValueChange={(val) => updateField("prefix", val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Prefix" />
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
                    setFormData((prev: any) => ({
                      ...prev,
                      b2b_pics: [
                        ...prev.b2b_pics,
                        { prefix: "", name: "", email: "", phone: "" },
                      ],
                    }))
                  }>
                  + Tambah PIC
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            className="cursor-pointer bg-green-600 hover:bg-green-700 text-white">
            <ClipboardList className="h-4 w-4 mr-2" />
            Update Klien
          </Button>
        </div>
      </form>
    </div>
  );
}
