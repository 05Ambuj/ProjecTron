import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  MessageSquare, 
  AlertCircle,
  Edit2,
  Save,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Circle,
  TrendingUp,
  FileText,
  Tag,
  Shield
} from "lucide-react";
import api from "../../api/client";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import type { TaskDTO } from "../../types/adminTypes";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { extractErrorMessage } from "../../types/types";

interface TaskComment {
  commentId: string;
  userId: string;
  text: string;
  userName: string;
  createdDate: string;
  updatedDate?: string;
  commentType?: number;
  isBlocking?: boolean;
}

const STATUS_OPTIONS = [
  { id: 1, label: "Not Started", color: "bg-neutral-100 text-neutral-700" },
  { id: 2, label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { id: 5, label: "Approved", color: "bg-green-100 text-green-700" },
  { id: 6, label: "Done", color: "bg-emerald-100 text-emerald-700" },
  { id: 8, label: "Cancelled", color: "bg-gray-100 text-gray-700" },
];

const PRIORITY_OPTIONS = [
  { id: 1, label: "Low", color: "bg-green-100 text-green-700" },
  { id: 2, label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { id: 3, label: "High", color: "bg-orange-100 text-orange-700" },
  { id: 4, label: "Critical", color: "bg-red-100 text-red-700" },
];

export default function TMTaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { showError, showSuccess } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [task, setTask] = useState<TaskDTO | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    estimatedHours: 0,
    actualHours: 0,
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Team Members can only edit tasks assigned to them
  const canEdit = task && user && task.assignedToUserId === user.userId;

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    async function loadTask() {
      setLoading(true);
      try {
        const [taskRes, commentsRes] = await Promise.all([
          api.get(`/tasks/${taskId}`),
          api.get(`/tasks/${taskId}/comments`),
        ]);

        if (cancelled) return;

        if (!taskRes.data.success || !taskRes.data.data) {
          throw new Error(taskRes.data.message || "Failed to load task");
        }

        const taskData = taskRes.data.data;
        setTask(taskData);
        
        // Initialize edit form
        setEditForm({
          title: taskData.title || "",
          description: taskData.description || "",
          estimatedHours: taskData.estimatedHours || 0,
          actualHours: taskData.actualHours || 0,
        });

        if (commentsRes.data.success && commentsRes.data.data) {
          setComments(commentsRes.data.data);
        } else {
          setComments([]);
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
  }, [taskId, showError]);

  async function updateStatus(newStatus: number) {
    if (!task) return;

    // Don't update if status is already the same
    if (task.status === newStatus) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await api.put(`/tasks/${task.taskId}/status`, {
        newStatus,
        comment: `Status changed to ${STATUS_OPTIONS.find(s => s.id === newStatus)?.label || "Unknown"}`,
      });

      // Check if response indicates failure
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to update status");
      }

      // Update task with the response data
      if (res.data.data) {
        setTask(res.data.data);
        showSuccess("Task status updated successfully");
      } else {
        // If no data in response, reload the task
        const taskRes = await api.get(`/tasks/${task.taskId}`);
        if (taskRes.data.success && taskRes.data.data) {
          setTask(taskRes.data.data);
          showSuccess("Task status updated successfully");
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
          if (updatedTask.status === newStatus) {
            showSuccess("Task status updated successfully");
            return; // Don't show error if status was updated
          }
        }
      } catch (reloadErr) {
        // Ignore reload errors
        console.error("Failed to reload task:", reloadErr);
      }
      
      // Only show error if status wasn't actually updated
      showError(errorMessage);
    } finally {
      setUpdatingStatus(false);
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

      setComments((prev) => [res.data.data, ...prev]);
      setNewComment("");
      showSuccess("Comment added successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add comment");
    }
  }

  async function updateComment(commentId: string) {
    if (!editingCommentText.trim()) return;

    try {
      const res = await api.put(`/tasks/comments/${commentId}`, {
        text: editingCommentText,
      });

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || "Failed to update comment");
      }

      setComments((prev) =>
        prev.map((c) => (c.commentId === commentId ? res.data.data : c))
      );
      setEditingCommentId(null);
      setEditingCommentText("");
      showSuccess("Comment updated successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update comment");
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await api.delete(`/tasks/comments/${commentId}`);

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to delete comment");
      }

      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      showSuccess("Comment deleted successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  }

  function startEditComment(comment: TaskComment) {
    setEditingCommentId(comment.commentId);
    setEditingCommentText(comment.text);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  function canEditOrDeleteComment(comment: TaskComment): boolean {
    if (!user) return false;
    // Comment author, Admin, PM, or TL can edit/delete
    return (
      comment.userId === user.userId ||
      user.role === 1 || // Admin
      user.role === 2 || // ProjectManager
      user.role === 3    // TeamLead
    );
  }

  async function saveTaskUpdates() {
    if (!taskId || !task) return;

    try {
      const res = await api.put(`/tasks/${taskId}`, {
        title: editForm.title || task.title, // Always send title to avoid validation error
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
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  function cancelEdit() {
    if (task) {
      setEditForm({
        title: task.title || "",
        description: task.description || "",
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
      });
    }
    setIsEditing(false);
  }

  if (loading) {
    return <LoadingPage message="Loading task details..." />;
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-neutral-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm font-medium text-neutral-900 mb-1">Task not found</p>
            <p className="text-sm text-neutral-500 mb-6">
              The task you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link
              to="/tm/tasks/my-tasks"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to My Tasks</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusOption = STATUS_OPTIONS.find(s => s.id === task.status) || STATUS_OPTIONS[0];
  const priorityOption = PRIORITY_OPTIONS.find(p => p.id === task.priority) || PRIORITY_OPTIONS[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/tm/tasks/my-tasks"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-neutral-200"
          >
            <ArrowLeft size={18} />
            <span>Back to My Tasks</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg shadow-neutral-100/50 overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-6 border-b border-neutral-200/60 bg-gradient-to-r from-neutral-50/50 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{task.title}</h1>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${statusOption.color} border border-current/10`}>
                        {statusOption.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                      <span className="font-mono text-xs bg-neutral-100 px-2.5 py-1 rounded-md font-semibold text-neutral-700">
                        {task.taskCode}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="font-medium">{task.projectName}</span>
                      {task.sprintName && (
                        <>
                          <span className="text-neutral-400">•</span>
                          <span className="text-neutral-500">{task.sprintName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-neutral-200 hover:border-blue-200 shadow-sm hover:shadow ml-4"
                    >
                      <Edit2 size={16} />
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Title - Editable */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter task title..."
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-neutral-400" />
                    <label className="text-sm font-semibold text-neutral-700">Description</label>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Enter task description..."
                    />
                  ) : (
                    <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-xl p-4">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                        {task.description || <span className="text-neutral-400 italic">No description provided.</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* Time Tracking Section */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50/30 border border-blue-200/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">Time Tracking</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                      <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">
                        Estimated Hours
                      </label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={editForm.estimatedHours}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                estimatedHours: Math.max(0.5, parseFloat(e.target.value) || 0.5),
                              })
                            }
                            className="flex-1 px-4 py-2.5 border border-blue-300 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <span className="text-sm text-neutral-500 font-medium">hrs</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-neutral-900">{task.estimatedHours || 0}</span>
                          <span className="text-sm text-neutral-500 font-medium">hours</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                      <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">
                        Actual Hours
                      </label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editForm.actualHours}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                actualHours: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="flex-1 px-4 py-2.5 border border-blue-300 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <span className="text-sm text-neutral-500 font-medium">hrs</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-bold text-neutral-900">{task.actualHours || 0}</span>
                          <span className="text-sm text-neutral-500 font-medium">hours</span>
                          {task.estimatedHours > 0 && (
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold shadow-sm ${
                              task.actualHours > task.estimatedHours 
                                ? "bg-red-100 text-red-700 border border-red-200" 
                                : task.actualHours === task.estimatedHours
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            }`}>
                              {task.actualHours > task.estimatedHours 
                                ? "Over estimate" 
                                : task.actualHours === task.estimatedHours
                                ? "On track"
                                : `${((task.actualHours / task.estimatedHours) * 100).toFixed(0)}% done`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {task.estimatedHours > 0 && !isEditing && (
                    <div className="mt-5 pt-5 border-t border-blue-200/60">
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-2">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp size={14} />
                          Progress
                        </span>
                        <span className="font-bold">{Math.min(100, Math.round((task.actualHours / task.estimatedHours) * 100))}%</span>
                      </div>
                      <div className="w-full bg-blue-200/50 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.min(100, (task.actualHours / task.estimatedHours) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200">
                    <button
                      onClick={cancelEdit}
                      className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTaskUpdates}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                )}

                {/* Acceptance Criteria */}
                {task.acceptanceCriteria && (
                  <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 border border-emerald-200/60 rounded-2xl p-6">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      </div>
                      <label className="text-sm font-bold text-neutral-900">
                        Acceptance Criteria
                      </label>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                        {task.acceptanceCriteria}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <MessageSquare size={20} />
                  Comments ({comments.length})
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Add Comment */}
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <button
                    onClick={addComment}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    disabled={!newComment.trim()}
                    type="button"
                    className="block w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm relative z-50"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Plus size={16} />
                    Add Comment
                  </button>
                </div>

                {/* Comments List */}
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto text-neutral-300 mb-3" />
                    <p className="text-sm font-medium text-neutral-500 mb-1">No comments yet</p>
                    <p className="text-xs text-neutral-400">Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.commentId} className="bg-gradient-to-br from-neutral-50/50 to-white border border-neutral-200/60 rounded-xl p-5 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User size={14} className="text-blue-600" />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-neutral-900 block">
                                {comment.userName}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {new Date(comment.createdDate).toLocaleString()}
                                {comment.updatedDate && comment.updatedDate !== comment.createdDate && (
                                  <span className="ml-1.5 text-neutral-400 italic">(edited)</span>
                                )}
                              </span>
                            </div>
                            {comment.isBlocking && (
                              <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm">
                                Blocking
                              </span>
                            )}
                          </div>
                          {canEditOrDeleteComment(comment) && editingCommentId !== comment.commentId && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditComment(comment)}
                                className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit comment"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deleteComment(comment.commentId)}
                                className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete comment"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.commentId ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateComment(comment.commentId)}
                                disabled={!editingCommentText.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 shadow-sm"
                              >
                                <Save size={12} />
                                Save
                              </button>
                              <button
                                onClick={cancelEditComment}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-all duration-200"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed pl-10">
                            {comment.text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status & Priority */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg shadow-neutral-100/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200/60 bg-gradient-to-r from-neutral-50/50 to-white">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Circle size={12} className="text-blue-500 fill-current" />
                  Details
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {/* Status - Team Members can update status if assigned */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">Status</label>
                  {updatingStatus ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </div>
                  ) : canEdit ? (
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold shadow-sm border ${statusOption.color} border-current/10`}>
                      {statusOption.label}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">Priority</label>
                  <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold shadow-sm border ${priorityOption.color} border-current/10`}>
                    <Flag size={14} />
                    {priorityOption.label}
                  </div>
                </div>

                {/* Story Points */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">Story Points</label>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-neutral-900">{task.storyPoints || 0}</span>
                    <span className="text-xs text-neutral-500 font-medium">points</span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">Progress</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-700">{task.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-200/60 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${task.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment & Dates */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg shadow-neutral-100/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200/60 bg-gradient-to-r from-neutral-50/50 to-white">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <User size={14} className="text-blue-500" />
                  Assignment
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {/* Assigned To */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                    <User size={12} className="text-neutral-400" />
                    Assigned To
                  </label>
                  <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
                    {task.assignedToUserName || <span className="text-neutral-400 italic">Unassigned</span>}
                  </p>
                </div>

                {/* Created By */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">Created By</label>
                  <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">{task.assignedByUserName || "Unknown"}</p>
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                      <Calendar size={12} className="text-neutral-400" />
                      Due Date
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200 flex-1">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      {task.isOverdue && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                    <Clock size={12} className="text-neutral-400" />
                    Created
                  </label>
                  <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
                    {new Date(task.createdDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Task Type & Category */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg shadow-neutral-100/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200/60 bg-gradient-to-r from-neutral-50/50 to-white">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Tag size={14} className="text-blue-500" />
                  Classification
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">Type</label>
                  <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">{task.taskTypeDisplay || "Feature"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield size={12} className="text-neutral-400" />
                    Risk Level
                  </label>
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm border ${
                    task.riskLevel === 0 ? "bg-green-100 text-green-700 border-green-200" :
                    task.riskLevel === 1 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                    task.riskLevel === 2 ? "bg-orange-100 text-orange-700 border-orange-200" :
                    "bg-red-100 text-red-700 border-red-200"
                  }`}>
                    <Shield size={12} />
                    {task.riskLevel === 0 ? "Low" : 
                     task.riskLevel === 1 ? "Medium" :
                     task.riskLevel === 2 ? "High" : "Critical"}
                  </span>
                </div>
              </div>
            </div>

            {/* Reviewer & Additional Info */}
            {(task.reviewerName || task.startDate || task.actualStartDate || task.completedDate) && (
              <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-lg shadow-neutral-100/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200/60 bg-gradient-to-r from-neutral-50/50 to-white">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Circle size={12} className="text-blue-500 fill-current" />
                    Additional Information
                  </h3>
                </div>
                <div className="p-5 space-y-5">
                  {task.reviewerName && (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                        <User size={12} className="text-neutral-400" />
                        Reviewer
                      </label>
                      <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">{task.reviewerName}</p>
                    </div>
                  )}
                  {task.startDate && (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                        <Calendar size={12} className="text-neutral-400" />
                        Start Date
                      </label>
                      <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
                        {new Date(task.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {task.actualStartDate && (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                        <Calendar size={12} className="text-neutral-400" />
                        Actual Start Date
                      </label>
                      <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
                        {new Date(task.actualStartDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {task.completedDate && (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2.5 uppercase tracking-wide">
                        <Calendar size={12} className="text-neutral-400" />
                        Completed Date
                      </label>
                      <p className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200">
                        {new Date(task.completedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
