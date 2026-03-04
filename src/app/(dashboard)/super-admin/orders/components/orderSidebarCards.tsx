import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  MapPin,
  Phone,
  Store,
  Truck,
  User,
  UserCircle,
} from "lucide-react";
import { OrderDetail, OrderVendor } from "../types/order.types";

// ========================
// CustomerCard
// ========================
interface CustomerCardProps {
  clientInfo: OrderDetail["clientInfo"];
  purchaseChannelName: string;
}

export function CustomerCard({
  clientInfo,
  purchaseChannelName,
}: CustomerCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
          <User className="h-4 w-4 text-primary" />
          Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900 leading-tight">
              {clientInfo.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Client Name</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-medium border-primary/20 text-primary bg-primary/5">
              {clientInfo.type}
            </Badge>
            <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
              Via: {purchaseChannelName}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {clientInfo.type === "B2B" && clientInfo.picName !== "-" && (
            <div className="flex items-center gap-3 p-2.5 rounded-md bg-orange-50 border border-orange-100">
              <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shadow-sm shrink-0">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-orange-600/80 font-medium">
                  PIC / UP
                </p>
                <p className="text-sm font-bold text-orange-900 truncate">
                  {clientInfo.picName}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-2.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shadow-sm shrink-0">
              <Phone className="h-4 w-4 text-gray-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground font-medium">Phone</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {clientInfo.type === "B2B" && clientInfo.picPhone !== "-"
                  ? clientInfo.picPhone
                  : clientInfo.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-md bg-gray-50 border border-gray-100">
            <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shadow-sm shrink-0">
              <Mail className="h-4 w-4 text-gray-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground font-medium">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {clientInfo.email}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================
// SalesCard
// ========================
interface SalesCardProps {
  sales: OrderDetail["sales"];
}

export function SalesCard({ sales }: SalesCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
          <UserCircle className="h-4 w-4 text-primary" />
          Sales Representative
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
            {sales.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">
              {sales.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{sales.phone}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================
// VendorsCard
// ========================
interface VendorsCardProps {
  vendors: OrderVendor[];
}

export function VendorsCard({ vendors }: VendorsCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 uppercase tracking-wider">
          <Store className="h-4 w-4 text-primary" />
          Vendors Involved
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {vendors.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {vendors.map((vendor, idx) => (
              <div key={idx} className="py-4 first:pt-5 last:pb-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm text-gray-900">
                    {vendor.companyName}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5 font-normal bg-gray-100 text-gray-600">
                    {vendor.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground bg-gray-50 p-2 rounded border border-gray-100/50">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {vendor.picName}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-gray-300" />
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span>{vendor.picPhone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
              <Store className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-sm text-muted-foreground">
              No vendors assigned.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========================
// ShippingCard
// ========================
interface ShippingCardProps {
  shippingAddress: string;
}

export function ShippingCard({ shippingAddress }: ShippingCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-800">
          <Truck className="h-4 w-4 text-blue-600" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-start bg-blue-50 p-4 rounded-md text-blue-900">
          <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm mb-1">Delivery Address</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {shippingAddress}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
