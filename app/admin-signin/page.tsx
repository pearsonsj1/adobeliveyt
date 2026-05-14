import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoginForm from "@/components/adobe-live/AdminLoginForm";

export const metadata: Metadata = {
  title: "Analytics sign-in",
  description: "Authorized access to Adobe Live site analytics.",
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center text-sm text-white/35">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
