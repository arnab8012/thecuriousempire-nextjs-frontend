import ProtectedRoute from "@/components/ProtectedRoute";
import Checkout from "@/screens/Checkout";

export default function Page() {
  return (
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  );
}