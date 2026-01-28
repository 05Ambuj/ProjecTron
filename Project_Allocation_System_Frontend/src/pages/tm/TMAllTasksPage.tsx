import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTMAllTasks } from "../../api/tm";
import { CheckSquare, Search } from "lucide-react";
import type { TaskDTO } from "../../types/adminTypes";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import api from "../../api/client";

const STATUS_LABELS: Record<number, string> = {
  1: "To Do",
  2: "In Progress",
  3: "In Review",
  4: "Done",
};

const STATUS_COLORS: Record<number, string> = {
  1: "bg-neutral-100 text-neutral-700 border-neutral-200",
  2: "bg-blue-100 text-blue-700 border-blue-200",
  3: "bg-purple-100 text-purple-700 border-purple-200",
  4: "bg-green-100 text-green-700 border-green-200",
};

export default function TMAllTasksPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get("/projects", {
          params: { pageNumber: 1, pageSize: 100 },
        });
        if (res.data.success && res.data.data) {
          const data = Array.isArray(res.data.data) ? res.data.data : res.data.data.items || [];
          setProjects(data);
        }
      } catch (err) {
        // Ignore
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const data = await fetchTMAllTasks({
          projectId: selectedProjectId || undefined,
          pageNumber: 1,
          pageSize: 100,
        });
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load tasks");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [selectedProjectId, showError]);

  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.taskCode.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <LoadingPage message="Loading tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">All Tasks</h1>
        <p className="mt-2 text-sm text-neutral-600">
          View all tasks in your projects
        </p>
      </header>

      {/* Search and Filter */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Filter by Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {searchTerm || selectedProjectId ? "No tasks match your filters" : "No tasks found"}
          </p>
          <p className="text-sm text-neutral-500">
            {searchTerm || selectedProjectId
              ? "Try adjusting your search or filters"
              : "There are no tasks available"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm divide-y divide-neutral-100">
          {filteredTasks.map((task) => (
            <button
              key={task.taskId}
              onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
              className="w-full text-left p-6 hover:bg-neutral-50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                      {task.title}
                    </h3>
                    <span className="text-xs text-neutral-500 font-mono">
                      {task.taskCode}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 line-clamp-2 mb-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-600">
                    <span>{task.projectName}</span>
                  </div>
                </div>

                <span
                  className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    STATUS_COLORS[task.status] || "bg-neutral-100 text-neutral-700 border-neutral-200"
                  }`}
                >
                  {STATUS_LABELS[task.status] || `Status ${task.status}`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <span>Assigned to: {task.assignedToUserName || "Unassigned"}</span>
                  {task.dueDate && (
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                      {task.isOverdue && (
                        <span className="ml-1 text-red-600">(Overdue)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
