import { sign } from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { comparePassword } from "./argon";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
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

        if (!user || !user.password) {
          return null;
        }

        const isValid = await comparePassword(
          credentials.password,
          user.password,
        );

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

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;

        // ✨ Tambahkan proteksi agar secret tidak undefined
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
          throw new Error("NEXTAUTH_SECRET is not defined");
        }

        token.accessToken = sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          secret,
          { expiresIn: "1d" },
        );
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.email = token.email as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
