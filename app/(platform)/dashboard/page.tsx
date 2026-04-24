"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PlatformDashboard() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        router.replace("/patients");
      } else {
        router.replace("/login");
      }
    });
    return () => {
      active = false;
    };
  }, [supabase, router]);

  return null;
}
