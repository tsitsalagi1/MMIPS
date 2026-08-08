import AdminDashboard from "./AdminDashboard";
import AdminMfaPanel from "./AdminMfaPanel";
import AdminMapPoints from "./AdminMapPoints";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <AdminDashboard />
      <AdminMfaPanel />
      <AdminMapPoints />
    </>
  );
}
