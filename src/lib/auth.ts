import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL_API,
  plugins: [nextCookies()],
});

export const getSession = async (cookie: ReadonlyRequestCookies) => {
  const { data: session } = await authClient.getSession({
    fetchOptions: { headers: { cookie: cookie.toString() } },
  });

  return session;
};
