import type { Metadata } from "next";
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

export default function AdminPage() {
  if (mmipsSiteMode() === "ca") {
    return (
      <>
        <CanadaAdminDashboard />
        <AdminMfaPanel />
      </>
    );
  }

  return (
    <>
      <AdminDashboard />
      <AdminMfaPanel />
      <AdminOfficialSourceDrafts />
      <AdminMapPoints />
      <AdminUrgentAlerts />
      <AdminSyntheticScale />
    </>
  );
}
