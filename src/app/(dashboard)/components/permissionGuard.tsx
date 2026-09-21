"use client";

import { useSession } from "next-auth/react";
import React from "react";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session } = useSession();

  const userPermissions: string[] = (session?.user as any)?.permissions || [];

  const hasPermission = userPermissions.includes(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
