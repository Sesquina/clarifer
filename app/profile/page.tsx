"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, LogOut, Trash2, Download } from "lucide-react";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download all your data or permanently delete your account and all associated data.
              This action cannot be undone.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.location.href = "/api/delete-account";
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download my data
            </Button>
            {!deleteConfirm ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete my account
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive text-center">
                  Are you sure? All your data will be permanently deleted.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      const res = await fetch("/api/delete-account", { method: "DELETE" });
                      if (res.ok) {
                        await supabase.auth.signOut();
                        router.push("/login");
                        router.refresh();
                      } else {
                        setDeleting(false);
                        setDeleteConfirm(false);
                      }
                    }}
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {deleting ? "Deleting..." : "Yes, delete everything"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
