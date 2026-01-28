import { useEffect, useState } from "react";
import api from "../../api/client";
import { GripVertical, Flag, Clock, User, Calendar } from "lucide-react";
import TaskDrawer from "./TaskDrawer";
import { useToast } from "../../contexts/useToast";

/* ============================================================
   Types
   ============================================================ */

interface Task {
  taskId: string;
  title: string;
  status: number;
  priority: number;
  assigneeName?: string;
  assignedToUserName?: string; // API returns this field
  taskCode?: string;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  isOverdue?: boolean;
  description?: string;
  progressPercentage?: number;
}

interface TaskBoardColumn {
  status: number;
  statusName: string;
  tasks: Task[];
}

interface TaskBoardData {
  projectId: string;
  columns: TaskBoardColumn[];
}

/* ============================================================
   Constants
   ============================================================ */

const STATUSES = [
  { id: 1, label: "Not Started" },
  { id: 2, label: "In Progress" },
  { id: 5, label: "Approved" },
  { id: 6, label: "Done" },
];

/* ============================================================
   Component
   ============================================================ */

export default function TaskBoard({ projectId, selectedUserId }: { projectId: string; selectedUserId?: string }) {
  const [board, setBoard] = useState<TaskBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { showError } = useToast();

  /* ---------------- Load task board ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadBoard() {
      try {
        setLoading(true);
        const url = selectedUserId 
          ? `/tasks/board/${projectId}?assignedToUserId=${selectedUserId}`
          : `/tasks/board/${projectId}`;
        const res = await api.get(url);

        if (!cancelled) {
          if (!res.data.success || !res.data.data) {
            throw new Error(res.data.message || "Failed to load task board");
          }
          setBoard(res.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load task board");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (projectId) {
      loadBoard();
    }

    return () => {
      cancelled = true;
    };
  }, [projectId, selectedUserId, showError]);


  /* ---------------- Loading ---------------- */

  if (loading || !board) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {STATUSES.map((s) => (
          <div
            key={s.id}
            className="h-64 animate-pulse rounded-xl bg-neutral-200"
          />
        ))}
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {STATUSES.map((status) => {
          const columnTasks =
            board.columns.find((c) => c.status === status.id)?.tasks ?? [];

          return (
            <div
              key={status.id}
              className="rounded-xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className={`px-4 py-3 border-b rounded-t-xl ${
                status.id === 1 ? "bg-neutral-50 border-neutral-200" :
                status.id === 2 ? "bg-blue-50 border-blue-200" :
                status.id === 5 ? "bg-purple-50 border-purple-200" :
                "bg-green-50 border-green-200"
              }`}>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center justify-between">
                  <span>{status.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    status.id === 1 ? "bg-neutral-200 text-neutral-700" :
                    status.id === 2 ? "bg-blue-200 text-blue-700" :
                    status.id === 5 ? "bg-purple-200 text-purple-700" :
                    "bg-green-200 text-green-700"
                  }`}>
                    {columnTasks.length}
                  </span>
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => setSelectedTaskId(task.taskId)}
                    className="group cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 text-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical
                        size={14}
                        className="mt-1 text-neutral-400 shrink-0 group-hover:text-blue-400 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-neutral-900 truncate text-base mb-1">
                              {task.title}
                            </div>
                            {task.taskCode && (
                              <div className="text-xs text-neutral-500 font-mono bg-neutral-100 px-2 py-0.5 rounded inline-block">
                                {task.taskCode}
                              </div>
                            )}
                          </div>
                          <div className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold border ${
                            task.priority === 1
                              ? "bg-green-50 text-green-700 border-green-200"
                              : task.priority === 2
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : task.priority === 3
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            <Flag size={11} className="inline mr-1" />
                            {task.priority === 1 ? "Low" : task.priority === 2 ? "Med" : task.priority === 3 ? "High" : "Crit"}
                          </div>
                        </div>
                        
                        {/* Assigned To - More Prominent */}
                        <div className="mb-2 pb-2 border-b border-neutral-200">
                          {(task.assignedToUserName || task.assigneeName) ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                              <User size={13} className="text-blue-600 shrink-0" />
                              <span className="truncate font-semibold">{task.assignedToUserName || task.assigneeName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400 italic bg-neutral-50 px-2 py-1 rounded-md">
                              <User size={13} className="text-neutral-300 shrink-0" />
                              <span>Unassigned</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          {/* Progress Bar */}
                          {task.progressPercentage !== undefined && task.progressPercentage > 0 && (
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-neutral-600">Progress</span>
                                <span className="text-xs font-bold text-neutral-900">{task.progressPercentage}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                  style={{ width: `${task.progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Story Points & Hours */}
                          {((task.storyPoints && task.storyPoints > 0) || (task.estimatedHours && task.estimatedHours > 0)) && (
                            <div className="flex items-center gap-4 text-xs">
                              {task.storyPoints && task.storyPoints > 0 && (
                                <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-semibold">
                                  <span>{task.storyPoints}</span>
                                  <span className="text-purple-500">pts</span>
                                </span>
                              )}
                              {task.estimatedHours && task.estimatedHours > 0 && (
                                <span className="flex items-center gap-1.5 bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md font-medium">
                                  <Clock size={12} className="text-neutral-500" />
                                  <span>{task.estimatedHours}h</span>
                                  {task.actualHours && task.actualHours > 0 && (
                                    <span className="text-neutral-500">/ {task.actualHours}h</span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Due Date */}
                          {task.dueDate && (
                            <div className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md ${
                              task.isOverdue
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              <Calendar size={13} className={task.isOverdue ? "text-red-600" : "text-amber-600"} />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {task.isOverdue && <span className="ml-1 font-bold">(Overdue)</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-sm text-neutral-400 italic bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                    No tasks in this column
                  </div>
                )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- Task Drawer ---------------- */}
      <TaskDrawer
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdated={() => {
          // Reload board after update
          if (projectId) {
            const url = selectedUserId 
              ? `/tasks/board/${projectId}?assignedToUserId=${selectedUserId}`
              : `/tasks/board/${projectId}`;
            api.get(url).then((res) => {
              if (res.data.success && res.data.data) {
                setBoard(res.data.data);
              }
            });
          }
        }}
        onDeleted={() => {
          // Reload board after delete
          setSelectedTaskId(null);
          if (projectId) {
            const url = selectedUserId 
              ? `/tasks/board/${projectId}?assignedToUserId=${selectedUserId}`
              : `/tasks/board/${projectId}`;
            api.get(url).then((res) => {
              if (res.data.success && res.data.data) {
                setBoard(res.data.data);
              }
            });
          }
        }}
      />
    </>
  );
}
