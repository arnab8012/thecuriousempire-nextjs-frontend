import PrivateRoute from "@/components/PrivateRoute";
import Favorites from "@/screens/Favorites";

export default function Page() {
  return (
    <PrivateRoute>
      <Favorites />
    </PrivateRoute>
  );
}
