"use client";

import Link from "next/link";
import { Activity, MessageCircle, FileText, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  { href: "/log", icon: Activity, label: "Log Symptoms", color: "text-purple-500 bg-purple-500/10" },
  { href: "/chat", icon: MessageCircle, label: "Ask Medalyn", color: "text-blue-500 bg-blue-500/10" },
  { href: "/documents/upload", icon: FileText, label: "Upload Doc", color: "text-emerald-500 bg-emerald-500/10" },
  { href: "/tools/trials", icon: Search, label: "Find Trials", color: "text-amber-500 bg-amber-500/10" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 p-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
