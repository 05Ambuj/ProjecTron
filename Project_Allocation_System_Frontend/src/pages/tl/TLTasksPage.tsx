import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTLAllTasks, fetchTLProjects } from "../../api/tl";
import { CheckSquare, Filter, X, Plus, Search } from "lucide-react";
import type { TaskDTO, ProjectDto } from "../../types/adminTypes";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";

const STATUS_LABELS: Record<number, string> = {
  1: "Not Started",
  2: "In Progress",
  5: "Approved",
  6: "Done",
  8: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  1: "bg-neutral-100 text-neutral-700 border-neutral-200",
  2: "bg-blue-100 text-blue-700 border-blue-200",
  5: "bg-emerald-100 text-emerald-700 border-emerald-200",
  6: "bg-green-100 text-green-700 border-green-200",
  8: "bg-gray-100 text-gray-700 border-gray-200",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-neutral-600",
  2: "text-blue-600",
  3: "text-amber-600",
  4: "text-red-600",
};

export default function TLTasksPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    status: undefined as number | undefined,
    priority: undefined as number | undefined,
  });

  // Load projects (TL can access projects they're assigned to)
  useEffect(() => {
    async function loadProjects() {
      try {
        const summaries = await fetchTLProjects();
        // Map to ProjectDto-compatible objects for UI fields we use
        const mapped: ProjectDto[] = summaries.map((p) => ({
          projectId: p.projectId,
          name: p.name,
          code: p.code ?? p.name,
          description: "",
          organizationId: "",
          projectManagerId: "",
          status: 0,
          priority: 0,
          startDate: "",
          endDate: "",
          progressPercentage: 0,
          budget: 0,
          maxAllocations: 0,
        }));
        setProjects(mapped);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load projects");
        setProjects([]);
      }
    }
    loadProjects();
  }, [showError]);

  // Load tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const items = await fetchTLAllTasks({
          projectId: selectedProjectId || undefined,
          status: filters.status,
          priority: filters.priority,
          pageNumber: 1,
          pageSize: 100,
        });
        setTasks(items);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load tasks");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [selectedProjectId, filters.status, filters.priority, showError]);

  const clearFilters = () => {
    setFilters({
      status: undefined,
      priority: undefined,
    });
    setSearchTerm("");
  };

  const hasActiveFilters =
    filters.status !== undefined ||
    filters.priority !== undefined ||
    searchTerm !== "";

  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.taskCode.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">All Tasks</h1>
          <p className="mt-2 text-sm text-neutral-600">
            View and manage all tasks
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate("/tl/tasks/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex-1 sm:flex-initial"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Create Task</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors flex-1 sm:flex-initial ${
              showFilters || hasActiveFilters
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
            }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs">
                {[filters.status, filters.priority, searchTerm].filter((v) => v !== undefined && v !== "").length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Filter by Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                value={filters.status ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Priority
              </label>
              <select
                value={filters.priority ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priorities</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                <X size={16} />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingPage message="Loading tasks..." />}

      {/* Empty State */}
      {!loading && filteredTasks.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {hasActiveFilters ? "No tasks match your filters" : "No tasks found"}
          </p>
          <p className="text-sm text-neutral-500">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Get started by creating a new task"}
          </p>
        </div>
      )}

      {/* Tasks List */}
      {!loading && filteredTasks.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm divide-y divide-neutral-100">
          {filteredTasks.map((task) => (
            <button
              key={task.taskId}
              onClick={() => navigate(`/tl/tasks/${task.taskId}`)}
              className="w-full text-left p-4 sm:p-6 hover:bg-neutral-50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                  <div className="flex items-center gap-3 text-xs text-neutral-600 flex-wrap">
                    <span>{task.projectName}</span>
                    {task.sprintName && (
                      <>
                        <span>•</span>
                        <span>{task.sprintName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      STATUS_COLORS[task.status] || "bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {STATUS_LABELS[task.status] || `Status ${task.status}`}
                  </span>
                  <span
                    className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || "text-neutral-600"}`}
                  >
                    {PRIORITY_LABELS[task.priority] || `Priority ${task.priority}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
                  <span>
                    Assigned to: {task.assignedToUserName || "Unassigned"}
                  </span>
                  {task.storyPoints > 0 && <span>Story Points: {task.storyPoints}</span>}
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
