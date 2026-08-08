import type { Metadata } from "next";
import AdminDashboard from "./AdminDashboard";
import AdminMfaPanel from "./AdminMfaPanel";
import AdminOfficialSourceDrafts from "./AdminOfficialSourceDrafts";
import AdminMapPoints from "./AdminMapPoints";
import AdminUrgentAlerts from "./AdminUrgentAlerts";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <AdminDashboard />
      <AdminMfaPanel />
      <AdminOfficialSourceDrafts />
      <AdminMapPoints />
      <AdminUrgentAlerts />
    </>
  );
}
