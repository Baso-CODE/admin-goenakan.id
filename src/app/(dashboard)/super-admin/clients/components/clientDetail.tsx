"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/useApi";
import {
  Building,
  LaptopMinimalCheck,
  MapPin,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// === Tipe Data ===
type ClientType = "B2B" | "B2C";

interface PurchaseChannel {
  id: string;
  name: string;
  slug: string;
}

interface Department {
  id: string;
  name: string;
  slug: string;
}

interface ClientB2C {
  id: string;
  prefix: string;
  name: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  fullAddress: string;
  purchaseChannel: PurchaseChannel; // UPDATE
}

interface ClientB2B {
  id: string;
  companyName: string;
  department: Department;

  phone: string;
  email: string;
  website: string;
  country: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  fullAddress: string; // UPDATE
  purchaseChannel: PurchaseChannel; // UPDATE
  pics: {
    id: string;
    name: string;
    email?: string;
    prefix: string;
    phone?: string;
  }[];
}

interface ClientDetail {
  id: string;
  custCode: string;
  type: ClientType;
  createdAt: string;
  b2b?: ClientB2B;
  b2c?: ClientB2C;
  totalOrders: number;
  lastOrderDate: string;
}

// === B2B Component ===
const B2BDetails: React.FC<{ data: ClientB2B }> = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Informasi Perusahaan */}
    <Card className="shadow-sm border md:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Building className="w-5 h-5 text-indigo-600" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-wide">
            Informasi Perusahaan
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-[15px]">
        <div className="grid grid-cols-3">
          <span className="text-muted-foreground font-medium">Perusahaan</span>
          <span className="col-span-2 font-semibold text-gray-900">
            {data.companyName}
          </span>
        </div>

        <div className="grid grid-cols-3">
          <span className="text-muted-foreground font-medium">Website</span>
          <span className="col-span-2">
            <Link
              className="text-blue-600 font-medium hover:underline"
              href={data.website}
              target="_blank">
              {data.website}
            </Link>
          </span>
        </div>

        <div className="grid grid-cols-3">
          <span className="text-muted-foreground font-medium">Departemen</span>
          <span className="col-span-2 font-semibold text-gray-900">
            {data.department?.name}
          </span>
        </div>

        <div className="grid grid-cols-3">
          <span className="text-muted-foreground font-medium">
            Purchase Channel
          </span>
          <span className="col-span-2">
            <Badge variant="secondary" className="px-3 py-1 rounded-lg">
              {data.purchaseChannel?.name}
            </Badge>
          </span>
        </div>
      </CardContent>
    </Card>

    <Card className="shadow-sm md:col-span-2 border rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-wide">
            PIC (Person in Charge)
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.pics.map((pic) => (
          <div
            key={pic.id}
            className="p-4 border rounded-xl bg-muted/40 space-y-3">
            {/* NAMA */}
            <div className="grid grid-cols-3">
              <span className="text-muted-foreground font-medium">Nama</span>
              <span className="col-span-2 font-semibold">
                {pic.prefix} {pic.name}
              </span>
            </div>

            {/* EMAIL */}
            <div className="grid grid-cols-3">
              <span className="text-muted-foreground font-medium">Email</span>
              <span className="col-span-2">
                {pic.email ? (
                  <Link
                    href={`mailto:${pic.email}`}
                    className="text-blue-600 hover:underline font-medium">
                    {pic.email}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </span>
            </div>

            {/* TELEPON */}
            <div className="grid grid-cols-3">
              <span className="text-muted-foreground font-medium">Telepon</span>
              <span className="col-span-2 font-semibold">
                {pic.phone ?? "-"}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card className="shadow-sm md:col-span-2 border rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <MapPin className="w-5 h-5 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-wide">
            Alamat Perusahaan
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* Country */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Negara</span>
          <span className="col-span-2 font-semibold uppercase">
            {data.country}
          </span>
        </div>

        {/* PROVINSI */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Provinsi</span>
          <span className="col-span-2 font-semibold uppercase">
            {data.province}
          </span>
        </div>

        {/* KOTA */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Kota</span>
          <span className="col-span-2 font-semibold">{data.city}</span>
        </div>

        {/* DISTRICT */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Kecamatan</span>
          <span className="col-span-2 font-semibold uppercase">
            {data.district}
          </span>
        </div>

        {/* DISTRICT */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Kelurahan</span>
          <span className="col-span-2 font-semibold uppercase">
            {data.subDistrict}
          </span>
        </div>

        {/* POS KODE */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Pos Kode</span>
          <span className="col-span-2 font-semibold uppercase">
            {data.postalCode}
          </span>
        </div>

        {/* ALAMAT */}
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">
            Alamat Lengkap
          </span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.fullAddress}
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
);

// === B2C Component ===
const B2CDetails: React.FC<{ data: ClientB2C }> = ({ data }) => (
  <div className="grid grid-cols-1 gap-6">
    {/* === Informasi Individu === */}
    <Card className="shadow-sm border rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100">
            <User className="w-5 h-5 text-yellow-700" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-wide">
            Informasi Individu
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">
            Nama Lengkap
          </span>
          <span className="col-span-2 font-semibold">
            {data.prefix} {data.name}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Telepon</span>
          <span className="col-span-2 font-semibold">{data.phone}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">
            Purchase Channel
          </span>
          <span className="col-span-2">
            <Badge variant="outline" className="font-semibold">
              {data.purchaseChannel.name}
            </Badge>
          </span>
        </div>
      </CardContent>
    </Card>

    {/* === Alamat Pengiriman === */}
    <Card className="shadow-sm border rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <MapPin className="w-5 h-5 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-wide">
            Alamat Pengiriman
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Negara</span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.country}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Provinsi</span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.province}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">
            Kota/Kabupaten
          </span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.city}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Kecamatan</span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.district}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Kelurahan</span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.subDistrict}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Kode Pos</span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.postalCode}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground font-medium">Alamat</span>
          <span className="col-span-2 font-semibold leading-relaxed">
            {data.fullAddress}
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
);

// === Main Page ===
export default function ClientDetail() {
  const { fetchApi, status } = useApi();

  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const router = useRouter();

  const [client, setClient] = useState<ClientDetail | null>(null);

  const [loading, setLoading] = useState(true);

  // === FETCH DATA ===
  // ✨ 2. Gunakan useCallback agar fungsi stabil
  const fetchClient = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !clientId)
      return;

    try {
      setLoading(true);
      const res = await fetchApi(`/clients/${clientId}`);

      if (!res.ok) throw new Error("Gagal mengambil data client");

      const data = await res.json();
      setClient(data.data || data);
    } catch (err) {
      console.error("Error fetching client:", err);
      toast.error("Gagal memuat detail klien");
    } finally {
      setLoading(false);
    }
  }, [clientId, status, fetchApi]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  // === DELETE HANDLER ===
  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus client ini?")) return;
    if (status !== "authenticated") return;

    try {
      // ✨ Gunakan fetchApi dengan method DELETE
      const res = await fetchApi(`/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus client");

      toast.success("Client berhasil dihapus");
      router.push("/super-admin/clients");
      router.refresh();
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus client");
      console.error(err);
    }
  };

  // State loading session atau data
  if (status === "loading" || loading)
    return (
      <div className="p-10 text-center animate-pulse text-muted-foreground">
        Memuat data klien...
      </div>
    );

  if (!client)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Data tidak ditemukan.
      </div>
    );

  if (loading)
    return <div className="p-10 text-center">Memuat data klien...</div>;
  if (!client)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Data tidak ditemukan.
      </div>
    );

  const titleName =
    client.type === "B2B" ? client.b2b?.companyName : client.b2c?.name;
  const SpecificDetailsComponent =
    client.type === "B2B" ? (
      <B2BDetails data={client.b2b as ClientB2B} />
    ) : (
      <B2CDetails data={client.b2c as ClientB2C} />
    );

  return (
    <div className="space-y-10 w-full">
      {/* === HEADER PREMIUM === */}
      <header className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{titleName}</h1>

            <Badge
              variant="outline"
              className={`px-3 py-1 text-sm font-semibold flex items-center gap-1 rounded-lg
            ${
              client.type === "B2B"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }
          `}>
              {/* ICON */}
              {client.type === "B2B" ? (
                <Building className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              {client.type}
            </Badge>
          </div>

          {/* METADATA */}
          <div
            className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap 
                   bg-muted/40 px-4 py-2 rounded-lg w-fit border">
            <span>
              <span className="font-medium">Kode Klien:</span>
              <span className="font-mono text-[13px]">{client.custCode}</span>
            </span>

            <span className="text-gray-400">•</span>

            <span>
              <span className="font-medium">Bergabung:</span>
              {new Date(client.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      <Separator />

      {/* === MAIN GRID === */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
        {/* == LEFT DETAILS == */}
        <div>{SpecificDetailsComponent}</div>

        {/* == RIGHT QUICK ACTIONS == */}
        <div className="lg:sticky lg:top-24 h-fit space-y-5">
          <Card className="shadow-sm border rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <LaptopMinimalCheck className="w-4 h-4 text-slate-700" />
                </div>
                <CardTitle className="text-lg font-semibold tracking-wide">
                  Quick Actions
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 h-fit">
              <Link
                href={`/super-admin/clients/edit/${client.id}`}
                className="block">
                <Button
                  variant="secondary"
                  className="w-full gap-2 py-2.5 rounded-xl hover:bg-secondary transition">
                  <Wrench className="w-4 h-4" /> Edit Client
                </Button>
              </Link>

              <Button
                variant="destructive"
                className="w-full gap-2 py-2.5 rounded-xl hover:bg-destructive/90  transition"
                onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Delete Client
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
