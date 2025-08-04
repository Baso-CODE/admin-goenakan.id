"use client";

import ButtonLogout from "@/components/button-logout";
import { authClient } from "@/lib/auth";
import Link from "next/link";

const ClientPage = () => {
  const { data: session } = authClient.useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">Welcome to Better Auth</h1>
      {session ? (
        <div className="">
          <div className="mt-4 text-2xl">Hi, {session.user.name}</div>
          <ButtonLogout />
        </div>
      ) : (
        <div className="mt-4 text-2xl flex flex-col items-center gap-2">
          <p>You are not logged in.</p>
          <div className="flex gap-4">
            <Link href="/login" className="text-primary underline">
              Login
            </Link>
            <Link href="/register" className="text-primary underline">
              Register
            </Link>
          </div>
        </div>
      )}
    </main>
  );
};

export default ClientPage;
