import type { Metadata } from "next";
import AdminPasswordRecovery from "@/components/AdminPasswordRecovery";
import { mmipsSiteMode } from "@/lib/site-mode";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";

export default function AdminResetPasswordPage() {
  const mode = mmipsSiteMode();
  const siteLabel = mode === "ca" ? "MMIPS Canada" : "MMIPS United States";
  return <AdminPasswordRecovery siteLabel={siteLabel} />;
}
