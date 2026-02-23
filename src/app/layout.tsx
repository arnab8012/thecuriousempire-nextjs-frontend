import "./globals.css";
import Providers from "./providers";
import LayoutShell from "@/components/LayoutShell";
import { Suspense } from "react";

export const metadata = {
  title: "The Curious Empire",
  description: "Premium Shopping Experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Suspense fallback={null}>
            <LayoutShell>{children}</LayoutShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}