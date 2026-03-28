"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, LogOut } from "lucide-react";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) setFullName(profile.full_name);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .upsert({ id: user.id, full_name: fullName, email })
      .eq("id", user.id);

    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Profile</h1>

        <div className="flex items-center gap-4">
          <Avatar fallback={fullName || "U"} className="h-16 w-16 text-lg" />
          <div>
            <p className="font-semibold">{fullName || "Your Name"}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Full name</label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" value={email} disabled />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saved ? "Saved!" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Language</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 18,
                  backgroundColor: "#2C5F4A",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                English
              </span>
              <span style={{ fontSize: 14, color: "#6B6B6B", opacity: 0.4, cursor: "default" }}>
                Español (coming soon)
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 8 }}>
              More languages coming soon. Spanish (Latin American) is next.
            </p>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full text-destructive" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </PageContainer>
  );
}
