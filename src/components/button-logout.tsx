"use client";

import { authClient } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const ButtonLogout = () => {
  const router = useRouter();
  const handleLogout = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <Button variant="destructive" onClick={handleLogout}>
      Logout
    </Button>
  );
};

export default ButtonLogout;
