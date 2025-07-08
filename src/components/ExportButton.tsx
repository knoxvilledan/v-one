type Props = {
  onExport: () => void;
};

export default function ExportButton({ onExport }: Props) {
  return (
    <button
      onClick={onExport}
      className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
    >
      Export
    </button>
  );
}
