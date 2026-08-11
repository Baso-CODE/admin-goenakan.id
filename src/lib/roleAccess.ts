// src/lib/roleAccess.ts

export const checkPermission = (
  userPermissions: string[],
  requiredPermission: string,
  userRole?: string,
): boolean => {
  if (userRole === "SUPER_ADMIN") {
    return true;
  }

  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  return userPermissions.includes(requiredPermission);
};
