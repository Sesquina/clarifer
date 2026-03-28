"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Trial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  location: string;
  distance?: string;
  summary: string;
}

export default function TrialsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location }),
      });
      const data = await res.json();
      setTrials(data.trials || []);
    } catch {
      setTrials([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Tools
        </Link>

        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Clinical Trials</h1>

        <form onSubmit={handleSearch} className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search condition or keyword..."
          />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or ZIP code (optional)"
          />
          <Button type="submit" className="w-full" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search trials
          </Button>
        </form>

        {searched && !loading && trials.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No trials found. Try different search terms.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {trials.map((trial) => (
            <Card key={trial.nctId}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-snug">{trial.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{trial.phase}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{trial.summary}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant={trial.status === "Recruiting" ? "success" : "secondary"}>
                    {trial.status}
                  </Badge>
                  {trial.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {trial.location}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">ID: {trial.nctId}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
