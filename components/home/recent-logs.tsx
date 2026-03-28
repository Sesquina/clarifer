import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate, severityColor } from "@/lib/utils";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";

interface RecentLogsProps {
  logs: Tables<"symptom_logs">[];
}

export function RecentLogs({ logs }: RecentLogsProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No symptom logs yet.</p>
          <Link href="/log" className="text-sm font-medium text-primary hover:underline">
            Log your first symptoms
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">Recent Logs</h2>
      {logs.map((log) => (
        <Card key={log.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {formatRelativeDate(log.created_at)}
              </CardTitle>
              {log.overall_severity !== null && (
                <Badge variant={log.overall_severity > 6 ? "destructive" : log.overall_severity > 3 ? "warning" : "success"}>
                  <span className={severityColor(log.overall_severity)}>
                    Severity: {log.overall_severity}/10
                  </span>
                </Badge>
              )}
            </div>
          </CardHeader>
          {log.ai_summary && (
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{log.ai_summary}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
