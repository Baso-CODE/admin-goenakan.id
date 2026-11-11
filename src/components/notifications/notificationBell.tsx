"use client";

import { useApi } from "@/hooks/useApi";
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronRight,
  Link2,
  Loader2,
  SearchCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

type NotificationResponse = {
  data: AdminNotification[];
  meta: {
    page: number;
    take: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
};

type UnreadCountResponse = {
  unreadCount: number;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
// Halaman target akan kita implementasikan pada tahap berikutnya.
function resolveActionUrl(notification: AdminNotification): string | null {
  const url = notification.actionUrl;

  if (!url) return null;

  if (url.startsWith("/admin/product-url-approvals/")) {
    const id = url.split("/").filter(Boolean).at(-1);

    if (id) {
      return `/super-admin/product-url-approvals?requestId=${encodeURIComponent(id)}`;
    }
  }

  if (url === "/admin/seo-redirect-tasks") {
    return "/super-admin/seo-redirect-tasks";
  }

  // Hanya terima path internal Admin yang dikenal.
  if (url.startsWith("/super-admin/") || url.startsWith("/admin-invoice/")) {
    return url;
  }

  return null;
}

export default function NotificationBell() {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  // ========================================
  // LOAD UNREAD COUNT
  // ========================================

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetchApi("/admin-notifications/unread-count", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const result = (await response.json()) as UnreadCountResponse;

      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  }, [fetchApi]);

  // ========================================
  // LOAD NOTIFICATION LIST
  // ========================================

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchApi("/admin-notifications?page=1&take=10", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil daftar notifikasi");
      }

      const result = (await response.json()) as NotificationResponse;

      setNotifications(result.data);
      setUnreadCount(result.meta.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  // ========================================
  // POLLING 30 SECONDS
  // ========================================

  useEffect(() => {
    if (status !== "authenticated") return;

    void loadUnreadCount();

    const interval = setInterval(() => {
      if (!document.hidden) {
        void loadUnreadCount();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [status, loadUnreadCount]);

  // ========================================
  // CLICK OUTSIDE
  // ========================================

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ========================================
  // TOGGLE DROPDOWN
  // ========================================

  const toggleDropdown = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    await loadNotifications();
  };

  // ========================================
  // MARK ONE AS READ
  // ========================================

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (processingId) return;

    setProcessingId(notification.id);

    try {
      if (!notification.isRead) {
        const response = await fetchApi(
          `/admin-notifications/${encodeURIComponent(notification.id)}/read`,
          { method: "PATCH" },
        );

        if (!response.ok) {
          throw new Error("Gagal menandai notifikasi sebagai dibaca");
        }

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );

        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      const target = resolveActionUrl(notification);

      if (target) {
        setOpen(false);
        router.push(target);
      } else {
        toast.info("Notifikasi sudah dibaca. Halaman tujuan belum tersedia.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses notifikasi");
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================
  // MARK ALL AS READ
  // ========================================

  const markAllAsRead = async () => {
    setProcessingId("all");

    try {
      const response = await fetchApi("/admin-notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Gagal menandai semua notifikasi");
      }

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
      toast.success("Semua notifikasi sudah dibaca");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui notifikasi");
    } finally {
      setProcessingId(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === "PRODUCT_URL_SEO_REMINDER") {
      return <SearchCheck className="h-5 w-5" />;
    }

    if (type.startsWith("PRODUCT_URL")) {
      return <Link2 className="h-5 w-5" />;
    }

    return <BellRing className="h-5 w-5" />;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* BELL BUTTON */}
      <button
        type="button"
        onClick={() => void toggleDropdown()}
        aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="
          relative inline-flex h-9 w-9
          items-center justify-center
          rounded-lg border border-border
          bg-background text-foreground
          transition-colors
          hover:bg-accent
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
        ">
        <Bell className="h-4.5 w-4.5" />

        {unreadCount > 0 && (
          <span
            className="
              absolute -right-2 -top-2
              flex h-5 min-w-5
              items-center justify-center
              rounded-full bg-red-600
              px-1 text-[10px]
              font-bold text-white
            ">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          role="dialog"
          aria-label="Notification Center"
          className="
            absolute right-0 top-12 z-100
            w-[min(380px,calc(100vw-24px))]
            overflow-hidden rounded-xl
            border border-border
            bg-popover text-popover-foreground
            shadow-xl
          ">
          {/* HEADER */}
          <div
            className="
              flex items-center justify-between
              gap-3 border-b border-border
              px-4 py-3
            ">
            <div>
              <h3 className="text-sm font-semibold">Notifikasi</h3>

              <p className="text-xs text-muted-foreground">
                {unreadCount} belum dibaca
              </p>
            </div>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={processingId !== null || unreadCount === 0}
              className="
                inline-flex items-center gap-1
                text-xs font-medium
                text-primary
                hover:underline
                disabled:opacity-40
              ">
              <CheckCheck className="h-4 w-4" />
              Baca semua
            </button>
          </div>

          {/* CONTENT */}
          <div
            className="
              max-h-105
              overflow-y-auto
            ">
            {loading ? (
              <div
                className="
                  flex items-center
                  justify-center py-12
                ">
                <Loader2
                  className="
                    h-5 w-5 animate-spin
                    text-muted-foreground
                  "
                />
              </div>
            ) : notifications.length === 0 ? (
              <div
                className="
                  flex flex-col items-center
                  gap-2 px-4 py-12
                  text-center
                ">
                <Bell className="h-8 w-8 text-muted-foreground" />

                <p className="text-sm font-medium">Belum ada notifikasi</p>

                <p className="text-xs text-muted-foreground">
                  Notifikasi baru akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  disabled={processingId !== null}
                  onClick={() => void handleNotificationClick(notification)}
                  className={`
                    flex w-full items-start
                    gap-3 border-b border-border
                    px-4 py-3 text-left
                    transition-colors
                    hover:bg-accent/60
                    disabled:opacity-60
                    ${!notification.isRead ? "bg-primary/5" : ""}
                  `}>
                  <span
                    className="
                      flex h-9 w-9 shrink-0
                      items-center justify-center
                      rounded-lg bg-primary/10
                      text-primary
                    ">
                    {getNotificationIcon(notification.type)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className="
                          text-sm font-semibold
                          leading-5
                        ">
                        {notification.title}
                      </span>

                      {!notification.isRead && (
                        <span
                          className="
                            mt-1.5 h-2 w-2
                            shrink-0 rounded-full
                            bg-blue-500
                          "
                        />
                      )}
                    </span>

                    <span
                      className="
                        mt-1 block text-xs
                        leading-5
                        text-muted-foreground
                      ">
                      {notification.message}
                    </span>

                    <span
                      className="
                        mt-2 flex items-center
                        justify-between
                        text-[11px]
                        text-muted-foreground
                      ">
                      {formatDate(notification.createdAt)}

                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div
            className="
              border-t border-border
              px-4 py-2 text-center
              text-xs text-muted-foreground
            ">
            Menampilkan 10 notifikasi terbaru
          </div>
        </div>
      )}
    </div>
  );
}
