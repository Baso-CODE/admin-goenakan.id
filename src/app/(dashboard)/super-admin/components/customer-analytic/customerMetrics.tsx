import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, RotateCcw, Target, UserPlus } from "lucide-react";

export default function CustomerMetrics() {
  // Dummy Data
  const data = {
    newCustomer: "88,978",
    returningCustomer: "88,978",
    clvRate: "767%",
    cacRate: "767%",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. NEW CUSTOMER */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            New Customer{" "}
            <span className="text-[10px] text-muted-foreground font-normal">
              this month
            </span>
          </CardTitle>
          <UserPlus className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.newCustomer}</div>
          <p className="text-[10px] text-muted-foreground mt-2 italic leading-tight">
            *customer yang baru pertama kali order di bulan ini.
          </p>
        </CardContent>
      </Card>

      {/* 2. RETURNING CUSTOMER */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Returning Customer{" "}
            <span className="text-[10px] text-muted-foreground font-normal">
              this month
            </span>
          </CardTitle>
          <RotateCcw className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.returningCustomer}</div>
          <p className="text-[10px] text-muted-foreground mt-2 italic leading-tight">
            *customer yang order lebih dari 1 kali di bulan yang sama.
          </p>
        </CardContent>
      </Card>

      {/* 3. CUSTOMER LIFETIME VALUE RATE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-900">
            Customer Lifetime Value Rate
          </CardTitle>
          <Gem className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">
            {data.clvRate}
          </div>
          <p className="text-[10px] text-amber-600 mt-2 italic font-medium">
            *(average order sales x freq x cus lifetime)
          </p>
        </CardContent>
      </Card>

      {/* 4. CUSTOMER ACQUISITION RATE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-rose-900">
            Customer Acquisition Rate
          </CardTitle>
          <Target className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700">{data.cacRate}</div>
          <p className="text-[10px] text-rose-600 mt-2 italic font-medium">
            *(marketing cost / new customer)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
