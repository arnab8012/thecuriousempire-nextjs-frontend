import PrivateRoute from "@/components/PrivateRoute";
import Checkout from "@/screens/Checkout";

export default function Page() {
  return (
    <PrivateRoute>
      <Checkout />
    </PrivateRoute>
  );
}
