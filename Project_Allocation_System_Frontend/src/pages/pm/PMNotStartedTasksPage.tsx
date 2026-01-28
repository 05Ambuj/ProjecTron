import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { fetchPMNotStartedTasks } from "../../api/pm";
import { Clock, Calendar, User, ChevronDown } from "lucide-react";
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

export default function PMNotStartedTasksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const { showError } = useToast();

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [daysFilter, setDaysFilter] = useState(2);

  useEffect(() => {
    if (user) {
      dispatch(fetchPMProjects({ page: 1, pageSize: 100, actorRole: user.role as UserRole }));
    }
  }, [dispatch, user]);

  useEffect(() => {
    async function loadNotStartedTasks() {
      try {
        setLoading(true);
        const data = await fetchPMNotStartedTasks(selectedProjectId || undefined, daysFilter);
        setTasks(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load tasks");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotStartedTasks();
  }, [selectedProjectId, daysFilter, showError]);

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Not Started Tasks</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} approaching deadline without progress
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Filter by Project
            </label>
            <div className="relative">
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Days Until Due
            </label>
            <div className="relative">
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                className="w-full appearance-none px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
              >
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={7}>1 week</option>
                <option value={14}>2 weeks</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <p className="text-sm text-neutral-600">Loading tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Clock size={32} className="text-green-600" />
          </div>
          <p className="text-sm font-medium text-neutral-900 mb-1">All tasks are on track</p>
          <p className="text-sm text-neutral-500">
            No not-started tasks approaching their deadline in the next {daysFilter} day
            {daysFilter !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Not Started Tasks List */}
      {!loading && tasks.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm divide-y divide-neutral-100">
            {tasks
              .filter((t) => t.dueDate)
              .sort((a, b) => {
                if (!a.dueDate || !b.dueDate) return 0;
                return getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate);
              })
              .map((task) => (
                <div key={task.taskId} className="p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-neutral-900">{task.title}</h3>
                        <span className="text-xs text-neutral-500">{task.taskCode}</span>
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || "text-neutral-600"}`}>
                          {PRIORITY_LABELS[task.priority] || `Priority ${task.priority}`}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 line-clamp-2 mb-2">
                        {task.description}
                      </p>
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

                    <div className="text-right">
                      {task.dueDate && (
                        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold mb-2 border border-amber-200">
                          {getDaysUntilDue(task.dueDate)} day{getDaysUntilDue(task.dueDate) !== 1 ? "s" : ""} left
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-4 text-xs text-neutral-600">
                      {task.assignedToUserName ? (
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{task.assignedToUserName}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600">Unassigned</span>
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
              ))}
          </div>
        )}

      {/* Warning Banner */}
      {!loading && tasks.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock size={18} className="text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">Action Required</h3>
              <p className="text-xs text-amber-700">
                These tasks are approaching their deadline and haven't been started yet. Consider
                assigning team members or adjusting priorities to ensure timely completion.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}