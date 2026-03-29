"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteDocumentButton({
  documentId,
  redirectTo,
  variant = "full",
}: {
  documentId: string;
  redirectTo?: string;
  variant?: "full" | "icon";
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (res.ok) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (variant === "icon") {
    if (confirming) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={(e) => e.preventDefault()}
        >
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#FFFFFF",
              backgroundColor: "#DC2626",
              border: "none",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "..." : "Delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{
              fontSize: 11,
              color: "#6B6B6B",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
            }}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
        title="Delete document"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          color: "#9A9A9A",
        }}
      >
        <Trash2 size={15} />
      </button>
    );
  }

  // Full button variant (for detail page)
  if (confirming) {
    return (
      <div
        style={{
          backgroundColor: "#FEF2F2",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p style={{ fontSize: 14, color: "#991B1B", lineHeight: 1.5 }}>
          This will permanently delete this document and its analysis. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setConfirming(false)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              border: "1.5px solid #E8E2D9",
              backgroundColor: "#FFFFFF",
              color: "#1A1A1A",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 10,
              border: "none",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              opacity: deleting ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {deleting ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 20px",
        borderRadius: 12,
        border: "1.5px solid #FECACA",
        fontSize: 14,
        fontWeight: 500,
        color: "#DC2626",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <Trash2 size={16} />
      Delete document
    </button>
  );
}
