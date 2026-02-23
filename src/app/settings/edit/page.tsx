import PrivateRoute from "@/components/PrivateRoute";
import SettingsEdit from "@/screens/SettingsEdit";

export default function Page() {
  return (
    <PrivateRoute>
      <SettingsEdit />
    </PrivateRoute>
  );
}
