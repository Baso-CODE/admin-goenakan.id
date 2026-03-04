import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatCurrency";
import { CheckCircle, FileText, Wallet } from "lucide-react";

interface FinancialSummaryCardProps {
  totalOrderAmount: number;
  totalInvoiced: number;
  totalPaid: number;
  remainingToInvoice: number;
  paymentProgress: number;
  onGenerateInvoice: () => void;
}

export function FinancialSummaryCard({
  totalOrderAmount,
  totalInvoiced,
  totalPaid,
  remainingToInvoice,
  paymentProgress,
  onGenerateInvoice,
}: FinancialSummaryCardProps) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Wallet className="h-5 w-5 text-blue-600" />
            Financial Summary
          </CardTitle>

          {remainingToInvoice > 0 ? (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onGenerateInvoice}>
              <FileText className="mr-2 h-4 w-4" /> Generate Invoice
            </Button>
          ) : (
            <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
              <CheckCircle className="mr-1 h-3 w-3" /> Fully Invoiced
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: "Total Order",
              value: totalOrderAmount,
              color: "text-gray-900",
            },
            {
              label: "Total Ditagihkan",
              value: totalInvoiced,
              color: "text-blue-600",
            },
            {
              label: "Sudah Dibayar",
              value: totalPaid,
              color: "text-green-600",
            },
            {
              label: "Sisa Tagihan",
              value: remainingToInvoice,
              color: "text-orange-600",
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {label}
              </p>
              <p className={`text-xl font-bold ${color}`}>
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Payment Progress</span>
            <span>{paymentProgress}% Paid</span>
          </div>
          <Progress value={paymentProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
