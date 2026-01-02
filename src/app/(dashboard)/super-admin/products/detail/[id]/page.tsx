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
  VideoIcon,
  Boxes,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductSeoForm } from "../../components/productSeoForm";

interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  description: string;
  basePrice: number;
  isCustom: boolean;
  materialType?: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  priceTiers: {
    id: string;
    minQuantity: number;
    price: number;
  }[];
  images: {
    id: string;
    url: string;
    isFeatured: boolean;
    altText: string;
  }[];
  videos: {
    id: string;
    url: string;
    title: string;
  }[];
  attributeValues: {
    id: string;
    attributeValue: {
      id: string;
      value: string;
      attribute: { id: string; name: string };
    };
  }[];
  productVariants: {
    id: string;
    sku: string;
    price: number | null;
    stock: number;
    images: {
      id: string;
      url: string;
      isFeatured: boolean;
      altText: string;
    }[];
    attributeValues: {
      id: string;
      attributeValue: {
        id: string;
        value: string;
        attribute: { id: string; name: string };
      };
    }[];
  }[];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data Product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`http://localhost:8000/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
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

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // No Product Found
  if (!product) {
    return <p className="text-muted-foreground">Produk tidak ditemukan.</p>;
  }

  // Grouping Attributes
  const groupedAttributes = product.attributeValues.reduce((acc, current) => {
    const attrName = current.attributeValue.attribute.name;
    if (!acc[attrName]) acc[attrName] = [];
    acc[attrName].push(current.attributeValue.value);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground">{product.description}</p>
        <div className="mt-2">
          <Badge variant="outline">{product.category?.name}</Badge>
        </div>
      </div>

      <Separator />

      {/* INFORMASI UMUM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" /> Informasi Umum
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SKU */}
          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">SKU Dasar</span>
            <span className="font-medium">{product.sku || "-"}</span>
          </div>

          {/* Harga */}
          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">Harga Dasar</span>
            <span className="font-semibold text-green-700">
              Rp {product.basePrice.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Material */}
          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Jenis Material
            </span>
            <span className="font-medium">{product.materialType || "-"}</span>
          </div>

          {/* Custom */}
          <div className="flex flex-col border rounded-md p-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">Custom Produk</span>
            <span className="font-medium">
              {product.isCustom ? "Ya" : "Tidak"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ATRIBUT */}
      <Card>
        <CardHeader>
          <CardTitle>Atribut Produk (Opsi Tersedia)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {Object.entries(groupedAttributes).length > 0 ? (
            Object.entries(groupedAttributes).map(([name, values]) => (
              <div key={name} className="border-b pb-2">
                <h4 className="text-sm font-semibold">{name}:</h4>

                <div className="flex flex-wrap gap-2 mt-1">
                  {values.map((value) => (
                    <Badge key={value} variant="secondary">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada atribut.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* VARIANT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-4 w-4" /> Daftar Varian Produk (
            {product.productVariants.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {product.productVariants.length > 0 ? (
            product.productVariants.map((variant, index) => (
              <div
                key={variant.id}
                className="border p-4 rounded-lg bg-card shadow-sm"
              >
                {/* Title */}
                <h4 className="font-bold text-lg mb-2 text-primary">
                  Varian #{index + 1}
                </h4>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      SKU Varian
                    </span>
                    <span className="font-medium">{variant.sku}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Stok</span>
                    <span className="font-medium">
                      {variant.stock.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex flex-col col-span-2">
                    <span className="text-xs text-muted-foreground">
                      Harga Khusus Varian
                    </span>
                    <span className="font-semibold text-green-600">
                      {variant.price
                        ? `Rp ${variant.price.toLocaleString("id-ID")}`
                        : "Mengikuti Harga Dasar"}
                    </span>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Attributes */}
                <div>
                  <h5 className="text-sm font-semibold mb-1">
                    Kombinasi Atribut:
                  </h5>

                  <div className="flex flex-wrap gap-2">
                    {variant.attributeValues.map((av) => (
                      <Badge
                        key={av.id}
                        variant="default"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {av.attributeValue.attribute.name}:
                        {av.attributeValue.value}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Images */}
                <div>
                  <h5 className="text-sm font-semibold mb-1">Gambar Varian:</h5>

                  <div className="flex flex-wrap gap-2">
                    {variant.images.length > 0 ? (
                      variant.images.map((img) => (
                        <Dialog key={img.id}>
                          <DialogTrigger asChild>
                            <div className="relative">
                              <img
                                src={img.url}
                                alt={img.altText || "Variant Image"}
                                className="h-20 w-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition"
                              />

                              {img.isFeatured && (
                                <span className="absolute top-0 right-0 bg-yellow-500 text-white text-[8px] font-bold px-1 rounded-bl">
                                  Featured
                                </span>
                              )}
                            </div>
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
                      <p className="text-xs text-muted-foreground">
                        Tidak ada gambar varian.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Produk ini tidak memiliki varian.
            </p>
          )}
        </CardContent>
      </Card>

      {/* PRICE TIERS */}
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
                  <th className="p-2">Harga</th>
                </tr>
              </thead>

              <tbody>
                {product.priceTiers.map((tier) => (
                  <tr key={tier.id} className="border-t">
                    <td className="p-2">{tier.minQuantity}</td>
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

      {/* MEDIA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GalleryHorizontal className="h-4 w-4" /> Media Produk Utama
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Images */}
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

          {/* Videos */}
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
                    className="h-24 w-32 object-cover rounded-md border bg-black"
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
      {/* META */}
      <p className="text-xs text-muted-foreground text-right">
        Dibuat: {new Date(product.createdAt).toLocaleString("id-ID")} —
        Diperbarui: {new Date(product.updatedAt).toLocaleString("id-ID")}
      </p>
      {product && (
        <>
          <Separator className="my-8" />
          <ProductSeoForm productId={product.id} />
        </>
      )}
    </div>
  );
}
