import AdminDashboard from "./AdminDashboard";
import AdminMapPoints from "./AdminMapPoints";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <AdminDashboard />
      <AdminMapPoints />
    </>
  );
}
