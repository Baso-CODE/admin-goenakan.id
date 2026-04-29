// app/super-admin/components/sales/SalesOverviewMetrics.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  DollarSign,
  PiggyBank,
  Receipt,
  ShoppingCart,
} from "lucide-react";

// Definisikan tipe data props yang diterima
interface MetricsData {
  revenue: string;
  orders: string;
  averagePurchase: string;
  profit: string;
}

export default function SalesOverviewCard({
  metrics,
}: {
  metrics: MetricsData;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* REVENUE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Revenue{" "}
            <span className="text-[10px] text-muted-foreground font-normal">
              (default today)
            </span>
          </CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.revenue}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            +12.5% dari periode lalu
          </p>
        </CardContent>
      </Card>

      {/* ORDER */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Order{" "}
            <span className="text-[10px] text-muted-foreground font-normal">
              (default today)
            </span>
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.orders}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            +8.2% dari periode lalu
          </p>
        </CardContent>
      </Card>

      {/* AVG PURCHASE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Purchase Customer
          </CardTitle>
          <Receipt className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averagePurchase}</div>
          <p className="text-[10px] text-muted-foreground mt-1 italic">
            = revenue / order
          </p>
        </CardContent>
      </Card>

      {/* PROFIT */}
      <Card className="shadow-sm border-indigo-100 bg-indigo-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold text-indigo-900">
              Profit
            </CardTitle>
            <CardDescription className="text-[9px] leading-tight max-w-30">
              (Owner Account Only. Default today)
            </CardDescription>
          </div>
          <div className="p-2 bg-indigo-100 rounded-full">
            <PiggyBank className="h-4 w-4 text-indigo-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-700">
            {metrics.profit}
          </div>
          <p className="text-[10px] text-indigo-600/70 mt-1 italic">
            = revenue - cost
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
