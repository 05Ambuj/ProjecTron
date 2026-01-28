import { useEffect, useState } from "react";
import { X, Edit2, Save, X as XIcon, Trash2, User, Clock, Flag, CheckCircle2, MessageSquare, Target } from "lucide-react";
import api from "../../api/client";
import { useToast } from "../../contexts/useToast";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { UserRole } from "../../constants/roles";
import { extractErrorMessage } from "../../types/types";

/* ---------------- Types ---------------- */

interface TaskDetail {
  taskId: string;
  title: string;
  description?: string;
  status: number;
  priority: number;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedByUserId?: string;
  estimatedHours?: number;
  actualHours?: number;
}

interface TaskComment {
  commentId: string;
  text: string;
  userName: string;
  createdDate: string;
}

const STATUS_OPTIONS = [
  { id: 1, label: "Not Started" },
  { id: 2, label: "In Progress" },
  { id: 5, label: "Approved" },
  { id: 6, label: "Done" },
  { id: 8, label: "Cancelled" },
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

/* ---------------- Component ---------------- */

export default function TaskDrawer({
  taskId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    description: "",
    estimatedHours: 0,
    actualHours: 0,
  });
  const { showError, showSuccess } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Check if current user can edit this task
  // PM, TL, assigned user, or task creator can edit
  const canEdit = task && user && (
    user.role === UserRole.ProjectManager ||
    user.role === UserRole.TeamLead ||
    user.role === UserRole.Admin ||
    task.assignedToUserId === user.userId ||
    task.assignedByUserId === user.userId
  );

  // Check if current user can delete this task
  // PM and TL can delete any task, TM can only delete tasks they created
  const canDelete = task && user && (
    user.role === UserRole.ProjectManager ||
    user.role === UserRole.TeamLead ||
    user.role === UserRole.Admin ||
    (user.role === UserRole.TeamMember && task.assignedByUserId === user.userId)
  );

  /* ---------------- Load task + comments ---------------- */

  useEffect(() => {
    if (!taskId || !open) return;

    let cancelled = false;

    async function loadTask() {
      setLoading(true);

      try {
        const [taskRes, commentsRes] = await Promise.all([
          api.get(`/tasks/${taskId}`),
          api.get(`/tasks/${taskId}/comments`),
        ]);

        if (!cancelled) {
          if (!taskRes.data.success || !taskRes.data.data) {
            throw new Error(taskRes.data.message || "Failed to load task");
          }
          const taskData = taskRes.data.data;
          setTask(taskData);
          
          // Initialize edit form
          setEditForm({
            description: taskData.description || "",
            estimatedHours: taskData.estimatedHours || 0,
            actualHours: taskData.actualHours || 0,
          });
          
          if (commentsRes.data.success && commentsRes.data.data) {
            setComments(commentsRes.data.data);
          } else {
            setComments([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load task");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      cancelled = true;
    };
  }, [taskId, open, showError]);

  if (!open || !taskId) return null;

  /* ---------------- Actions ---------------- */

  async function updateStatus(status: number) {
    if (!task) return;

    // Don't update if status is already the same
    if (task.status === status) {
      return;
    }

    try {
      const res = await api.put(`/tasks/${task.taskId}/status`, { 
        newStatus: status,
        comment: "Status updated via task drawer"
      });

      // Check if response indicates failure
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to update status");
      }

      // Update task with the response data
      if (res.data.data) {
        setTask(res.data.data);
        showSuccess("Task status updated successfully");
        onUpdated?.();
      } else {
        // If no data in response, reload the task
        const taskRes = await api.get(`/tasks/${task.taskId}`);
        if (taskRes.data.success && taskRes.data.data) {
          setTask(taskRes.data.data);
          showSuccess("Task status updated successfully");
          onUpdated?.();
        } else {
          throw new Error("Failed to reload updated task");
        }
      }
    } catch (err) {
      // Extract error message from response if available
      const errorMessage = extractErrorMessage(err);
      
      // Always reload task to check if status was actually updated
      // The backend might have updated the status even if there was an error
      try {
        const taskRes = await api.get(`/tasks/${task.taskId}`);
        if (taskRes.data.success && taskRes.data.data) {
          const updatedTask = taskRes.data.data;
          setTask(updatedTask);
          
          // If the status was actually updated, show success instead of error
          if (updatedTask.status === status) {
            showSuccess("Task status updated successfully");
            onUpdated?.();
            return; // Don't show error if status was updated
          }
        }
      } catch (reloadErr) {
        // Ignore reload errors
        console.error("Failed to reload task:", reloadErr);
      }
      
      // Only show error if status wasn't actually updated
      showError(errorMessage);
    }
  }

  async function addComment() {
    if (!newComment.trim() || !taskId) return;

    try {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        text: newComment,
      });

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || "Failed to add comment");
      }

      setComments((prev) => [...prev, res.data.data]);
      setNewComment("");
      showSuccess("Comment added");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add comment");
    }
  }

  async function saveTaskUpdates() {
    if (!taskId || !task) return;

    try {
      const res = await api.put(`/tasks/${taskId}`, {
        description: editForm.description,
        estimatedHours: editForm.estimatedHours,
        actualHours: editForm.actualHours,
      });

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || "Failed to update task");
      }

      setTask(res.data.data);
      setIsEditing(false);
      showSuccess("Task updated successfully");
      onUpdated?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  function cancelEdit() {
    if (task) {
      setEditForm({
        description: task.description || "",
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
      });
    }
    setIsEditing(false);
  }

  async function deleteTask() {
    if (!taskId || !task) return;

    try {
      setIsDeleting(true);
      const res = await api.delete(`/tasks/${taskId}`);

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to delete task");
      }

      showSuccess("Task deleted successfully");
      setShowDeleteConfirm(false);
      onDeleted?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Task Details
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              View and update task information
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                title="Delete task"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-all duration-200 hover:scale-105"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl p-6 m-4 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Delete Task?
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteTask}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading || !task ? (
          <div className="flex-1 space-y-4 p-6 animate-pulse">
            <div className="h-6 w-2/3 rounded-lg bg-neutral-200" />
            <div className="h-24 rounded-lg bg-neutral-200" />
            <div className="h-32 rounded-lg bg-neutral-200" />
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Title & Assignment */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                {task.title}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                  <User size={14} className="text-blue-600" />
                  <span className="text-sm font-semibold text-neutral-900">
                    {task.assignedToUserName ?? <span className="text-neutral-400 italic">Unassigned</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-neutral-500">
                  Description
                </div>
                {canEdit && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                )}
              </div>
              {isEditing && canEdit ? (
                <div className="space-y-3">
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter task description..."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={saveTaskUpdates}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Save size={12} />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors"
                    >
                      <XIcon size={12} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-800">
                  {task.description || "No description provided"}
                </p>
              )}
            </div>

            {/* Estimated Hours & Actual Hours */}
            {canEdit && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-neutral-700 flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" />
                      Estimated Hours
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={editForm.estimatedHours}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          estimatedHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-lg font-bold text-neutral-900 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                      {task.estimatedHours || 0} hrs
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-neutral-700 flex items-center gap-2">
                      <Target size={14} className="text-green-500" />
                      Actual Hours
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editForm.actualHours}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          actualHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-lg font-bold text-neutral-900 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      {task.actualHours || 0} hrs
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                <div className="mb-3 text-xs font-bold text-neutral-700 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-500" />
                  Status
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateStatus(s.id)}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all min-w-[90px] text-center ${
                        task.status === s.id
                          ? "border-blue-600 bg-blue-600 text-white shadow-md scale-105"
                          : "border-neutral-300 bg-white text-neutral-700 hover:bg-blue-50 hover:border-blue-300 hover:scale-105"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                <div className="mb-3 text-xs font-bold text-neutral-700 flex items-center gap-2">
                  <Flag size={14} className="text-orange-500" />
                  Priority
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 ${
                  task.priority === 1
                    ? "bg-green-50 text-green-700 border-green-200"
                    : task.priority === 2
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : task.priority === 3
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  <Flag size={14} />
                  {PRIORITY_OPTIONS[task.priority - 1] || `Priority ${task.priority}`}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
              <div className="mb-4 text-sm font-bold text-neutral-700 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                Comments ({comments.length})
              </div>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.commentId}
                    className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-blue-700">
                        {c.userName}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(c.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-800 leading-relaxed">
                      {c.text}
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-sm italic text-neutral-400 text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
