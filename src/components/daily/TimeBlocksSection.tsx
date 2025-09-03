// Server Component for time blocks section
import { Block } from "../../types";
import { toggleTimeBlock, addBlockNote } from "../../server/actions/daily";

interface TimeBlocksSectionProps {
  blocks: Block[];
  date: string;
}

export default function TimeBlocksSection({
  blocks,
  date,
}: TimeBlocksSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">
        Time Blocks ({blocks.length})
      </h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {blocks.map((block, i) => (
          <div
            key={block.id || `block-${i}`}
            className={`p-4 rounded-lg border ${
              block.complete
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{block.time}</h3>
              <form
                action={async () => {
                  "use server";
                  await toggleTimeBlock(date, block.id);
                }}
              >
                <button type="submit">
                  <input
                    type="checkbox"
                    checked={block.complete}
                    readOnly
                    className="h-4 w-4 text-blue-600 rounded pointer-events-none"
                  />
                </button>
              </form>
            </div>
            <p className="text-sm font-medium mb-2">{block.label}</p>
            {block.notes && block.notes.length > 0 && (
              <div className="space-y-1 mb-2">
                {block.notes.map((note, noteIndex) => (
                  <div
                    key={noteIndex}
                    className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    {note}
                  </div>
                ))}
              </div>
            )}
            {/* Add note form */}
            <form
              action={async (formData: FormData) => {
                "use server";
                const note = formData.get("note") as string;
                if (note?.trim()) {
                  await addBlockNote(date, block.id, note.trim());
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="note"
                placeholder="Add note..."
                className="flex-1 text-xs border rounded px-2 py-1"
              />
              <button
                type="submit"
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
