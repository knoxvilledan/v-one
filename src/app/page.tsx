"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTodayStorageDate } from "../lib/date-utils";
import { MAINTENANCE_MODE } from "../lib/maintenance";
import MaintenancePage from "../components/MaintenancePage";
import AuthButton from "../components/AuthButton";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ORIGINAL APP CODE - HOOKS MUST BE CALLED FIRST
  useEffect(() => {
    // Only run original logic if not in maintenance mode
    if (MAINTENANCE_MODE) return;

    if (status === "loading") return; // Still loading

    if (!session) {
      // Don't auto-redirect in development so we can test AuthButton
      if (process.env.NODE_ENV === "development") return;
      // Redirect to sign in if not authenticated
      router.push("/auth/signin");
      return;
    }

    // Redirect to today's date
    const today = getTodayStorageDate();
    router.push(`/${today}`);
  }, [session, status, router]);

  // Show maintenance page if maintenance mode is enabled
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  // In development, show auth status for testing
  if (process.env.NODE_ENV === "development") {
    return (
      <main className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">AMP Tracker</h1>
            <p className="text-gray-300">Google OAuth Testing</p>
            <AuthButton />
            {session && (
              <div className="mt-8">
                <button
                  onClick={() => {
                    const today = getTodayStorageDate();
                    router.push(`/${today}`);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Continue to Today&apos;s Tracker
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Show loading state while redirecting
  return (
    <main className="max-w-7xl mx-auto px-4">
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    </main>
  );
}
