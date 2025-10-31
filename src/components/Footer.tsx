import ExportButton from "./ExportButton";

interface FooterProps {
  onExport: () => void;
  onSignOut: () => void;
  onResetDay: () => void;
}

export default function Footer({
  onExport,
  onSignOut,
  onResetDay,
}: FooterProps) {
  return (
    <footer className="mt-8 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:justify-end items-center gap-4">
        {/* Reset Day Warning and Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <p className="text-sm font-bold text-orange-600 dark:text-orange-400 text-center sm:text-right">
            Only use on future dates you need Reset.
            <br />
            Don&apos;t use on &apos;Today&apos;
          </p>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to reset all data for this day? This action cannot be undone."
                )
              ) {
                onResetDay();
              }
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Reset Day
          </button>
        </div>

        {/* Other buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
          <ExportButton onExport={onExport} />
        </div>
      </div>
    </footer>
  );
}
