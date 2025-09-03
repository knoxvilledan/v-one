import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getTodayStorageDate } from "../lib/date-utils";
import { MAINTENANCE_MODE } from "../lib/maintenance";
import MaintenancePage from "../components/MaintenancePage";

export default async function HomePage() {
  // Handle maintenance mode
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  // Get session server-side
  const session = await getServerSession();

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to today's page
  const today = getTodayStorageDate();
  redirect(`/${today}`);
}
