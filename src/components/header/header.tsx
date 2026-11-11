"use client";

import NotificationBell from "@/components/notifications/notificationBell";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export default function Header() {
  const role = useUserRole();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-lg font-semibold capitalize">
        {role?.replace("-", " ") || "User"}
      </h1>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <Button variant="outline" size="sm">
          Logout
        </Button>
      </div>
    </header>
  );
}
