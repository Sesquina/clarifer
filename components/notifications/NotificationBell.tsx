/**
 * components/notifications/NotificationBell.tsx
 * Bell icon with unread badge for the mobile-and-web header.
 * Tables: notifications (subscribe via realtime channel)
 * Auth: relies on the wrapping AppHeader being inside an auth-gated layout.
 * HIPAA: never renders message content -- only an unread count and
 *        the bell icon. Realtime subscription is filtered by user_id.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
}

export function NotificationBell({ userId }: Props) {
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/notifications?count=1", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { unread?: number };
        if (!cancelled) setUnread(json.unread ?? 0);
      } catch {
        // network failures should not break the header
      }
    }

    refresh();

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    const interval = setInterval(refresh, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        color: "var(--primary)",
      }}
    >
      <Bell size={22} aria-hidden="true" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            minWidth: 18,
            height: 18,
            padding: "0 4px",
            borderRadius: 9,
            backgroundColor: "var(--accent)",
            color: "var(--card)",
            fontSize: 11,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
