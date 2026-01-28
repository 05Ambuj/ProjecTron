import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchTMMyTasks } from "../../features/tm/tmSlice";
import { CheckSquare, Clock, TrendingUp, Calendar, Flag } from "lucide-react";
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
  5: "bg-green-100 text-green-700 border-green-200",
  6: "bg-emerald-100 text-emerald-700 border-emerald-200",
  8: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function TMMyTasksPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { myTasks, loading } = useSelector((state: RootState) => state.tm);

  useEffect(() => {
    dispatch(fetchTMMyTasks());
  }, [dispatch]);

  const notStartedTasks = myTasks.filter((t) => t.status === 1);
  const inProgressTasks = myTasks.filter((t) => t.status === 2);
  const doneTasks = myTasks.filter((t) => t.status === 6);

  if (loading) {
    return <LoadingPage message="Loading my tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">My Tasks</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tasks assigned to you • {myTasks.length} total
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neutral-50">
              <CheckSquare size={18} className="text-neutral-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Not Started
            </p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{notStartedTasks.length}</p>
        </div>

        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              In Progress
            </p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{inProgressTasks.length}</p>
        </div>

        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Done
            </p>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{doneTasks.length}</p>
        </div>

      </div>

      {/* Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Not Started */}
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-sm font-semibold text-neutral-900">Not Started ({notStartedTasks.length})</h2>
          </div>
          <div className="p-4">
            {notStartedTasks.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No tasks</p>
            ) : (
              <div className="space-y-2">
                {notStartedTasks.map((task) => (
                  <button
                    key={task.taskId}
                    onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
                    className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">{task.projectName} • {task.taskCode}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString()}
                              {task.isOverdue && (
                                <span className="ml-1 text-red-600 font-medium">(Overdue)</span>
                              )}
                            </span>
                          )}
                          {task.estimatedHours > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {task.estimatedHours}h
                            </span>
                          )}
                        </div>
                      </div>
                      {task.priority !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 0 ? "bg-green-100 text-green-700" :
                          task.priority === 1 ? "bg-yellow-100 text-yellow-700" :
                          task.priority === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {task.priorityDisplay || "Medium"}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-blue-50">
            <h2 className="text-sm font-semibold text-neutral-900">In Progress ({inProgressTasks.length})</h2>
          </div>
          <div className="p-4">
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No tasks</p>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.map((task) => (
                  <button
                    key={task.taskId}
                    onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
                    className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">{task.projectName} • {task.taskCode}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString()}
                              {task.isOverdue && (
                                <span className="ml-1 text-red-600 font-medium">(Overdue)</span>
                              )}
                            </span>
                          )}
                          {task.estimatedHours > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {task.actualHours || 0}/{task.estimatedHours}h
                            </span>
                          )}
                        </div>
                        {task.progressPercentage > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-neutral-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${task.progressPercentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">{task.progressPercentage}% complete</p>
                          </div>
                        )}
                      </div>
                      {task.priority !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 0 ? "bg-green-100 text-green-700" :
                          task.priority === 1 ? "bg-yellow-100 text-yellow-700" :
                          task.priority === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {task.priorityDisplay || "Medium"}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Tasks List */}
      {myTasks.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-sm font-semibold text-neutral-900">All My Tasks ({myTasks.length})</h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {myTasks.map((task) => (
                <button
                  key={task.taskId}
                  onClick={() => navigate(`/tm/tasks/${task.taskId}`)}
                  className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        {task.isOverdue && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {task.projectName} • {task.taskCode}
                        {task.sprintName && ` • ${task.sprintName}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.estimatedHours > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {task.actualHours || 0}/{task.estimatedHours}h
                          </span>
                        )}
                        {task.storyPoints > 0 && (
                          <span className="flex items-center gap-1">
                            <Flag size={12} />
                            {task.storyPoints} SP
                          </span>
                        )}
                      </div>
                      {task.progressPercentage > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-neutral-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          STATUS_COLORS[task.status] || "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {STATUS_LABELS[task.status] || `Status ${task.status}`}
                      </span>
                      {task.priority !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 0 ? "bg-green-100 text-green-700" :
                          task.priority === 1 ? "bg-yellow-100 text-yellow-700" :
                          task.priority === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {task.priorityDisplay || "Medium"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {myTasks.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">No tasks assigned</p>
          <p className="text-sm text-neutral-500">You don't have any tasks assigned yet</p>
        </div>
      )}
    </div>
  );
}
