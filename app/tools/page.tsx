import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Pill, FileDown, Users } from "lucide-react";
import Link from "next/link";

const tools = [
  {
    href: "/tools/trials",
    icon: Search,
    label: "Clinical Trials",
    description: "Find relevant trials based on your condition",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    href: "/tools/medications",
    icon: Pill,
    label: "Medications",
    description: "Track and manage current medications",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    href: "#",
    icon: FileDown,
    label: "Export Data",
    description: "Export health records as PDF",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    href: "#",
    icon: Users,
    label: "Care Team",
    description: "Manage your care relationships",
    color: "text-purple-500 bg-purple-500/10",
  },
];

export default function ToolsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Tools</h1>
        <div className="space-y-2">
          {tools.map((tool) => (
            <Link key={tool.label} href={tool.href}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tool.color}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{tool.label}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
