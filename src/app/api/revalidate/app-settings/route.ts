import { NextResponse } from "next/server";

export async function POST() {
  try {
    const clientUrl = process.env.CLIENT_WEB_URL;

    const secret = process.env.REVALIDATE_SECRET;

    if (!clientUrl || !secret) {
      return NextResponse.json(
        {
          message: "Revalidation configuration is missing",
        },
        {
          status: 500,
        },
      );
    }

    const response = await fetch(`${clientUrl}/api/revalidate/app-settings`, {
      method: "POST",
      headers: {
        "x-revalidate-secret": secret,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      return NextResponse.json(
        {
          message: data.message || "Failed to revalidate public cache",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json({
      message: "Public app settings cache revalidated",
    });
  } catch (error) {
    console.error("Revalidation error:", error);

    return NextResponse.json(
      {
        message: "Failed to revalidate app settings",
      },
      {
        status: 500,
      },
    );
  }
}
