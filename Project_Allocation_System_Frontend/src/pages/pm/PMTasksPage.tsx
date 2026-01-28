import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { fetchPMTasks, deletePMTask } from "../../api/pm";
import { CheckSquare, Filter, X, ChevronDown, Plus, Trash2, Eye } from "lucide-react";
import type { TaskDTO } from "../../types/adminTypes";
import { useToast } from "../../contexts/useToast";
import { UserRole } from "../../constants/roles";
import TaskDrawer from "../../components/task/TaskDrawer";

const STATUS_LABELS: Record<number, string> = {
  1: "Not Started",
  2: "In Progress",
  5: "Approved",
  6: "Done",
  8: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  1: "bg-neutral-100 text-neutral-700",
  2: "bg-blue-100 text-blue-700",
  5: "bg-emerald-100 text-emerald-700",
  6: "bg-green-100 text-green-700",
  8: "bg-gray-100 text-gray-700",
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

export default function PMTasksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showError, showSuccess } = useToast();
  const { projects } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({
    status: undefined as number | undefined,
    priority: undefined as number | undefined,
    searchTerm: "",
  });

  // Load projects
  useEffect(() => {
    if (user) {
      dispatch(fetchPMProjects({ page: 1, pageSize: 100, actorRole: user.role as UserRole }));
    }
  }, [dispatch, user]);

  // Load tasks function
  const loadTasks = async () => {
    if (!selectedProjectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPMTasks({
        projectId: selectedProjectId,
        status: filters.status,
        priority: filters.priority,
        pageNumber: 1,
        pageSize: 100,
      });
      setTasks(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks
  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, filters.status, filters.priority]);

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      setIsDeleting(true);
      await deletePMTask(deleteTaskId);
      showSuccess("Task deleted successfully");
      setDeleteTaskId(null);
      loadTasks();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      priority: undefined,
      searchTerm: "",
    });
  };

  const hasActiveFilters =
    filters.status !== undefined ||
    filters.priority !== undefined ||
    filters.searchTerm !== "";

  // Filter tasks by search term on client side
  const filteredTasks = tasks.filter((task) => {
    if (!filters.searchTerm) return true;
    const searchLower = filters.searchTerm.toLowerCase();
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
            View and manage all tasks across your projects
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
            }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs">
                {[filters.status, filters.priority, filters.searchTerm].filter((v) => v !== undefined && v !== "").length}
              </span>
            )}
          </button>
          <Link
            to="/pm/tasks/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Create Task</span>
          </Link>
        </div>
      </header>

      {/* Project Selector */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Select Project
        </label>
        <div className="relative w-full md:w-1/3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full appearance-none px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
          >
            <option value="">Choose a project...</option>
            {projects.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                value={filters.status ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="1">Not Started</option>
                <option value="2">In Progress</option>
                <option value="5">Approved</option>
                <option value="6">Done</option>
                <option value="8">Cancelled</option>
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
                    priority: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priorities</option>
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
                <option value="4">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                placeholder="Search tasks..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
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
      {loading && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <p className="text-sm text-neutral-600">Loading tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !selectedProjectId && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            Select a project
          </p>
          <p className="text-sm text-neutral-500">
            Choose a project from the dropdown to view its tasks
          </p>
        </div>
      )}

      {!loading && selectedProjectId && filteredTasks.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {hasActiveFilters ? "No tasks match your filters" : "No tasks found"}
          </p>
          <p className="text-sm text-neutral-500">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "This project has no tasks"}
          </p>
        </div>
      )}

      {/* Tasks List */}
      {!loading && selectedProjectId && filteredTasks.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm divide-y divide-neutral-100">
          {filteredTasks.map((task) => (
            <button
              key={task.taskId}
              onClick={() => setSelectedTaskId(task.taskId)}
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
                  <span>Story Points: {task.storyPoints}</span>
                  {task.dueDate && (
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                      {task.isOverdue && (
                        <span className="ml-1 text-red-600">(Overdue)</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTaskId(task.taskId);
                    }}
                    className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View task"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTaskId(task.taskId);
                    }}
                    className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Task Drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={loadTasks}
        onDeleted={() => {
          setSelectedTaskId(null);
          loadTasks();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 m-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Delete Task?
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTaskId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
