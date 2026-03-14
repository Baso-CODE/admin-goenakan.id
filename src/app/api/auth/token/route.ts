// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   const cookieName =
//     process.env.NODE_ENV === "production"
//       ? "__Secure-next-auth.session-token"
//       : "next-auth.session-token";

//   const token = req.cookies.get(cookieName)?.value;

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   return NextResponse.json({ token });
// }

// src/app/api/auth/token/route.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // getToken helper otomatis membaca cookie yang benar (secure/insecure) dan mendecode-nya.
  // Untuk mendapatkan RAW string, kita harus pakai secret dan opsi raw: true
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    raw: true, // PENTING: Ini agar return string, bukan object
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token });
}
``;
