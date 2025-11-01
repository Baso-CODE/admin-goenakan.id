"use client";

import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export default function Header() {
  const role = useUserRole();

  return (
    <header className="border-b bg-card h-14 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold capitalize">
        {role.replace("-", " ")}
      </h1>
      <Button variant="outline" size="sm">
        Logout
      </Button>
    </header>
  );
}
