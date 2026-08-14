import type { Metadata } from "next";
import Link from "next/link";
import AdminDashboard from "./AdminDashboard";
import AdminMfaPanel from "./AdminMfaPanel";
import AdminOfficialSourceDrafts from "./AdminOfficialSourceDrafts";
import AdminMapPoints from "./AdminMapPoints";
import AdminUrgentAlerts from "./AdminUrgentAlerts";
import AdminSyntheticScale from "./AdminSyntheticScale";
import CanadaAdminDashboard from "./CanadaAdminDashboard";
import { mmipsSiteMode } from "@/lib/site-mode";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";

function PasswordRecoveryLink() {
  return (
    <section className="container" style={{ paddingBottom: 24 }}>
      <p className="small-text"><Link href="/admin/reset-password">Forgot your admin password? Reset it securely.</Link></p>
    </section>
  );
}

export default function AdminPage() {
  if (mmipsSiteMode() === "ca") {
    return (
      <>
        <CanadaAdminDashboard />
        <PasswordRecoveryLink />
        <AdminMfaPanel />
        <AdminUrgentAlerts />
      </>
    );
  }

  return (
    <>
      <AdminDashboard />
      <PasswordRecoveryLink />
      <AdminMfaPanel />
      <AdminOfficialSourceDrafts />
      <AdminMapPoints />
      <AdminUrgentAlerts />
      <AdminSyntheticScale />
    </>
  );
}
