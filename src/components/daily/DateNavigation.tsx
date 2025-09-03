// Server Component for date navigation and wake time
import { updateWakeTimeAction } from "../../server/actions/daily";

interface DateNavigationProps {
  date: string;
  wakeTime: string;
}

export default function DateNavigation({
  date,
  wakeTime,
}: DateNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4">
      <div className="text-lg font-medium">Date: {date}</div>

      {/* Wake time form with server action */}
      <form action={updateWakeTimeAction} className="flex items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">
          Wake Time:
        </label>
        <input type="hidden" name="date" value={date} />
        <input
          type="time"
          name="wakeTime"
          defaultValue={wakeTime}
          className="border rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </form>
    </div>
  );
}
