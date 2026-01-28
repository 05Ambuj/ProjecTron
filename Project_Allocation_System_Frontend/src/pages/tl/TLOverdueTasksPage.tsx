import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTLOverdueTasks, fetchTLProjects } from "../../api/tl";
import { AlertCircle, ChevronDown } from "lucide-react";
import type { ProjectDto, TaskDTO } from "../../types/adminTypes";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";

const PRIORITY_COLORS: Record<number, string> = {
  0: "text-neutral-600",
  1: "text-blue-600",
  2: "text-amber-600",
  3: "text-red-600",
};

const PRIORITY_LABELS: Record<number, string> = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Critical",
};

export default function TLOverdueTasksPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchTLProjects();
        setProjects(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load projects");
      }
    }
    loadProjects();
  }, [showError]);

  useEffect(() => {
    async function loadOverdueTasks() {
      try {
        setLoading(true);
        const data = await fetchTLOverdueTasks(selectedProjectId || undefined);
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load overdue tasks");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadOverdueTasks();
  }, [selectedProjectId, showError]);

  const getDaysOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <LoadingPage message="Loading overdue tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Overdue Tasks</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} past their due date
          </p>
        </div>
      </header>

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Filter by Project
          </label>
          <div className="relative w-full md:w-1/3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full appearance-none px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
            >
              <option value="">All projects</option>
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
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">No overdue tasks</p>
          <p className="text-sm text-neutral-500">Great job! All tasks are on schedule</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm divide-y divide-neutral-100">
          {tasks.map((task) => (
            <button
              key={task.taskId}
              onClick={() => navigate(`/tl/tasks/${task.taskId}`)}
              className="w-full text-left p-6 hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-red-600 transition-colors">
                      {task.title}
                    </h3>
                    <span className="text-xs text-neutral-500 font-mono">
                      {task.taskCode}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 mb-2">{task.description}</p>
                  <div className="flex items-center gap-3 text-xs text-neutral-600">
                    <span>{task.projectName}</span>
                    {task.sprintName && (
                      <>
                        <span>•</span>
                        <span>{task.sprintName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                    {task.dueDate
                      ? `${getDaysOverdue(task.dueDate)} day${getDaysOverdue(task.dueDate) !== 1 ? "s" : ""} overdue`
                      : "Overdue"}
                  </span>
                  <span
                    className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || "text-neutral-600"}`}
                  >
                    {PRIORITY_LABELS[task.priority] || `Priority ${task.priority}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <span>Assigned to: {task.assignedToUserName || "Unassigned"}</span>
                  {task.dueDate && (
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
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
