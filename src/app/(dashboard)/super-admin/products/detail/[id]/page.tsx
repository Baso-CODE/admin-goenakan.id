"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GalleryHorizontal,
  ImageIcon,
  InfoIcon,
  MoveDiagonal,
  VideoIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  description: string;
  type?: string;
  basePrice: number;
  isCustom: boolean;
  materialType?: string;
  category: { id: string; name: string };
  attributes: { id: string; name: string; value: string }[];
  priceTiers: {
    id: string;
    minQuantity: number;
    maxQuantity: number | null;
    price: number;
  }[];
  images: { id: string; url: string }[];
  videos: { id: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  console.log("ini adalah data product", product);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch(`http://localhost:8000/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return <p className="text-muted-foreground">Produk tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-8">
      {/* === HEADER === */}
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground">{product.description}</p>
        <div className="mt-2">
          <Badge variant="outline">{product.category?.name}</Badge>
        </div>
      </div>

      <Separator />

      {/* === INFORMASI UMUM === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" /> Informasi Umum
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2  gap-4">
          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">SKU</span>
            <span className="font-medium">{product.sku || "-"}</span>
          </div>

          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">Harga Dasar</span>
            <span className="font-semibold text-green-700">
              Rp {product.basePrice.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Jenis Material
            </span>
            <span className="font-medium">{product.materialType || "-"}</span>
          </div>

          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">Custom Produk</span>
            <span className="font-medium">
              {product.isCustom ? "Ya" : "Tidak"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* === ATRIBUT === */}
      <Card>
        <CardHeader>
          <CardTitle>Atribut Produk</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {product.attributes.length > 0 ? (
            product.attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex flex-col rounded-md border p-2 bg-muted/30"
              >
                <span className="text-xs text-muted-foreground">
                  {attr.name}
                </span>
                <span className="font-medium">{attr.value}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground col-span-full">
              Tidak ada atribut.
            </p>
          )}
        </CardContent>
      </Card>

      {/* === HARGA === */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga (Price Tiers)</CardTitle>
        </CardHeader>
        <CardContent>
          {product.priceTiers.length > 0 ? (
            <table className="w-full text-sm border">
              <thead className="bg-muted/30 text-left">
                <tr>
                  <th className="p-2">Min Qty</th>
                  <th className="p-2">Max Qty</th>
                  <th className="p-2">Harga</th>
                </tr>
              </thead>
              <tbody>
                {product.priceTiers.map((tier) => (
                  <tr key={tier.id} className="border-t">
                    <td className="p-2">{tier.minQuantity}</td>
                    <td className="p-2">{tier.maxQuantity ?? "∞"}</td>
                    <td className="p-2 font-semibold">
                      Rp {tier.price.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tidak ada data harga.
            </p>
          )}
        </CardContent>
      </Card>

      {/* === MEDIA === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GalleryHorizontal className="h-4 w-4" /> Media Produk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gambar */}
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Image
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {product.images.length > 0 ? (
                product.images.map((img) => (
                  <Dialog key={img.id}>
                    <DialogTrigger asChild>
                      <img
                        src={img.url}
                        alt="Product Image"
                        className="h-24 w-24 object-cover rounded-md border cursor-pointer hover:opacity-80 transition"
                      />
                    </DialogTrigger>

                    <DialogContent className="max-w-3xl p-0 overflow-hidden">
                      <DialogTitle className="sr-only">
                        Image Preview
                      </DialogTitle>
                      <img
                        src={img.url}
                        alt="Full Preview"
                        className="max-h-[80vh] w-auto mx-auto rounded-md object-contain"
                      />
                    </DialogContent>
                  </Dialog>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tidak ada gambar.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Click to view full image
            </p>
          </div>

          {/* Video */}
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <VideoIcon className="h-4 w-4" /> Video
            </h3>
            <div className="flex flex-wrap gap-4 mt-2">
              {product.videos.length > 0 ? (
                product.videos.map((vid) => (
                  <video
                    key={vid.id}
                    controls
                    src={vid.url}
                    className="h-[40%] rounded-md border bg-black"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tidak ada video.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === META INFO === */}
      <p className="text-xs text-muted-foreground text-right">
        Dibuat: {new Date(product.createdAt).toLocaleString("id-ID")} —
        Diperbarui: {new Date(product.updatedAt).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
