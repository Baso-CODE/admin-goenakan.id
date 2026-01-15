// src/app/super-admin/sales/[id]/page.tsx (ASUMSI LOKASI FILE)
"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Link2,
  Loader2,
  Phone,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiUrl } from "@/helper/apiurl";
import SalesBankForm from "../../components/SalesBankForm";

// Definisi Tipe Data Sales (sesuai respons backend)
interface SalesBank {
  id: string;
  salesId: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  createdAt: string;
  updatedAt: string;
}

interface SalesData {
  id: string;
  prefix: string;
  name: string;
  phone: string;
  signatureUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bankAccounts: SalesBank[];
}

export default function SalesDetailPage() {
  const { id } = useParams();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fungsi untuk mengambil data sales
  const fetchSalesData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch sales data");
      }

      const data = await res.json();
      setSalesData(data);
    } catch (err) {
      console.error("❌ Error fetching sales data:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load sales data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading sales data...</span>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="text-center p-8">
        <Info className="h-6 w-6 inline-block mr-2" />
        Sales person not found.
      </div>
    );
  }

  const initialBankAccountsForForm = salesData.bankAccounts.map((bank) => ({
    id: bank.id,
    bankName: bank.bankName,
    accountNumber: bank.accountNumber,
    accountHolderName: bank.accountHolderName,
  }));

  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Sales Detail: {salesData.prefix} {salesData.name}
        </h2>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
      </div>

      {/* --- Bagian 1: Detail Sales (Read-Only) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Sales Information
          </CardTitle>
          <CardDescription>
            Core information of the sales representative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {/* Name & Prefix */}
            <DetailItem
              icon={User}
              label="Full Name"
              value={`${salesData.prefix} ${salesData.name}`}
            />
            {/* Phone */}
            <DetailItem icon={Phone} label="Phone" value={salesData.phone} />
            {/* Status */}
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Active Status
              </p>

              <Badge
                variant={salesData.isActive ? "default" : "secondary"}
                className="mt-1">
                {salesData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium leading-none flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Signature
              </p>
              {salesData.signatureUrl ? (
                <div className="mt-2">
                  {/* Container yang bisa diklik */}
                  <div
                    className="border rounded-md p-1 max-w-[10rem] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsDialogOpen(true)}>
                    <img
                      src={salesData.signatureUrl}
                      alt={`Signature of ${salesData.name}`}
                      className="w-full h-auto object-contain max-h-24 rounded-md"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view full image
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  - No signature uploaded -
                </p>
              )}
            </div>

            {/* Created/Updated At (Ini adalah field sisanya) */}
            <DetailItem
              icon={FileText}
              label="Created At"
              value={new Date(salesData.createdAt).toLocaleDateString()}
            />

            <DetailItem
              icon={FileText}
              label="Last Updated"
              value={new Date(salesData.updatedAt).toLocaleDateString()}
            />
          </div>
        </CardContent>
      </Card>

      {/* --- Bagian 2: Form Update Bank Accounts --- */}
      <SalesBankForm
        salesId={salesData.id}
        initialBankAccounts={initialBankAccountsForForm}
        onUpdateSuccess={fetchSalesData}
      />

      {/* --- Komponen Dialog Tanda Tangan --- */}
      {salesData.signatureUrl && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Full Signature Preview</DialogTitle>
              <DialogDescription>
                Tanda tangan untuk sales: {salesData.prefix} {salesData.name}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <img
                src={salesData.signatureUrl}
                alt={`Full Signature of ${salesData.name}`}
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Komponen Pembantu untuk Menampilkan Detail
const DetailItem = ({ icon: Icon, label, value, isLink = false }: any) => (
  <div className="space-y-1">
    <p className="text-sm font-medium leading-none flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </p>
    {isLink ? (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline">
        {value}
      </a>
    ) : (
      <p className="text-sm text-muted-foreground">{value}</p>
    )}
  </div>
);
