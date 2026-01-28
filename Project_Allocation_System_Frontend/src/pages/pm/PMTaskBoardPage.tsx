import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { fetchPMTaskBoard, fetchProjectAllocations } from "../../api/pm";
import { Columns, ChevronDown } from "lucide-react";
import type { TaskDTO } from "../../types/adminTypes";
import { UserRole } from "../../constants/roles";
import { useToast } from "../../contexts/useToast";
import type { ProjectAllocationDTO } from "../../types/pmTypes";

/* ============================================================
   Types
   ============================================================ */

interface TaskBoardColumn {
  status: number;
  statusName: string;
  tasks: TaskDTO[];
}

interface TaskBoard {
  projectId: string;
  columns: TaskBoardColumn[];
}

/* ============================================================
   Component
   ============================================================ */

export default function PMTaskBoardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { showError } = useToast();

  const { projects } = useSelector((state: RootState) => state.pm);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState<ProjectAllocationDTO[]>([]);

  /* ---------------- Load PM projects ---------------- */

  useEffect(() => {
    if (!userRole) return;

    dispatch(
      fetchPMProjects({
        page: 1,
        pageSize: 100,
        actorRole: userRole as UserRole,
      })
    );
  }, [dispatch, userRole]);

  /* ---------------- Load task board ---------------- */

  useEffect(() => {
    if (!selectedProjectId) return;

    let cancelled = false;

    async function loadBoard() {
      try {
        setLoading(true);
        const data = await fetchPMTaskBoard(
          selectedProjectId,
          selectedUserId || undefined
        );

        if (!cancelled) {
          setBoard(data);
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

    loadBoard();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, selectedUserId, showError]);

  /* ---------------- Load project allocations (users) ---------------- */

  useEffect(() => {
    if (!selectedProjectId) {
      setAllocations([]);
      setSelectedUserId("");
      return;
    }

    let cancelled = false;

    async function loadAllocations() {
      try {
        const data = await fetchProjectAllocations(selectedProjectId);
        if (!cancelled) {
          setAllocations(data);
        }
      } catch (err) {
        if (!cancelled) {
          showError(
            err instanceof Error ? err.message : "Failed to load team members"
          );
          setAllocations([]);
        }
      }
    }

    loadAllocations();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, showError]);

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* Header */}
      <header className="flex items-start justify-between max-w-full">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Task Board</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Kanban view of project tasks
          </p>
        </div>
      </header>

      {/* Project + User Filters */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Project
            </label>
            <div className="relative w-full">
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Filter by User
            </label>
            <div className="relative w-full">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={!selectedProjectId}
                className="w-full appearance-none px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8 disabled:bg-neutral-100 disabled:text-neutral-500"
              >
                <option value="">All users</option>
                {allocations.map((allocation) => (
                  <option key={allocation.userId} value={allocation.userId}>
                    {allocation.userName}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <p className="text-sm text-neutral-600">Loading task board...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !selectedProjectId && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <Columns size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            Select a project
          </p>
          <p className="text-sm text-neutral-500">
            Choose a project to view its task board
          </p>
        </div>
      )}

      {/* Task Board */}
      {!loading && board && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <div className="flex gap-4 pb-4 px-6 py-6 min-w-full">
              {board.columns.map((column) => (
                <div key={column.status} className="shrink-0 w-72 md:w-80">
                <div className="rounded-t-lg p-4 border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {column.statusName}
                    </h3>
                    <span className="px-2 py-1 bg-white text-neutral-700 rounded-full text-xs font-medium border border-neutral-200">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 space-y-3 min-h-64 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-neutral-500">
                      No tasks
                    </div>
                  ) : (
                    column.tasks.map((task) => (
                      <div
                        key={task.taskId}
                        className="rounded-lg bg-white border border-neutral-200 shadow-sm p-4 text-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                              {task.title}
                            </div>
                            <div className="text-xs text-neutral-500 font-mono">
                              {task.taskCode}
                            </div>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 shrink-0">
                            {task.priorityDisplay || `P${task.priority}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
                          <span className="truncate max-w-[10rem]">
                            {task.projectName}
                          </span>
                          {task.assignedToUserName && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[8rem]">
                                {task.assignedToUserName}
                              </span>
                            </>
                          )}
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span>
                                Due {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
