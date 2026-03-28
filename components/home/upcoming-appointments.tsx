import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

interface UpcomingAppointmentsProps {
  appointments: Tables<"appointments">[];
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">Upcoming Appointments</h2>
      {appointments.map((appt) => (
        <Card key={appt.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{appt.title || "Appointment"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {appt.provider_name && (
              <p className="text-sm text-muted-foreground">{appt.provider_name} — {appt.provider_specialty}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {appt.datetime && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(appt.datetime).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {appt.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {appt.location}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
