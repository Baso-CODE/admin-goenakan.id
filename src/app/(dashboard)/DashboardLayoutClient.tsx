"use client";

import NotificationBell from "@/components/notifications/notificationBell";
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

  // ============================================
  // BREADCRUMB SEGMENTS
  // ============================================

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
        {/* =====================================
            FIXED HEADER
        ===================================== */}
        <header
          className="
            sticky top-0 z-40
            flex h-16 items-center
            justify-between gap-3
            border-b bg-background/80
            px-4 backdrop-blur-md
          ">
          {/* LEFT: SIDEBAR + BREADCRUMB */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SidebarTrigger className="-ml-1 shrink-0" />

            <Separator
              orientation="vertical"
              className="
                mr-2 shrink-0
                data-[orientation=vertical]:h-4
              "
            />

            <div className="min-w-0 flex-1 overflow-hidden">
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap">
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
                          <BreadcrumbPage className="max-w-40 truncate sm:max-w-none">
                            {item.name}
                          </BreadcrumbPage>
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
          </div>

          {/* RIGHT: NOTIFICATION CENTER */}
          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* =====================================
            MAIN CONTENT
        ===================================== */}
        <main className="w-full min-w-0 overflow-x-hidden overflow-y-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
