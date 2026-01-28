import { useEffect, useState } from "react";
import { fetchAdminTasks } from "../../api/admin";
import type { TaskDTO } from "../../types/adminTypes";

const PAGE_SIZE = 20;

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchAdminTasks({
          status: status === "" ? undefined : status,
          searchTerm: searchTerm || undefined,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
        });

        if (isMounted) {
          setTasks(response.items);
        }
      } catch (err) {
        if (isMounted && err instanceof Error) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [status, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">Tasks</h1>
        <p className="mt-1 text-sm text-neutral-600">
          View and manage all tasks across projects.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by title or code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm w-64"
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value ? Number(e.target.value) : "")
          }
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="1">Not Started</option>
          <option value="2">In Progress</option>
          <option value="5">Approved</option>
          <option value="6">Done</option>
          <option value="8">Cancelled</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-300 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-300">
            <tr className="text-left text-neutral-700 font-medium">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Due Date</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Loading tasks…
                </td>
              </tr>
            )}

            {!loading && tasks.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  No tasks found.
                </td>
              </tr>
            )}

            {tasks.map((task) => (
              <tr
                key={task.taskId}
                className="border-t border-neutral-200 hover:bg-neutral-50"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  {task.taskCode}
                </td>
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">{task.projectName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 1 ? 'bg-blue-100 text-blue-700' :
                    task.status === 2 ? 'bg-amber-100 text-amber-700' :
                    task.status === 6 ? 'bg-green-100 text-green-700' :
                    task.status === 8 ? 'bg-gray-100 text-gray-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {task.statusDisplay || `Status ${task.status}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 1 ? 'bg-green-100 text-green-700' :
                    task.priority === 2 ? 'bg-blue-100 text-blue-700' :
                    task.priority === 3 ? 'bg-amber-100 text-amber-700' :
                    task.priority === 4 ? 'bg-red-100 text-red-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {task.priorityDisplay || `Priority ${task.priority}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {task.assignedToUserName || "—"}
                </td>
                <td className="px-4 py-3">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
