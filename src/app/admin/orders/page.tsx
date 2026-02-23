import AdminRoute from "@/components/AdminRoute";
import AdminOrders from "@/screens/admin/AdminOrders";

export default function Page() {
  return (
    <AdminRoute>
      <AdminOrders />
    </AdminRoute>
  );
}
