"use client";

import SidebarRole from "@/components/sidebar/SidebarRole";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter((seg) => seg && seg !== "dashboard");

  const formatSegment = (segment: string) => {
    if (/^[0-9a-fA-F-]{10,}$/.test(segment)) return "";
    if (!isNaN(Number(segment))) return `ID ${segment}`;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const breadcrumbPaths = segments.map((seg, i) => ({
    name: formatSegment(seg),
    href: `/${segments.slice(0, i + 1).join("/")}`,
  }));

  return (
    <SidebarProvider>
      <SidebarRole />
      <SidebarInset className="overflow-x-hidden">
        {/* === FIXED HEADER === */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4 ">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {breadcrumbPaths.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === breadcrumbPaths.length - 1 ? (
                        <BreadcrumbPage>{item.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.name}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {/* === MAIN CONTENT === */}
        <main className="p-4 overflow-y-auto w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
