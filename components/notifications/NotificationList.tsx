/**
 * components/notifications/NotificationList.tsx
 * Client list that renders symptom alerts, medication reminders, and
 * care team updates with per-item mark-read.
 * Tables: none directly. Calls PATCH /api/notifications/[id]/read.
 * Auth: assumes the wrapping route is auth-gated.
 * HIPAA: titles/messages already filtered server-side. No condition
 *        names are emitted here.
 */
"use client";

import { useState, useTransition } from "react";
import { Bell, Activity, Pill, Users, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatRelativeDate } from "@/lib/utils";

export type NotificationRow = {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  action_url: string | null;
  read: boolean | null;
  created_at: string | null;
};

interface Props {
  initial: NotificationRow[];
}

const TYPE_LABEL: Record<string, string> = {
  symptom_alert: "Symptom alert",
  medication_reminder: "Medication reminder",
  care_team_update: "Care team",
};

function iconFor(type: string | null) {
  if (type === "symptom_alert") return Activity;
  if (type === "medication_reminder") return Pill;
  if (type === "care_team_update") return Users;
  return Bell;
}

function NotificationCard({
  row,
  onMarkRead,
  busy,
}: {
  row: NotificationRow;
  onMarkRead: (id: string) => void;
  busy: boolean;
}) {
  const Icon = iconFor(row.type);
  return (
    <Card className={row.read ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{row.title ?? TYPE_LABEL[row.type ?? ""] ?? "Update"}</p>
              {!row.read && (
                <span
                  aria-label="unread"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                />
              )}
            </div>
            {row.message && (
              <p className="mt-0.5 text-sm text-muted-foreground">{row.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeDate(row.created_at)}
            </p>
          </div>
          {!row.read && (
            <button
              type="button"
              onClick={() => onMarkRead(row.id)}
              disabled={busy}
              aria-label="Mark as read"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-3 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
              style={{ minHeight: 48, minWidth: 48 }}
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Bell className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function NotificationList({ initial }: Props) {
  const [rows, setRows] = useState<NotificationRow[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function markRead(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        startTransition(() => {
          setRows((rs) => rs.map((r) => (r.id === id ? { ...r, read: true } : r)));
        });
      }
    } finally {
      setPendingId(null);
    }
  }

  const buckets = {
    symptom_alert: rows.filter((r) => r.type === "symptom_alert"),
    medication_reminder: rows.filter((r) => r.type === "medication_reminder"),
    care_team_update: rows.filter((r) => r.type === "care_team_update"),
    all: rows,
  };

  return (
    <Tabs defaultValue="all" className="space-y-3">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="symptom_alert">Symptoms</TabsTrigger>
        <TabsTrigger value="medication_reminder">Medications</TabsTrigger>
        <TabsTrigger value="care_team_update">Care team</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div className="space-y-2">
          {buckets.all.length === 0 ? (
            <EmptyState label="No notifications yet. Updates from the care team and symptom check-ins will appear here." />
          ) : (
            buckets.all.map((r) => (
              <NotificationCard key={r.id} row={r} onMarkRead={markRead} busy={pendingId === r.id} />
            ))
          )}
        </div>
      </TabsContent>

      {(["symptom_alert", "medication_reminder", "care_team_update"] as const).map((key) => (
        <TabsContent key={key} value={key}>
          <div className="space-y-2">
            {buckets[key].length === 0 ? (
              <EmptyState label="Nothing here right now." />
            ) : (
              buckets[key].map((r) => (
                <NotificationCard key={r.id} row={r} onMarkRead={markRead} busy={pendingId === r.id} />
              ))
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
