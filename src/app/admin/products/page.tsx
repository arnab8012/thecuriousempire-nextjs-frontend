import AdminRoute from "@/components/AdminRoute";
import AdminProducts from "@/screens/admin/AdminProducts";

export default function Page() {
  return (
    <AdminRoute>
      <AdminProducts />
    </AdminRoute>
  );
}
