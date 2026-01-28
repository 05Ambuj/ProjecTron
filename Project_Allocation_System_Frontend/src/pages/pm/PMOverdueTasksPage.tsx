import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { fetchPMOverdueTasks } from "../../api/pm";
import { AlertCircle, Calendar, User, ChevronDown } from "lucide-react";
import type { TaskDTO } from "../../types/adminTypes";
import { useToast } from "../../contexts/useToast";
import { UserRole } from "../../constants/roles";

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

export default function PMOverdueTasksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const { showError } = useToast();

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    if (user) {
      dispatch(fetchPMProjects({ page: 1, pageSize: 100, actorRole: user.role as UserRole }));
    }
  }, [dispatch, user]);

  useEffect(() => {
    async function loadOverdueTasks() {
      try {
        setLoading(true);
        const data = await fetchPMOverdueTasks(selectedProjectId || undefined);
        setTasks(data);
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

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <p className="text-sm text-neutral-600">Loading overdue tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <AlertCircle size={32} className="text-green-600" />
          </div>
          <p className="text-sm font-medium text-neutral-900 mb-1">No overdue tasks</p>
          <p className="text-sm text-neutral-500">
            {selectedProjectId
              ? "This project has no overdue tasks"
              : "All tasks are on track or completed"}
          </p>
        </div>
      )}

      {/* Overdue Tasks List */}
      {!loading && tasks.length > 0 && (
        <div className="space-y-4">
            {/* Critical Priority First */}
            {(() => {
              const criticalTasks = tasks
                .filter((t) => t.priority === 3 && t.dueDate)
                .sort((a, b) => {
                  if (!a.dueDate || !b.dueDate) return 0;
                  return getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate);
                });
              
              return criticalTasks.length > 0 ? (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600 mb-3 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Critical Priority ({criticalTasks.length})
                  </h2>
                  <div className="space-y-3">
                    {criticalTasks.map((task) => (
                      <TaskRow key={task.taskId} task={task} getDaysOverdue={getDaysOverdue} />
                    ))}
                  </div>
                </section>
              ) : null;
            })()}

            {/* Other Priorities */}
            {(() => {
              const otherTasks = tasks
                .filter((t) => t.priority !== 3 && t.dueDate)
                .sort((a, b) => {
                  if (!a.dueDate || !b.dueDate) return 0;
                  return getDaysOverdue(b.dueDate) - getDaysOverdue(a.dueDate);
                });
              
              return otherTasks.length > 0 ? (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                    Other Tasks ({otherTasks.length})
                  </h2>
                  <div className="space-y-3">
                    {otherTasks.map((task) => (
                      <TaskRow key={task.taskId} task={task} getDaysOverdue={getDaysOverdue} />
                    ))}
                  </div>
                </section>
              ) : null;
            })()}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  getDaysOverdue,
}: {
  task: TaskDTO;
  getDaysOverdue: (date: string) => number;
}) {
  const daysOverdue = task.dueDate ? getDaysOverdue(task.dueDate) : 0;

  return (
    <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-neutral-900">{task.title}</h3>
            <span className="text-xs text-neutral-500">{task.taskCode}</span>
            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || "text-neutral-600"}`}>
              {PRIORITY_LABELS[task.priority] || `Priority ${task.priority}`}
            </span>
          </div>
          <p className="text-sm text-neutral-700 line-clamp-2 mb-2">{task.description}</p>
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

        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">
          {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-4 text-xs text-neutral-600">
          {task.assignedToUserName && (
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{task.assignedToUserName}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          <span>{task.storyPoints} SP</span>
        </div>
      </div>
    </div>
  );
}