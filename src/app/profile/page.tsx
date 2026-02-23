import PrivateRoute from "@/components/PrivateRoute";
import Profile from "@/screens/Profile";

export default function Page() {
  return (
    <PrivateRoute>
      <Profile />
    </PrivateRoute>
  );
}
