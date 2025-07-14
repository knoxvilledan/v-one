import ExportButton from "./ExportButton";

interface FooterProps {
  onExport: () => void;
}

export default function Footer({ onExport }: FooterProps) {
  return (
    <footer className="mt-8 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 flex justify-end">
        <ExportButton onExport={onExport} />
      </div>
    </footer>
  );
}
