"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building, MapPin, Trash2, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// === Tipe Data ===
type ClientType = "B2B" | "B2C";

interface ClientB2C {
  id: string;
  prefix: string;
  name: string;
  phone: string;
  fullAddress: string;
  purchaseChannel: string;
}

interface ClientB2B {
  id: string;
  companyName: string;
  department: string;
  prefix: string;
  picName: string;
  phone: string;
  email: string;
  website: string;
  province: string;
  city: string;
  purchaseChannel: string;
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
    <Card className="shadow-sm md:col-span-2 ">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Building className="w-5 h-5 text-indigo-500" />
          Informasi Perusahaan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <strong>Perusahaan:</strong> {data.companyName}
        </p>
        <p>
          <strong>Website:</strong>{" "}
          <a
            href={data.website}
            target="_blank"
            className="text-blue-500 hover:underline"
          >
            {data.website}
          </a>
        </p>
        <p>
          <strong>Departemen:</strong> {data.department}
        </p>
        <p>
          <strong>Purchase Channel:</strong>{" "}
          <Badge variant={"outline"} className="ml-1">
            {data.purchaseChannel}
          </Badge>
        </p>
      </CardContent>
    </Card>

    <Card className="shadow-sm md:col-span-2 ">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="w-5 h-5 text-green-500" />
          PIC (Person in Charge)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <strong>Nama PIC:</strong> {data.prefix} {data.picName}
        </p>
        <p>
          <strong>Email:</strong> {data.email}
        </p>
        <p>
          <strong>Telepon:</strong> {data.phone}
        </p>
      </CardContent>
    </Card>

    <Card className="md:col-span-2 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MapPin className="w-5 h-5 text-red-500" />
          Alamat Perusahaan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <strong>Provinsi:</strong> {data.province}
        </p>
        <p>
          <strong>Kota:</strong> {data.city}
        </p>
      </CardContent>
    </Card>
  </div>
);

// === B2C Component ===
const B2CDetails: React.FC<{ data: ClientB2C }> = ({ data }) => (
  <div className="grid grid-cols-1 gap-6">
    <Card className="shadow-sm">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="w-5 h-5 text-yellow-600" />
          Informasi Individu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <strong>Nama Lengkap:</strong> {data.prefix} {data.name}
        </p>
        <p>
          <strong>Telepon:</strong> {data.phone}
        </p>
        <p>
          <strong>Saluran Pembelian:</strong> {data.purchaseChannel}
        </p>
      </CardContent>
    </Card>

    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MapPin className="w-5 h-5 text-red-500" />
          Alamat Pengiriman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{data.fullAddress}</p>
      </CardContent>
    </Card>
  </div>
);

// === Main Page ===
const ClientDetailPage: React.FC = () => {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const router = useRouter();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`http://localhost:8000/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data client");

        const data = await res.json();
        setClient(data);
      } catch (err) {
        console.error("Error fetching client:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus client ini?")) return;
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`http://localhost:8000/clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal menghapus client");
      toast.success("Client berhasil dihapus");
      router.push("/super-admin/clients");
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus client");
      console.error(err);
    }
  };

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
    <div className="space-y-8 w-full">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {titleName}
            <Badge
              variant="secondary"
              className={`text-sm ${
                client.type === "B2B"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {client.type}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Kode Klien: <span className="font-mono">{client.custCode}</span> |
            Bergabung: {new Date(client.createdAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">
        {/* === Left Column: Detail === */}
        <div>{SpecificDetailsComponent}</div>

        {/* === Right Column: Quick Actions === */}
        <div className="lg:sticky lg:top-20 h-fit space-y-4">
          <Card className="shadow-md border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link href={`/super-admin/clients/edit/${client.id}`}>
                <Button variant="secondary" className="w-full gap-2">
                  <Wrench className="w-4 h-4" /> Edit Client
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" /> Delete Client
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;
