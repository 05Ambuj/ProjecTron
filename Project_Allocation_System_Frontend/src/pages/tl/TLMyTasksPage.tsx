import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchTLMyTasks } from "../../features/tl/tlSlice";
import { CheckSquare, Clock, TrendingUp } from "lucide-react";
import LoadingPage from "../../components/common/LoadingPage";

const STATUS_LABELS: Record<number, string> = {
  1: "To Do",
  2: "In Progress",
  4: "Done",
};

const STATUS_COLORS: Record<number, string> = {
  1: "bg-neutral-100 text-neutral-700 border-neutral-200",
  2: "bg-blue-100 text-blue-700 border-blue-200",
  4: "bg-green-100 text-green-700 border-green-200",
};

export default function TLMyTasksPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading } = useSelector((state: RootState) => state.tl);

  useEffect(() => {
    dispatch(fetchTLMyTasks());
  }, [dispatch]);

  const todoTasks = tasks.filter((t) => t.status === 1);
  const inProgressTasks = tasks.filter((t) => t.status === 2);
  const doneTasks = tasks.filter((t) => t.status === 6);

  if (loading) {
    return <LoadingPage message="Loading my tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">My Tasks</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tasks assigned to you • {tasks.length} total
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neutral-50">
              <CheckSquare size={18} className="text-neutral-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              To Do
            </p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{todoTasks.length}</p>
        </div>

        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock size={18} className="text-blue-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              In Progress
            </p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{inProgressTasks.length}</p>
        </div>

        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Done
            </p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{doneTasks.length}</p>
        </div>
      </div>

      {/* Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* To Do */}
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">To Do</h2>
          {todoTasks.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No tasks</p>
          ) : (
            <div className="space-y-2">
              {todoTasks.map((task) => (
                <button
                  key={task.taskId}
                  onClick={() => navigate(`/tl/tasks/${task.taskId}`)}
                  className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 transition-all"
                >
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">
                    {task.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">{task.projectName}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* In Progress */}
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">In Progress</h2>
          {inProgressTasks.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No tasks</p>
          ) : (
            <div className="space-y-2">
              {inProgressTasks.map((task) => (
                <button
                  key={task.taskId}
                  onClick={() => navigate(`/tl/tasks/${task.taskId}`)}
                  className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-blue-300 transition-all"
                >
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">
                    {task.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">{task.projectName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Tasks List */}
      {tasks.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">All My Tasks</h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.taskId}
                onClick={() => navigate(`/tl/tasks/${task.taskId}`)}
                className="w-full text-left p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {task.projectName} • {task.taskCode}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${
                      STATUS_COLORS[task.status] || "bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {STATUS_LABELS[task.status] || `Status ${task.status}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <CheckSquare size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">No tasks assigned</p>
          <p className="text-sm text-neutral-500">You don't have any tasks assigned yet</p>
        </div>
      )}
    </div>
  );
}
