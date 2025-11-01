"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  MapPin,
  User,
  Wrench,
  PackageSearch,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type Definitions ===
interface Category {
  id: string;
  name: string;
  type: string;
}

interface VendorItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: Category;
}

interface VendorDetail {
  id: string;
  companyName: string;
  picName: string;
  phone: string;
  country: string;
  address: string;
  isActive: boolean;
  items: VendorItem[];
}

// === Page Component ===
const DetailPageVendor: React.FC = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vendorId = params.id;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(
          `http://localhost:8000/vendors/detail/${vendorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Gagal mengambil data vendor");
        const data = await res.json();
        setVendor(data);
      } catch (err) {
        console.error("❌ Gagal mengambil data vendor:", err);
        toast.error("Gagal mengambil data vendor");
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) fetchVendor();
  }, [vendorId]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data vendor...
      </div>
    );

  if (!vendor)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Data vendor tidak ditemukan.
      </div>
    );

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* === HEADER === */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {vendor.companyName}
            <Badge
              variant="secondary"
              className={`text-sm ${
                vendor.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {vendor.isActive ? "Active" : "Inactive"}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            <span className="font-mono">{vendor.country}</span>
          </p>
        </div>

        <Link href={`/super-admin/vendors/edit/${vendor.id}`}>
          <Button variant="secondary" className="gap-2 cursor-pointer">
            <Wrench className="w-4 h-4" /> Edit Vendor
          </Button>
        </Link>
      </header>

      <Separator />

      {/* === VENDOR INFORMATION === */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building className="w-5 h-5 text-indigo-500" />
              Informasi Perusahaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Nama Perusahaan:</strong> {vendor.companyName}
            </p>
            <p>
              <strong>Negara:</strong> {vendor.country}
            </p>
            <p>
              <strong>Alamat:</strong> {vendor.address}
            </p>
          </CardContent>
        </Card>

        {/* PIC Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-green-500" />
              PIC (Person in Charge)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Nama PIC:</strong> {vendor.picName}
            </p>
            <p>
              <strong>No. Telepon:</strong> {vendor.phone}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* === ITEM LIST === */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
          <PackageSearch className="w-5 h-5 text-primary" />
          Daftar Item Vendor
        </h2>

        {vendor.items.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada item terdaftar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendor.items.map((item) => (
              <Card
                key={item.id}
                className="shadow-sm hover:shadow-md transition"
              >
                <CardHeader className="pb-2">
                  <CardTitle>
                    {item.category && (
                      <Badge
                        variant="outline"
                        className="text-xs text-indigo-700 border-indigo-200"
                      >
                        {item.category.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardTitle className=" text-base font-semibold">
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>{item.description || "Tidak ada deskripsi."}</p>
                  {item.price && (
                    <p>
                      <strong>Harga:</strong> ${item.price}
                    </p>
                  )}
                  {item.category && (
                    <p className="text-xs">
                      <strong>Tipe:</strong> {item.category.type}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    </div>
  );
};

export default DetailPageVendor;
