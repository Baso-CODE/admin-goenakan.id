// app/super-admin/components/customer-analytic/customerMetrics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, RotateCcw, Target, UserPlus } from "lucide-react";

interface CustomerMetricsProps {
  data?: {
    newCustomer: number;
    returningCustomer: number;
    clv: number;
    cac: number;
  };
}

// Helper format angka & mata uang
const formatNumber = (val: number) =>
  new Intl.NumberFormat("id-ID").format(val || 0);
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val || 0);

export default function CustomerMetrics({ data }: CustomerMetricsProps) {
  const safeData = data || {
    newCustomer: 0,
    returningCustomer: 0,
    clv: 0,
    cac: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. NEW CUSTOMER */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            New Customer
            <span className="text-[10px] text-muted-foreground font-normal">
              (Berdasarkan filter)
            </span>
          </CardTitle>
          <UserPlus className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(safeData.newCustomer)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic leading-tight">
            *customer yang baru pertama kali order.
          </p>
        </CardContent>
      </Card>

      {/* 2. RETURNING CUSTOMER */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Returning Customer
            <span className="text-[10px] text-muted-foreground font-normal">
              (Berdasarkan filter)
            </span>
          </CardTitle>
          <RotateCcw className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(safeData.returningCustomer)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic leading-tight">
            *customer yang order lebih dari 1 kali.
          </p>
        </CardContent>
      </Card>

      {/* 3. CUSTOMER LIFETIME VALUE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-900">
            Customer Lifetime Value
          </CardTitle>
          <Gem className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">
            {formatCurrency(safeData.clv)}
          </div>
          <p className="text-[10px] text-amber-600 mt-2 italic font-medium">
            *(avg order sales x freq x cus lifetime)
          </p>
        </CardContent>
      </Card>

      {/* 4. CUSTOMER ACQUISITION COST */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-rose-900">
            Customer Acquisition Cost
          </CardTitle>
          <Target className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700">
            {formatCurrency(safeData.cac)}
          </div>
          <p className="text-[10px] text-rose-600 mt-2 italic font-medium">
            *(marketing cost / new customer)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
