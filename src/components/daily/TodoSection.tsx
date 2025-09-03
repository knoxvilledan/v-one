// Server Component for todo list section
import { ChecklistItem } from "../../types";
import { toggleChecklistItem, addTodoItem } from "../../server/actions/daily";

interface TodoSectionProps {
  todoList: ChecklistItem[];
  date: string;
}

export default function TodoSection({ todoList, date }: TodoSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Todo List</h2>

      {/* Add new todo form */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const text = formData.get("todoText") as string;
          if (text?.trim()) {
            await addTodoItem(date, text.trim());
          }
        }}
        className="mb-4 flex gap-2"
      >
        <input
          type="text"
          name="todoText"
          placeholder="Add new todo..."
          className="flex-1 border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Todo
        </button>
      </form>

      {/* Todo list items */}
      <div className="space-y-2">
        {todoList.map((item) => (
          <form
            key={item.id}
            action={async () => {
              "use server";
              await toggleChecklistItem(date, item.id, "todoList");
            }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              item.completed
                ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}
          >
            <button
              type="submit"
              className="flex items-center gap-2 flex-1 text-left"
            >
              <input
                type="checkbox"
                checked={item.completed}
                readOnly
                className="h-4 w-4 text-purple-600 rounded pointer-events-none"
              />
              <span
                className={
                  item.completed
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-gray-100"
                }
              >
                {item.text}
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
