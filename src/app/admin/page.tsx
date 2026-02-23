import AdminRoute from "@/components/AdminRoute";
import AdminDashboard from "@/screens/admin/AdminDashboard";

export default function Page() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
