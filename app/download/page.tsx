import Link from "next/link";
import { AnchorLogo } from "@/components/ui/AnchorLogo";
import { Header } from "@/components/layout/header";

export const metadata = {
  title: "Download Clarifer",
  description: "Care coordination in your pocket. Free for caregivers.",
};

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

export default function DownloadPage() {
  return (
    <div style={{ backgroundColor: "var(--background)", minHeight: "100vh", ...BODY }}>
      <Header />
      <main
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px" }}
      >
        <div style={{ marginBottom: 24 }}>
          <AnchorLogo size={64} />
        </div>
        <h1
          style={{
            ...HEADING,
            fontSize: 40,
            color: "var(--primary)",
            marginBottom: 12,
            fontWeight: 700,
          }}
        >
          Download Clarifer
        </h1>
        <p
          style={{
            ...BODY,
            fontSize: 18,
            color: "var(--muted)",
            marginBottom: 48,
            lineHeight: 1.6,
          }}
        >
          Care coordination in your pocket. Free for caregivers.
        </p>

        <div className="flex flex-col items-center" style={{ gap: 16, width: "100%" }}>
          <a
            href="/download#ios"
            aria-label="Download on the App Store"
            className="inline-flex items-center"
            style={{
              height: 56,
              minWidth: 220,
              borderRadius: 12,
              backgroundColor: "var(--text)",
              color: "var(--white)",
              gap: 12,
              padding: "0 24px",
              textDecoration: "none",
            }}
          >
            <AppleMark />
            <span className="flex flex-col items-start leading-tight">
              <span style={{ ...BODY, fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
                Download on the
              </span>
              <span style={{ ...BODY, fontSize: 18, fontWeight: 600 }}>
                App Store
              </span>
            </span>
          </a>
          <a
            href="/download#android"
            aria-label="Get it on Google Play"
            className="inline-flex items-center"
            style={{
              height: 56,
              minWidth: 220,
              borderRadius: 12,
              backgroundColor: "var(--text)",
              color: "var(--white)",
              gap: 12,
              padding: "0 24px",
              textDecoration: "none",
            }}
          >
            <PlayMark />
            <span className="flex flex-col items-start leading-tight">
              <span style={{ ...BODY, fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
                Get it on
              </span>
              <span style={{ ...BODY, fontSize: 18, fontWeight: 600 }}>
                Google Play
              </span>
            </span>
          </a>
        </div>

        <p
          style={{
            ...BODY,
            fontSize: 14,
            color: "var(--muted)",
            marginTop: 32,
          }}
        >
          Also available on web.{" "}
          <Link
            href="/login"
            style={{ color: "var(--primary)", fontWeight: 500 }}
          >
            Sign in to the platform
          </Link>
        </p>

        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: 200,
            height: 200,
            border: "1.5px dashed var(--border)",
            borderRadius: 16,
            backgroundColor: "var(--card)",
            margin: "48px auto 0",
            padding: 16,
          }}
          aria-hidden="true"
        >
          <p
            className="text-center"
            style={{
              ...BODY,
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            QR code available when app is live on App Store
          </p>
        </div>
      </main>
    </div>
  );
}

function AppleMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 814 1000"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <path
        fill="#fff"
        d="M325.3 234.3L104.9 104l280.1 151.6-59.7-21.3zM104.9 104v304L325.3 277.7 104.9 104zm280.1 151.6l-59.7-21.3-221.4 173.7L325.3 277.7l59.7-22.1zm59.7 12.4c8.8-6.8 8.8-20.4 0-27.2L375.6 273l28.1 28.1 77-28.1v-5z"
      />
    </svg>
  );
}
