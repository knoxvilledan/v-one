"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTodayStorageDate } from "../lib/date-utils";
import { MAINTENANCE_MODE } from "../lib/maintenance";
import MaintenancePage from "../components/MaintenancePage";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (MAINTENANCE_MODE) return;
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    const today = getTodayStorageDate();
    router.push(`/${today}`);
  }, [session, status, router]);

  if (MAINTENANCE_MODE) return <MaintenancePage />;

  return (
    <main className="max-w-7xl mx-auto px-4">
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    </main>
  );
}
