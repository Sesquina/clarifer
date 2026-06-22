"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}
