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
  const handleResetDay = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all data for this day? This action cannot be undone."
      )
    ) {
      onResetDay();
    }
  };

  return (
    <footer className="mt-8 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
        <button
          onClick={handleResetDay}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          Reset Day
        </button>
        <button
          onClick={onSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
        <ExportButton onExport={onExport} />
      </div>
    </footer>
  );
}
