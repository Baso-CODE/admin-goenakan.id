// app/super-admin/components/tabs/CustomerAnalyticTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerAnalyticTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 rounded-md">
          {/* Nanti masukkan Chart Customer, Demografi, Retention disini */}
          Area ini sedang dalam pengembangan...
        </CardContent>
      </Card>
    </div>
  );
}
