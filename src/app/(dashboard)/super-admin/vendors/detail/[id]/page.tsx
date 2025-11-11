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
  Contact,
  Globe,
  Star,
} from "lucide-react";
import * as LucideIcons from "lucide-react"; // ✅ Import semua icon
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
  category?: Category | null;
}

interface Contact {
  id: string;
  contactId: string;
  isPrimary: boolean;
  platform: {
    id: string;
    name: string;
    slug: string;
    icon?: string; // Nama icon dari lucide-react
  };
}

interface VendorDetail {
  id: string;
  companyName: string;
  picName: string;
  country: string;
  address: string;
  isActive: boolean;
  items: VendorItem[];
  contacts: Contact[];
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
            headers: { Authorization: `Bearer ${token}` },
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

  // Helper untuk deteksi apakah contactId adalah URL
  const formatContactLink = (contactId: string) => {
    if (contactId.startsWith("http")) return contactId;
    if (contactId.includes("@")) return `mailto:${contactId}`;
    if (/^\+?\d+$/.test(contactId)) return `https://wa.me/${contactId}`;
    return contactId;
  };

  return (
    <div className="space-y-10 w-full mx-auto">
      {/* === HEADER === */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {vendor.country}
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

        {/* PIC Info + Contacts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-green-500" />
              PIC & Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              <strong>Nama PIC:</strong> {vendor.picName}
            </p>

            <div className="space-y-2">
              <p className="font-semibold text-gray-700 flex items-center gap-2">
                <Contact className="w-4 h-4" /> Kontak Vendor
              </p>

              {vendor.contacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Tidak ada kontak terdaftar.
                </p>
              ) : (
                <div className="grid grid-cols-1  gap-3">
                  {vendor.contacts.map((contact) => {
                    const Icon =
                      (LucideIcons as any)[contact.platform.icon || "Globe"] ||
                      Globe;

                    return (
                      <div
                        key={contact.id}
                        className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {contact.platform.name}
                            </span>
                          </div>

                          {contact.isPrimary && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600 border-green-300 flex items-center gap-1"
                            >
                              <Star className="w-3 h-3" /> Primary
                            </Badge>
                          )}
                        </div>

                        <Link
                          href={formatContactLink(contact.contactId)}
                          target="_blank"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {contact.contactId}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                  {item.category && (
                    <Badge
                      variant="outline"
                      className="text-xs text-indigo-700 border-indigo-200"
                    >
                      {item.category.name}
                    </Badge>
                  )}
                  <CardTitle className="text-base font-semibold mt-1">
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
