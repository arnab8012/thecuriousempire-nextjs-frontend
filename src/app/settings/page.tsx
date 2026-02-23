import PrivateRoute from "@/components/PrivateRoute";
import Settings from "@/screens/Settings";

export default function Page() {
  return (
    <PrivateRoute>
      <Settings />
    </PrivateRoute>
  );
}
