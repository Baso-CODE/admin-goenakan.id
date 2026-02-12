import { apiUrl } from "@/helper/apiurl";
import { getSession } from "next-auth/react";

export async function getToken() {
  const res = await fetch("/api/auth/token");
  if (!res.ok) throw new Error("Failed to fetch token");
  const data = await res.json();
  return data.token;
}

export async function fetchWithToken(url: string) {
  const token = await getToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

async function getAuthToken() {
  const session = await getSession();
  console.log("ini adlah console.log", session);

  return session?.expires ? session.user : null;
}

export async function fetchWithTokenNew(
  url: string,
  options: RequestInit = {},
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("No authentication token found. Please login.");
    }

    // Gabungkan headers bawaan dengan Authorization header
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      // Coba baca pesan error dari backend jika ada
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error; // Re-throw agar bisa ditangkap di komponen
  }
}

export async function postOrder(data: any) {
  const token = await getToken();
  const res = await fetch(`${apiUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}

export async function generatePoNumber() {
  try {
    const token = await getToken();

    const res = await fetch(`${apiUrl}/orders/generate-po`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.poNumber;
  } catch (error) {
    console.error(
      "Gagal generate PO dari server, menggunakan fallback:",
      error,
    );

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `GI-FB-${year}${month}-${random}`;
  }
}

export async function fetchOrderById(id: string) {
  return fetchWithToken(`${apiUrl}/orders/${id}/edit-data`);
}

export async function updateOrder(id: string, data: any) {
  const token = await getToken();
  const res = await fetch(`${apiUrl}/orders/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update order");
  return res.json();
}
