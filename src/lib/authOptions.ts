import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { comparePassword } from "./argon";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // === PROVIDER ===
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "m@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        // LOG 1: Cek apakah user ada di DB
        console.log("DEBUG: User ditemukan di DB ->", user ? "YA" : "TIDAK");
        if (!user) return null;

        const isValid = await comparePassword(
          credentials.password,
          user.password,
        );
        console.log("DEBUG: Password Valid ->", isValid);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  // === SESSION STRATEGY: JWT ===
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },

  // === JWT CONFIG ===
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  // === CUSTOM PAGE ===
  pages: {
    signIn: "/login",
  },

  // === CALLBACKS ===
  callbacks: {
    async jwt({ token, user }) {
      // simpan data user ke dalam token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      // kirim data token ke session agar bisa diakses di client
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  // === SECRET ===
  secret: process.env.NEXTAUTH_SECRET,
};
