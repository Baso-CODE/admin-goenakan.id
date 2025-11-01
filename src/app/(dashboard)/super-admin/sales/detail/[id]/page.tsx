// src/app/super-admin/sales/[id]/page.tsx (ASUMSI LOKASI FILE)
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Link2,
  FileText,
  Loader2,
  Banknote,
  ArrowLeft,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

  // Fungsi untuk mengambil data sales
  const fetchSalesData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`http://localhost:8000/sales/${id}`, {
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
    <div className="space-y-8 p-4 md:p-6 w-full max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Sales Detail: {salesData.prefix} {salesData.name}
        </h2>
        <Button onClick={() => window.history.back()} variant="outline">
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
                className="mt-1"
              >
                {salesData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {/* Signature URL */}
            <DetailItem
              icon={Link2}
              label="Signature URL"
              value={salesData.signatureUrl || "- Not Set -"}
              isLink={!!salesData.signatureUrl}
            />
            {/* Created/Updated At */}
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
        className="text-sm text-primary hover:underline"
      >
        {value}
      </a>
    ) : (
      <p className="text-sm text-muted-foreground">{value}</p>
    )}
  </div>
);
