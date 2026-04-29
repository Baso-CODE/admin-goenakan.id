// app/super-admin/components/tabs/OpsDashboardTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OpsDashboardTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Operational Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 rounded-md">
          {/* Nanti masukkan data antrean order, stok kritis, performa staf dll */}
          Area ini sedang dalam pengembangan...
        </CardContent>
      </Card>
    </div>
  );
}
