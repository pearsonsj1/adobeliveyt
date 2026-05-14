import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoginForm from "@/components/adobe-live/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign-in — Adobe Live",
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center text-sm text-white/40">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
