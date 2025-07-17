type Props = {
  onExport: () => void;
};

export default function ExportButton({ onExport }: Props) {
  return (
    <button
      onClick={onExport}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
    >
      Export
    </button>
  );
}
