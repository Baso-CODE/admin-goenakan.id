"use client";

import { useEffect, useRef } from "react";

export interface WaEventData {
  type: "message" | "message.ack" | "session.status" | "contact.updated" | "connected";
  session: string;
  data: any;
  timestamp: number;
}

export function useWaEvents(
  sessionId?: string,
  callbacks?: {
    onMessage?: (payload: any) => void;
    onMessageAck?: (payload: any) => void;
    onSessionStatus?: (payload: any) => void;
    onContactUpdated?: (payload: any) => void;
  }
) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    // Only connect if EventSource is supported in browser
    if (typeof window === "undefined" || !("EventSource" in window)) return;

    const url = sessionId
      ? `/api/wa/events?sessionId=${encodeURIComponent(sessionId)}`
      : `/api/wa/events`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener("message", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        callbacksRef.current?.onMessage?.(parsed.data || parsed);
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener("message.ack", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        callbacksRef.current?.onMessageAck?.(parsed.data || parsed);
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener("session.status", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        callbacksRef.current?.onSessionStatus?.(parsed.data || parsed);
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener("contact.updated", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        callbacksRef.current?.onContactUpdated?.(parsed.data || parsed);
      } catch {
        // ignore
      }
    });

    return () => {
      eventSource.close();
    };
  }, [sessionId]);
}
