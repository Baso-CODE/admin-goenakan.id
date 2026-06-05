// 1. Fungsi Post Order
export async function postOrder(fetchApi: any, data: any) {
  const res = await fetchApi("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create order");
  }
  return res.json();
}

// 2. Fungsi Generate PO Number
export async function generatePoNumber(
  fetchApi: any,
  salesCategory: "SALES" | "SAMPLE" = "SALES",
) {
  try {
    const res = await fetchApi(
      `/orders/generate-po?category=${salesCategory}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const json = await res.json();

    if (json.success && json.data) {
      return json.data;
    }

    return json.poNumber || json;
  } catch (error) {
    console.error(
      `Gagal generate ${salesCategory === "SALES" ? "SO" : "SN"} dari server, menggunakan fallback:`,
      error,
    );

    const prefix = salesCategory === "SALES" ? "GI-SO-FB" : "GI-SN-FB";

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    return `${prefix}-${year}${month}-${random}`;
  }
}

// 3. Fungsi Fetch Order By ID
export async function fetchOrderById(fetchApi: any, id: string) {
  const res = await fetchApi(`/orders/${id}/edit-data`);
  if (!res.ok) throw new Error("Failed to fetch order data");
  return res.json();
}

// 4. Fungsi Update Order
export async function updateOrder(fetchApi: any, id: string, data: any) {
  const res = await fetchApi(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update order");
  }
  return res.json();
}
