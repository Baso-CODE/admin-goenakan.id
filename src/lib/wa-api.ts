/**
 * Server-side helper to communicate with Catha WhatsApp Middleware API (wa-api.goenakan.tech)
 * Injects WA_API_KEY header and enforces timeouts.
 */

const getBaseUrl = (): string => {
  const url = process.env.WA_API_URL || "https://wa-api.goenakan.tech";
  return url.replace(/\/+$/, "");
};

const getApiKey = (): string => {
  return process.env.WA_API_KEY || "";
};

export class WaApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "WaApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Executes a typed request to Catha WhatsApp API.
 * Only call this from Server Components or Route Handlers!
 */
export async function fetchWaApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${baseUrl}${cleanPath}`;

  const headers = new Headers(options.headers);
  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(12000),
      cache: "no-store",
    });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      throw new WaApiError("WhatsApp API request timed out (12s)", 504);
    }
    throw new WaApiError(err.message || "Failed to connect to WhatsApp API", 502);
  }

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text().catch(() => null);
    }
    const message =
      (typeof errorData === "object" && (errorData?.message || errorData?.error)) ||
      `WhatsApp API error: ${response.status} ${response.statusText}`;

    throw new WaApiError(message, response.status, errorData);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

/**
 * Returns raw Response object (useful for proxying binary streams like QR PNG)
 */
export async function fetchWaApiRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${baseUrl}${cleanPath}`;

  const headers = new Headers(options.headers);
  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }

  const isStreaming = cleanPath.includes("/events");
  const signal = options.signal !== undefined ? options.signal : isStreaming ? undefined : AbortSignal.timeout(12000);

  try {
    return await fetch(targetUrl, {
      ...options,
      headers,
      signal,
      cache: "no-store",
    });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      throw new WaApiError("WhatsApp API request timed out (12s)", 504);
    }
    if (err.name === "AbortError") {
      throw new WaApiError("Client disconnected", 499);
    }
    throw new WaApiError(err.message || "Failed to connect to WhatsApp API", 502);
  }
}
