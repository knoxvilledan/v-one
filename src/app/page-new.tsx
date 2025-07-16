"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTodayStorageDate } from "../lib/date-utils";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // Redirect to sign in if not authenticated
      router.push("/auth/signin");
      return;
    }

    // Redirect to today's date
    const today = getTodayStorageDate();
    router.push(`/${today}`);
  }, [session, status, router]);

  // Show loading state while redirecting
  return (
    <main className="max-w-7xl mx-auto px-4">
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    </main>
  );
}
