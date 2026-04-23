"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

interface HeaderProps {
  userName?: string | null;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" className="flex items-center gap-3 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">M</span>
          </div>
          <p className="text-sm font-semibold">Clarifer</p>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link href="/profile">
            <Avatar fallback={userName || "U"} className="h-8 w-8 text-xs" />
          </Link>
        </div>
      </div>
    </header>
  );
}
