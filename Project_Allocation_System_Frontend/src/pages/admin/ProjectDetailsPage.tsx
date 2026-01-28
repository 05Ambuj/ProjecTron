import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import { fetchAdminProjectById, updateAdminProject, deleteAdminProject, fetchAdminProjectAllocations } from "../../api/admin";
import ProjectManagerSelectModal from "../../components/project/ProjectManagerSelectModal";
import type { ProjectDto, UpdateProjectRequest } from "../../types/adminTypes";
import type { ProjectAllocationDTO } from "../../types/pmTypes";
import { UserRole } from "../../constants/roles";
import {
  ArrowLeft,
  ArrowRight,
  FolderKanban,
  Calendar,
  Users,
  Building2,
  Clock,
  FileText,
  CheckSquare,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";

/* ============================================================
   Project Details Page (Admin)
   ============================================================ */

export default function ProjectDetailsPage() {
  /* ---------------- Route Param (SAFE) ---------------- */
  const params = useParams<{ projectId?: string }>();
  const projectIdParam = params.projectId;
  const navigate = useNavigate();

  /* ---------------- State ---------------- */
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [draft, setDraft] = useState<ProjectDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'project' | 'team'>('project');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allocations, setAllocations] = useState<ProjectAllocationDTO[]>([]);

  const [error, setError] = useState<string | null>(null);
 
  const userRoleValue = useSelector(
    (state: RootState) => state.auth.user?.role,
  );
  const { showSuccess, showError } = useToast();

  const actorRole = userRoleValue as UserRole | undefined;
  const isAdmin = actorRole === UserRole.Admin;
  /* ---------------- Load ---------------- */
  useEffect(() => {
    if (!projectIdParam) {
      setError("Invalid project id");
      setLoading(false);
      return;
    }

    const projectId: string = projectIdParam;

    let mounted = true;

    async function load() {
      try {
        if (!actorRole) throw new Error("User role not available");
        const data = await fetchAdminProjectById(projectId, actorRole);
        if (mounted) {
          setProject(data);
          setDraft({ ...data });
        }
        
        // Also fetch allocations
        try {
          const allocationData = await fetchAdminProjectAllocations(projectId);
          if (mounted) {
            setAllocations(allocationData);
          }
        } catch {
          // Silently fail for allocations - not critical
          console.warn("Failed to load allocations");
        }
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [projectIdParam,actorRole]);

  /* ---------------- Change Detection ---------------- */
  const hasChanges = useMemo(() => {
    if (!project || !draft) return false;
    return JSON.stringify(project) !== JSON.stringify(draft);
  }, [project, draft]);

  /* ---------------- Project Manager (Optimistic) ---------------- */
  function handleProjectManagerUpdate(pm: {
    userId: string;
    displayName: string;
  }) {
    if (!draft) return;

    setDraft({
      ...draft,
      projectManagerId: pm.userId,
      projectManagerName: pm.displayName,
    });

    setPmModalOpen(false);
  }

  /* ---------------- Save ---------------- */
  async function saveChanges() {
    if (!draft || !projectIdParam || !project) return;

    const projectId: string = projectIdParam;

    const payload: UpdateProjectRequest = {
      name: draft.name,
      description: draft.description ?? "",
      status: draft.status,
      priority: draft.priority,
      startDate: draft.startDate,
      endDate: draft.endDate,
      budget: draft.budget,
      // Include projectManagerId if it exists and is different from original
      // Backend will validate and only reassign if different
      projectManagerId: draft.projectManagerId && draft.projectManagerId.trim() !== "" 
        ? draft.projectManagerId 
        : undefined,
    };

    try {
      setSaving(true);
      if (!actorRole) throw new Error("User role not available");
      if (new Date(draft.endDate) < new Date(draft.startDate)) {
        setError("End date cannot be earlier than start date");
        return;
      }
      const updated = await updateAdminProject(projectId, payload, actorRole);
      setProject(updated);
      setDraft(updated);
      setConfirmOpen(false);
      showSuccess("Project updated successfully");
    } catch (e) {
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- Delete ---------------- */
  async function handleDeleteProject() {
    if (!projectIdParam || !actorRole) return;

    try {
      setDeleting(true);
      await deleteAdminProject(projectIdParam, actorRole);
      showSuccess("Project deleted successfully");
      navigate("/admin/projects");
    } catch (e) {
      const errorMessage = (e as Error).message;
      showError(errorMessage);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  /* ---------------- UI States ---------------- */
  if (loading) {
    return <LoadingPage message="Loading project..." />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!project || !draft) return null;

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Back Button & Delete */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} />
            Delete Project
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================= Header ================= */}
      <header className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary-50 shrink-0">
              <FolderKanban size={20} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="text-2xl font-bold text-neutral-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 -ml-2 w-full"
              />
              <p className="text-xs text-neutral-600 mt-0.5">
                {project.code} · {project.organizationName}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 ml-4">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                getStatusColor(draft.status)
              }`}
            >
              {statusLabel(draft.status)}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                getPriorityColor(draft.priority)
              }`}
            >
              {priorityLabel(draft.priority)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-neutral-700">Project Progress</span>
            <span className="text-xs font-semibold text-neutral-900">{draft.progressPercentage || 0}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${draft.progressPercentage || 0}%` }}
            />
          </div>
        </div>
      </header>

      {/* ================= Layout ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ---------- LEFT ---------- */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tasks Link */}
          <Section title="Tasks">
            <Link
              to={`/admin/tasks?projectId=${project.projectId}`}
              className="group flex items-center justify-between p-4 rounded-lg border-2 border-neutral-200 hover:border-primary-400 hover:bg-primary-50/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                  <CheckSquare size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                    View All Tasks
                  </h3>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Manage and track project tasks
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-neutral-400 group-hover:text-primary-600 transition-colors" />
            </Link>
          </Section>

          {/* Description & Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <Section title="Project Description">
              <textarea
                className="min-h-48 w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="Describe scope, objectives, risks, dependencies, milestones, and expectations…"
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Section>

            {/* Documents */}
            <Section title="Documents">
              <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center h-50 flex flex-col justify-center">
                <FileText size={28} className="mx-auto text-neutral-400 mb-2" />
                <div className="font-medium text-neutral-800 mb-1 text-sm">
                  Project documents
                </div>
                <div className="text-xs text-neutral-500 mb-3">
                  Specifications, designs, contracts, reports
                </div>
                <button
                  disabled
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-500 cursor-not-allowed"
                >
                  Upload files (coming soon)
                </button>
              </div>
            </Section>
          </div>

          {/* Quick Actions */}
          <Section title="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to={`/admin/tasks?projectId=${project.projectId}`}
                className="group flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all"
              >
                <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                  <CheckSquare size={18} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                    All Tasks
                  </h3>
                  <p className="text-xs text-neutral-600">View and filter tasks</p>
                </div>
              </Link>
              <Link
                to={`/admin/projects`}
                className="group flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
              >
                <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <FolderKanban size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors">
                    All Projects
                  </h3>
                  <p className="text-xs text-neutral-600">Manage projects</p>
                </div>
              </Link>
              <div className="group flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                <div className="p-2 rounded-lg bg-neutral-100">
                  <FileText size={18} className="text-neutral-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-neutral-700">
                    Reports
                  </h3>
                  <p className="text-xs text-neutral-600">Coming soon</p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ---------- RIGHT ---------- */}
        <div className="lg:col-span-4 space-y-4">
          {/* Project Information & Team - Tabbed */}
          <Section title="Project Details">
            {/* Tab Navigation */}
            <div className="flex border-b border-neutral-200 mb-4">
              <button
                onClick={() => setActiveTab('project')}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  activeTab === 'project'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Project Info
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                  activeTab === 'team'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Team Info
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'project' && (
              <div className="space-y-3">
                <InfoRow label="Organization" value={draft.organizationName || "N/A"} icon={Building2} />
                <InfoRow label="Project Manager" value={draft.projectManagerName || "Unassigned"} icon={Users} />
                <InfoRow label="Created Date" value={draft.createdDate ? new Date(draft.createdDate).toLocaleDateString() : "N/A"} icon={Clock} />
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setPmModalOpen(true)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      Change Project Manager
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-3">
                {(() => {
                  console.log('Admin Allocations:', allocations);
                  const teamLead = allocations.find((a) => a.role === UserRole.TeamLead);
                  const teamMembers = allocations.filter((a) => a.role === UserRole.TeamMember);
                  console.log('Admin Team lead:', teamLead);
                  console.log('Admin Team members:', teamMembers);

                  return (
                    <>
                      <InfoRow
                        label="Team Lead"
                        value={teamLead ? teamLead.userName : "Unassigned"}
                        icon={Users}
                      />
                      <InfoRow
                        label="Team Members"
                        value={`${teamMembers.length} member${teamMembers.length === 1 ? "" : "s"}`}
                        icon={Users}
                      />
                      {teamMembers.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-100">
                          <p className="text-xs font-medium text-neutral-500 mb-2">Members:</p>
                          <div className="space-y-1">
                            {teamMembers.map((member) => (
                              <div key={member.userId} className="text-sm text-neutral-700">
                                {member.userName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </Section>

          {/* Status & Priority - Combined */}
          <Section title="Status & Priority">
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: Number(e.target.value) })}
                >
                  <option value={1}>Planned</option>
                  <option value={2}>In Progress</option>
                  <option value={3}>On Hold</option>
                  <option value={4}>Completed</option>
                  <option value={5}>Cancelled</option>
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
                >
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Critical</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Timeline & Budget - Combined */}
          <Section title="Timeline & Budget">
            <div className="space-y-4">
              {/* Dates in same row */}
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label="Start Date"
                  value={draft.startDate}
                  onChange={(v) => setDraft({ ...draft, startDate: v })}
                />
                <DateField
                  label="End Date"
                  value={draft.endDate}
                  onChange={(v) => setDraft({ ...draft, endDate: v })}
                />
              </div>
              <div>
                <Label>Budget</Label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  value={draft.budget ?? 0}
                  onChange={(e) =>
                    setDraft({ ...draft, budget: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ================= Save Bar ================= */}
      {hasChanges && (
        <div className="sticky bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur supports-backdrop-filter:backdrop-blur shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex max-w-7xl justify-end gap-3 px-6 py-4">
            <button
              onClick={() => {
                setDraft(project ? { ...project } : null);
                setError(null);
              }}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmModal
          loading={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={saveChanges}
        />
      )}

      {isAdmin && pmModalOpen && (
        <ProjectManagerSelectModal
          onClose={() => setPmModalOpen(false)}
          onSelect={handleProjectManagerUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <DeleteProjectModal
          projectName={project.name}
          loading={deleting}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteProject}
        />
      )}
    </div>
  );
}

/* ============================================================
   UI Components (unchanged)
   ============================================================ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-neutral-500 mb-2">{children}</div>;
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="date"
          value={value.slice(0, 10)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 pr-10 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <Calendar size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      </div>
    </div>
  );
}

function ConfirmModal({
  loading,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-900">Confirm Save</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Save all project changes?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteProjectModal({
  projectName,
  loading,
  onCancel,
  onConfirm,
}: {
  projectName: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Delete Project</h3>
              <p className="text-sm text-neutral-500">This action cannot be undone</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-4">
          <p className="text-sm text-neutral-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-900">"{projectName}"</span>?
            This will permanently remove the project, all tasks, sprints, and associated data.
          </p>
        </div>
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function statusLabel(v: number) {
  return ["Planned", "In Progress", "On Hold", "Completed", "Cancelled"][v - 1] || `Status ${v}`;
}

function priorityLabel(v: number) {
  return ["Low", "Medium", "High", "Critical"][v - 1] || `Priority ${v}`;
}

function getStatusColor(status: number): string {
  const colors: Record<number, string> = {
    1: "bg-slate-100 text-slate-700 border-slate-200",
    2: "bg-blue-100 text-blue-700 border-blue-200",
    3: "bg-amber-100 text-amber-700 border-amber-200",
    4: "bg-green-100 text-green-700 border-green-200",
    5: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[status] || "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function getPriorityColor(priority: number): string {
  const colors: Record<number, string> = {
    1: "bg-green-100 text-green-700 border-green-200",
    2: "bg-blue-100 text-blue-700 border-blue-200",
    3: "bg-amber-100 text-amber-700 border-amber-200",
    4: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[priority] || "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <div className="p-1.5 rounded-lg bg-primary-50 mt-0.5 shrink-0">
        <Icon size={14} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-neutral-900 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

